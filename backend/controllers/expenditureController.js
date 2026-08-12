import db from "../config/db.js";

export const createExpenditure = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      baseId,
      equipmentTypeId,
      quantity,
      reason,
    } = req.body;

    if (!baseId || !equipmentTypeId || !quantity) {
      return res.status(400).json({
        success: false,
        message:
          "baseId, equipmentTypeId and quantity are required.",
      });
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    if (
      req.user.role === "BASE_COMMANDER" &&
      Number(baseId) !== Number(req.user.baseId)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only record expenditure for your base.",
      });
    }

    await client.query("BEGIN");

    const stockResult = await client.query(
      `
      SELECT
        (
          COALESCE((
            SELECT SUM(quantity)
            FROM purchases
            WHERE base_id = $1
              AND equipment_type_id = $2
          ), 0)

          +

          COALESCE((
            SELECT SUM(quantity)
            FROM transfers
            WHERE destination_base_id = $1
              AND equipment_type_id = $2
              AND status = 'COMPLETED'
          ), 0)

          -

          COALESCE((
            SELECT SUM(quantity)
            FROM transfers
            WHERE source_base_id = $1
              AND equipment_type_id = $2
              AND status = 'COMPLETED'
          ), 0)

          -

          COALESCE((
            SELECT SUM(quantity)
            FROM assignments
            WHERE base_id = $1
              AND equipment_type_id = $2
          ), 0)

          -

          COALESCE((
            SELECT SUM(quantity)
            FROM expenditures
            WHERE base_id = $1
              AND equipment_type_id = $2
          ), 0)
        ) AS available_stock
      `,
      [baseId, equipmentTypeId]
    );

    const availableStock = Number(
      stockResult.rows[0].available_stock
    );

    if (availableStock < Number(quantity)) {
      throw new Error(
        `Insufficient stock. Available: ${availableStock}, requested: ${quantity}.`
      );
    }

    const result = await client.query(
      `
      INSERT INTO expenditures
      (
        base_id,
        equipment_type_id,
        quantity,
        reason,
        recorded_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        base_id AS "baseId",
        equipment_type_id AS "equipmentTypeId",
        quantity,
        reason,
        recorded_by AS "recordedBy",
        expended_at AS "expendedAt"
      `,
      [
        baseId,
        equipmentTypeId,
        quantity,
        reason || null,
        req.user.id,
      ]
    );

    const expenditure = result.rows[0];

    await client.query(
      `
      INSERT INTO audit_logs
      (user_id, action, details)
      VALUES ($1, 'EXPENDITURE', $2)
      `,
      [
        req.user.id,
        `Expended ${quantity} unit(s) of equipment type ${equipmentTypeId} at base ${baseId}. Reason: ${reason || "Not specified"}`,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Expenditure recorded successfully.",
      expenditure,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create expenditure error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  } finally {
    client.release();
  }
};


export const getExpenditures = async (req, res) => {
  try {
    const requestedBaseId = req.query.baseId;

    const effectiveBaseId =
      req.user.role === "BASE_COMMANDER"
        ? req.user.baseId
        : requestedBaseId || null;

    const result = await db.query(
      `
      SELECT
        x.id,
        x.base_id AS "baseId",
        b.name AS "baseName",
        x.equipment_type_id AS "equipmentTypeId",
        e.name AS "equipmentName",
        e.category,
        x.quantity,
        x.reason,
        x.recorded_by AS "recordedBy",
        u.username AS "recordedByUsername",
        x.expended_at AS "expendedAt"
      FROM expenditures x
      JOIN bases b ON b.id = x.base_id
      JOIN equipment_types e
        ON e.id = x.equipment_type_id
      LEFT JOIN users u
        ON u.id = x.recorded_by
      WHERE ($1::INT IS NULL OR x.base_id = $1)
      ORDER BY x.expended_at DESC
      `,
      [effectiveBaseId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      expenditures: result.rows,
    });

  } catch (error) {
    console.error("Get expenditures error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve expenditures.",
    });
  }
};