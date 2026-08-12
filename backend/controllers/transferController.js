import db from "../config/db.js";

// =====================================================
// CREATE TRANSFER
// =====================================================

export const createTransfer = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      sourceBaseId,
      destinationBaseId,
      equipmentTypeId,
      quantity,
    } = req.body;

    // -------------------------------------------------
    // Validate input
    // -------------------------------------------------

    if (
      !sourceBaseId ||
      !destinationBaseId ||
      !equipmentTypeId ||
      !quantity
    ) {
      return res.status(400).json({
        success: false,
        message:
          "sourceBaseId, destinationBaseId, equipmentTypeId and quantity are required.",
      });
    }

    if (
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive integer.",
      });
    }

    if (
      Number(sourceBaseId) === Number(destinationBaseId)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Source and destination bases must be different.",
      });
    }

    // -------------------------------------------------
    // Base Commander can only operate from own base
    // -------------------------------------------------

    if (
      req.user.role === "BASE_COMMANDER" &&
      Number(sourceBaseId) !== Number(req.user.baseId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Base Commander can only transfer assets from their assigned base.",
      });
    }

    await client.query("BEGIN");

    // -------------------------------------------------
    // Prevent concurrent transfers for same
    // base/equipment combination.
    // -------------------------------------------------

    await client.query(
      `
      SELECT pg_advisory_xact_lock(
        hashtext($1)
      )
      `,
      [`transfer:${sourceBaseId}:${equipmentTypeId}`]
    );

    // -------------------------------------------------
    // Verify source base
    // -------------------------------------------------

    const sourceBaseResult = await client.query(
      `
      SELECT id, name
      FROM bases
      WHERE id = $1
      `,
      [sourceBaseId]
    );

    if (sourceBaseResult.rows.length === 0) {
      throw new Error("Source base not found.");
    }

    // -------------------------------------------------
    // Verify destination base
    // -------------------------------------------------

    const destinationBaseResult = await client.query(
      `
      SELECT id, name
      FROM bases
      WHERE id = $1
      `,
      [destinationBaseId]
    );

    if (destinationBaseResult.rows.length === 0) {
      throw new Error("Destination base not found.");
    }

    // -------------------------------------------------
    // Verify equipment
    // -------------------------------------------------

    const equipmentResult = await client.query(
      `
      SELECT id, name, category
      FROM equipment_types
      WHERE id = $1
      `,
      [equipmentTypeId]
    );

    if (equipmentResult.rows.length === 0) {
      throw new Error("Equipment type not found.");
    }

    // -------------------------------------------------
    // Calculate available stock
    //
    // Stock =
    // Purchases
    // + Transfers In
    // - Transfers Out
    // - Assignments
    // - Expenditures
    // -------------------------------------------------

    const stockResult = await client.query(
      `
      SELECT
        (
          COALESCE(
            (
              SELECT SUM(quantity)
              FROM purchases
              WHERE base_id = $1
                AND equipment_type_id = $2
            ),
            0
          )

          +

          COALESCE(
            (
              SELECT SUM(quantity)
              FROM transfers
              WHERE destination_base_id = $1
                AND equipment_type_id = $2
                AND status = 'COMPLETED'
            ),
            0
          )

          -

          COALESCE(
            (
              SELECT SUM(quantity)
              FROM transfers
              WHERE source_base_id = $1
                AND equipment_type_id = $2
                AND status = 'COMPLETED'
            ),
            0
          )

          -

          COALESCE(
            (
              SELECT SUM(quantity)
              FROM assignments
              WHERE base_id = $1
                AND equipment_type_id = $2
            ),
            0
          )

          -

          COALESCE(
            (
              SELECT SUM(quantity)
              FROM expenditures
              WHERE base_id = $1
                AND equipment_type_id = $2
            ),
            0
          )
        ) AS available_stock
      `,
      [sourceBaseId, equipmentTypeId]
    );

    const availableStock = Number(
      stockResult.rows[0].available_stock
    );

    // -------------------------------------------------
    // Stock validation
    // -------------------------------------------------

    if (availableStock < Number(quantity)) {
      throw new Error(
        `Insufficient stock. Available: ${availableStock}, requested: ${quantity}.`
      );
    }

    // -------------------------------------------------
    // Create transfer
    // -------------------------------------------------

    const transferResult = await client.query(
      `
      INSERT INTO transfers
      (
        source_base_id,
        destination_base_id,
        equipment_type_id,
        quantity,
        status,
        initiated_by
      )
      VALUES
      (
        $1,
        $2,
        $3,
        $4,
        'COMPLETED',
        $5
      )
      RETURNING
        id,
        source_base_id AS "sourceBaseId",
        destination_base_id AS "destinationBaseId",
        equipment_type_id AS "equipmentTypeId",
        quantity,
        status,
        initiated_by AS "initiatedBy",
        timestamp
      `,
      [
        sourceBaseId,
        destinationBaseId,
        equipmentTypeId,
        quantity,
        req.user.id,
      ]
    );

    const transfer = transferResult.rows[0];

    // -------------------------------------------------
    // Audit log
    // -------------------------------------------------

    await client.query(
      `
      INSERT INTO audit_logs
      (
        user_id,
        action,
        details
      )
      VALUES
      (
        $1,
        'TRANSFER',
        $2
      )
      `,
      [
        req.user.id,
        `Transferred ${quantity} unit(s) of ${equipmentResult.rows[0].name} from ${sourceBaseResult.rows[0].name} to ${destinationBaseResult.rows[0].name}`,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Transfer completed successfully.",
      transfer,
      stock: {
        sourceBaseAvailableBeforeTransfer: availableStock,
        sourceBaseAvailableAfterTransfer:
          availableStock - Number(quantity),
      },
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create transfer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });

  } finally {
    client.release();
  }
};


