import db from "../config/db.js";

export const createAssignment = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      baseId,
      equipmentTypeId,
      personnelName,
      quantity,
    } = req.body;

    if (!baseId || !equipmentTypeId || !personnelName || !quantity) {
      return res.status(400).json({
        success: false,
        message:
          "baseId, equipmentTypeId, personnelName and quantity are required.",
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
        message: "You can only assign assets from your base.",
      });
    }

    await client.query("BEGIN");

    // Calculate available stock
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

    // Create assignment
    const result = await client.query(
      `
      INSERT INTO assignments
      (
        base_id,
        equipment_type_id,
        personnel_name,
        quantity,
        assigned_by
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        base_id AS "baseId",
        equipment_type_id AS "equipmentTypeId",
        personnel_name AS "personnelName",
        quantity,
        assigned_by AS "assignedBy",
        assigned_at AS "assignedAt"
      `,
      [
        baseId,
        equipmentTypeId,
        personnelName,
        quantity,
        req.user.id,
      ]
    );

    const assignment = result.rows[0];

    // Audit
    await client.query(
      `
      INSERT INTO audit_logs
      (user_id, action, details)
      VALUES ($1, 'ASSIGNMENT', $2)
      `,
      [
        req.user.id,
        `Assigned ${quantity} unit(s) of equipment type ${equipmentTypeId} to ${personnelName} at base ${baseId}`,
      ]
    );

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      message: "Assignment recorded successfully.",
      assignment,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create assignment error:", error);

    res.status(400).json({
      success: false,
      message: error.message,
    });

  } finally {
    client.release();
  }
};


export const getAssignments = async (req, res) => {
  try {
    const requestedBaseId = req.query.baseId;

    const effectiveBaseId =
      req.user.role === "BASE_COMMANDER"
        ? req.user.baseId
        : requestedBaseId || null;

    const result = await db.query(
      `
      SELECT
        a.id,
        a.base_id AS "baseId",
        b.name AS "baseName",
        a.equipment_type_id AS "equipmentTypeId",
        e.name AS "equipmentName",
        e.category,
        a.personnel_name AS "personnelName",
        a.quantity,
        a.assigned_by AS "assignedBy",
        u.username AS "assignedByUsername",
        a.assigned_at AS "assignedAt"
      FROM assignments a
      JOIN bases b ON b.id = a.base_id
      JOIN equipment_types e ON e.id = a.equipment_type_id
      LEFT JOIN users u ON u.id = a.assigned_by
      WHERE ($1::INT IS NULL OR a.base_id = $1)
      ORDER BY a.assigned_at DESC
      `,
      [effectiveBaseId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      assignments: result.rows,
    });

  } catch (error) {
    console.error("Get assignments error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve assignments.",
    });
  }
};