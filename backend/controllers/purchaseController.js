import db from "../config/db.js";


// =====================================================
// CREATE PURCHASE
// =====================================================

export const createPurchase = async (req, res) => {
  const client = await db.connect();

  try {
    const {
      baseId,
      equipmentTypeId,
      quantity,
      purchaseDate,
    } = req.body;

    // ---------------------------------------------
    // Validate input
    // ---------------------------------------------

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

    // ---------------------------------------------
    // Base Commander protection
    // ---------------------------------------------

    if (
      req.user.role === "BASE_COMMANDER" &&
      Number(baseId) !== Number(req.user.baseId)
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Base Commander can only create purchases for their assigned base.",
      });
    }

    await client.query("BEGIN");

    // ---------------------------------------------
    // Verify base
    // ---------------------------------------------

    const baseResult = await client.query(
      `
      SELECT id, name
      FROM bases
      WHERE id = $1
      `,
      [baseId]
    );

    if (baseResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Base not found.",
      });
    }

    // ---------------------------------------------
    // Verify equipment type
    // ---------------------------------------------

    const equipmentResult = await client.query(
      `
      SELECT id, name, category
      FROM equipment_types
      WHERE id = $1
      `,
      [equipmentTypeId]
    );

    if (equipmentResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        success: false,
        message: "Equipment type not found.",
      });
    }

    // ---------------------------------------------
    // Create purchase
    // ---------------------------------------------

    const purchaseResult = await client.query(
      `
      INSERT INTO purchases
        (
          base_id,
          equipment_type_id,
          quantity,
          purchase_date,
          created_by
        )
      VALUES
        ($1, $2, $3, COALESCE($4::TIMESTAMP, CURRENT_TIMESTAMP), $5)
      RETURNING
        id,
        base_id,
        equipment_type_id,
        quantity,
        purchase_date,
        created_by
      `,
      [
        baseId,
        equipmentTypeId,
        quantity,
        purchaseDate || null,
        req.user.id,
      ]
    );

    const purchase = purchaseResult.rows[0];

    // ---------------------------------------------
    // Audit log
    // ---------------------------------------------

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
          'PURCHASE',
          $2
        )
      `,
      [
        req.user.id,
        `Purchased ${quantity} unit(s) of ${equipmentResult.rows[0].name} for ${baseResult.rows[0].name}`,
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      success: true,
      message: "Purchase recorded successfully.",
      purchase,
    });

  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create purchase error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create purchase.",
      error: error.message,
    });

  } finally {
    client.release();
  }
};


// =====================================================
// GET PURCHASES
// =====================================================

export const getPurchases = async (req, res) => {
  try {
    const {
      baseId,
      equipmentTypeId,
    } = req.query;

    // Base Commander is forced to their own base
    const effectiveBaseId =
      req.user.role === "BASE_COMMANDER"
        ? req.user.baseId
        : baseId || null;

    const result = await db.query(
      `
      SELECT
        p.id,

        p.base_id AS "baseId",
        b.name AS "baseName",

        p.equipment_type_id AS "equipmentTypeId",
        e.name AS "equipmentName",
        e.category,

        p.quantity,

        p.purchase_date AS "purchaseDate",

        p.created_by AS "createdBy",
        u.username AS "createdByUsername"

      FROM purchases p

      JOIN bases b
        ON b.id = p.base_id

      JOIN equipment_types e
        ON e.id = p.equipment_type_id

      LEFT JOIN users u
        ON u.id = p.created_by

      WHERE
        ($1::INT IS NULL OR p.base_id = $1)
        AND
        ($2::INT IS NULL OR p.equipment_type_id = $2)

      ORDER BY p.purchase_date DESC
      `,
      [
        effectiveBaseId,
        equipmentTypeId || null,
      ]
    );

    return res.status(200).json({
      success: true,

      filters: {
        baseId: effectiveBaseId,
        equipmentTypeId: equipmentTypeId || null,
      },

      count: result.rows.length,

      purchases: result.rows,
    });

  } catch (error) {
    console.error("Get purchases error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve purchases.",
      error: error.message,
    });
  }
};