// =====================================================
// GET TRANSFERS
// =====================================================

export const getTransfers = async (req, res) => {
  try {
    const {
      baseId,
      equipmentTypeId,
    } = req.query;

    let conditions = [];
    let values = [];
    let parameterIndex = 1;

    // -------------------------------------------------
    // Base Commander sees only own base transfers
    // -------------------------------------------------

    if (req.user.role === "BASE_COMMANDER") {
      conditions.push(
        `(t.source_base_id = $${parameterIndex}
          OR t.destination_base_id = $${parameterIndex})`
      );

      values.push(req.user.baseId);
      parameterIndex++;

    } else if (baseId) {
      conditions.push(
        `(t.source_base_id = $${parameterIndex}
          OR t.destination_base_id = $${parameterIndex})`
      );

      values.push(baseId);
      parameterIndex++;
    }

    if (equipmentTypeId) {
      conditions.push(
        `t.equipment_type_id = $${parameterIndex}`
      );

      values.push(equipmentTypeId);
      parameterIndex++;
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await db.query(
      `
      SELECT
        t.id,

        t.source_base_id AS "sourceBaseId",
        sb.name AS "sourceBaseName",

        t.destination_base_id AS "destinationBaseId",
        db.name AS "destinationBaseName",

        t.equipment_type_id AS "equipmentTypeId",
        e.name AS "equipmentName",
        e.category,

        t.quantity,
        t.status,

        t.initiated_by AS "initiatedBy",
        u.username AS "initiatedByUsername",

        t.timestamp

      FROM transfers t

      JOIN bases sb
        ON sb.id = t.source_base_id

      JOIN bases db
        ON db.id = t.destination_base_id

      JOIN equipment_types e
        ON e.id = t.equipment_type_id

      LEFT JOIN users u
        ON u.id = t.initiated_by

      ${whereClause}

      ORDER BY t.timestamp DESC
      `,
      values
    );

    return res.status(200).json({
      success: true,
      count: result.rows.length,
      transfers: result.rows,
    });

  } catch (error) {
    console.error("Get transfers error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transfers.",
      error: error.message,
    });
  }
};