import db from "../config/db.js";

export const getDashboardMetrics = async (req, res) => {
  try {
    const {
      baseId,
      equipmentTypeId,
      startDate,
      endDate,
    } = req.query;

    /*
      Base Commander:
      force their own base regardless of query parameters.
    */
    const effectiveBaseId =
      req.user.role === "BASE_COMMANDER"
        ? req.user.baseId
        : baseId || null;

    /*
      We calculate inventory from transaction history.

      Opening Balance:
      All purchases + transfers in - transfers out
      before startDate.

      Current-period movement:
      Purchases + transfers in - transfers out
      between startDate and endDate.

      Assigned and expended are deducted from the
      selected period.
    */

    const query = `
      WITH

      opening_purchases AS (
    SELECT
        COALESCE(SUM(quantity), 0) AS quantity
    FROM purchases
    WHERE ($1::INT IS NULL OR base_id = $1)
      AND ($2::INT IS NULL OR equipment_type_id = $2)
      AND $3::TIMESTAMP IS NOT NULL
      AND purchase_date < $3
),

      opening_transfer_in AS (
        SELECT COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR destination_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NOT NULL
            OR timestamp < $3
          )
      ),

      opening_transfer_out AS (
    SELECT
        COALESCE(SUM(quantity), 0) AS quantity
    FROM transfers
    WHERE status = 'COMPLETED'
      AND ($1::INT IS NULL OR source_base_id = $1)
      AND ($2::INT IS NULL OR equipment_type_id = $2)
      AND $3::TIMESTAMP IS NOT NULL
      AND timestamp < $3
),

      period_purchases AS (
        SELECT COALESCE(SUM(quantity), 0) AS quantity
        FROM purchases
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR purchase_date >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR purchase_date <= $4
          )
      ),

      period_transfer_in AS (
        SELECT COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR destination_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR timestamp >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR timestamp <= $4
          )
      ),

      period_transfer_out AS (
        SELECT COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR source_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR timestamp >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR timestamp <= $4
          )
      ),

      period_assignments AS (
        SELECT COALESCE(SUM(quantity), 0) AS quantity
        FROM assignments
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR assigned_at >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR assigned_at <= $4
          )
      ),

      period_expenditures AS (
        SELECT COALESCE(SUM(quantity), 0) AS quantity
        FROM expenditures
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR expended_at >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR expended_at <= $4
          )
      )

      SELECT

        (
          op.quantity
          + oti.quantity
          - oto.quantity
        ) AS opening_balance,

        pp.quantity AS purchases,

        pti.quantity AS transfers_in,

        pto.quantity AS transfers_out,

        (
          pp.quantity
          + pti.quantity
          - pto.quantity
        ) AS net_movement,

        pa.quantity AS assigned,

        pe.quantity AS expended,

        (
          op.quantity
          + oti.quantity
          - oto.quantity
          + pp.quantity
          + pti.quantity
          - pto.quantity
          - pa.quantity
          - pe.quantity
        ) AS closing_balance

      FROM opening_purchases op
      CROSS JOIN opening_transfer_in oti
      CROSS JOIN opening_transfer_out oto
      CROSS JOIN period_purchases pp
      CROSS JOIN period_transfer_in pti
      CROSS JOIN period_transfer_out pto
      CROSS JOIN period_assignments pa
      CROSS JOIN period_expenditures pe;
    `;

    const values = [
      effectiveBaseId,
      equipmentTypeId || null,
      startDate || null,
      endDate || null,
    ];

    const result = await db.query(query, values);

    const metrics = result.rows[0];

    return res.status(200).json({
      success: true,

      filters: {
        baseId: effectiveBaseId,
        equipmentTypeId: equipmentTypeId || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },

      metrics: {
        openingBalance: Number(metrics.opening_balance),
        purchases: Number(metrics.purchases),
        transfersIn: Number(metrics.transfers_in),
        transfersOut: Number(metrics.transfers_out),
        netMovement: Number(metrics.net_movement),
        assigned: Number(metrics.assigned),
        expended: Number(metrics.expended),
        closingBalance: Number(metrics.closing_balance),
      },
    });

  } catch (error) {
    console.error("Dashboard metrics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to calculate dashboard metrics.",
      error: error.message,
    });
  }
};

export const getInventory = async (req, res) => {
  try {
    const {
      baseId,
      equipmentTypeId,
      startDate,
      endDate,
    } = req.query;

    /*
     * Base Commander can only see their own base.
     */
    const effectiveBaseId =
      req.user.role === "BASE_COMMANDER"
        ? req.user.baseId
        : baseId || null;

    const query = `
      WITH base_equipment AS (

        SELECT DISTINCT
          base_id,
          equipment_type_id
        FROM purchases

        UNION

        SELECT DISTINCT
          destination_base_id AS base_id,
          equipment_type_id
        FROM transfers
        WHERE status = 'COMPLETED'

        UNION

        SELECT DISTINCT
          source_base_id AS base_id,
          equipment_type_id
        FROM transfers
        WHERE status = 'COMPLETED'

        UNION

        SELECT DISTINCT
          base_id,
          equipment_type_id
        FROM assignments

        UNION

        SELECT DISTINCT
          base_id,
          equipment_type_id
        FROM expenditures
      ),

      opening_purchases AS (
        SELECT
          base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM purchases
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NOT NULL
            AND purchase_date < $3
          )
        GROUP BY
          base_id,
          equipment_type_id
      ),

      opening_transfer_in AS (
        SELECT
          destination_base_id AS base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR destination_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NOT NULL
            AND timestamp < $3
          )
        GROUP BY
          destination_base_id,
          equipment_type_id
      ),

      opening_transfer_out AS (
        SELECT
          source_base_id AS base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR source_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NOT NULL
            AND timestamp < $3
          )
        GROUP BY
          source_base_id,
          equipment_type_id
      ),

      period_purchases AS (
        SELECT
          base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM purchases
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR purchase_date >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR purchase_date <= $4
          )
        GROUP BY
          base_id,
          equipment_type_id
      ),

      period_transfer_in AS (
        SELECT
          destination_base_id AS base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR destination_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR timestamp >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR timestamp <= $4
          )
        GROUP BY
          destination_base_id,
          equipment_type_id
      ),

      period_transfer_out AS (
        SELECT
          source_base_id AS base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM transfers
        WHERE status = 'COMPLETED'
          AND ($1::INT IS NULL OR source_base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR timestamp >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR timestamp <= $4
          )
        GROUP BY
          source_base_id,
          equipment_type_id
      ),

      period_assignments AS (
        SELECT
          base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM assignments
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR assigned_at >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR assigned_at <= $4
          )
        GROUP BY
          base_id,
          equipment_type_id
      ),

      period_expenditures AS (
        SELECT
          base_id,
          equipment_type_id,
          COALESCE(SUM(quantity), 0) AS quantity
        FROM expenditures
        WHERE ($1::INT IS NULL OR base_id = $1)
          AND ($2::INT IS NULL OR equipment_type_id = $2)
          AND (
            $3::TIMESTAMP IS NULL
            OR expended_at >= $3
          )
          AND (
            $4::TIMESTAMP IS NULL
            OR expended_at <= $4
          )
        GROUP BY
          base_id,
          equipment_type_id
      )

      SELECT

        be.base_id,

        b.name AS base_name,

        be.equipment_type_id,

        et.name AS equipment_name,

        et.category AS category,

        COALESCE(op.quantity, 0)
        + COALESCE(oti.quantity, 0)
        - COALESCE(oto.quantity, 0)
        AS opening_balance,

        COALESCE(pp.quantity, 0)
        AS purchases,

        COALESCE(pti.quantity, 0)
        AS transfers_in,

        COALESCE(pto.quantity, 0)
        AS transfers_out,

        (
          COALESCE(pp.quantity, 0)
          + COALESCE(pti.quantity, 0)
          - COALESCE(pto.quantity, 0)
        ) AS net_movement,

        COALESCE(pa.quantity, 0)
        AS assigned,

        COALESCE(pe.quantity, 0)
        AS expended,

        (
          COALESCE(op.quantity, 0)
          + COALESCE(oti.quantity, 0)
          - COALESCE(oto.quantity, 0)
          + COALESCE(pp.quantity, 0)
          + COALESCE(pti.quantity, 0)
          - COALESCE(pto.quantity, 0)
          - COALESCE(pa.quantity, 0)
          - COALESCE(pe.quantity, 0)
        ) AS closing_balance

      FROM base_equipment be

      JOIN bases b
        ON b.id = be.base_id

      JOIN equipment_types et
        ON et.id = be.equipment_type_id

      LEFT JOIN opening_purchases op
        ON op.base_id = be.base_id
        AND op.equipment_type_id = be.equipment_type_id

      LEFT JOIN opening_transfer_in oti
        ON oti.base_id = be.base_id
        AND oti.equipment_type_id = be.equipment_type_id

      LEFT JOIN opening_transfer_out oto
        ON oto.base_id = be.base_id
        AND oto.equipment_type_id = be.equipment_type_id

      LEFT JOIN period_purchases pp
        ON pp.base_id = be.base_id
        AND pp.equipment_type_id = be.equipment_type_id

      LEFT JOIN period_transfer_in pti
        ON pti.base_id = be.base_id
        AND pti.equipment_type_id = be.equipment_type_id

      LEFT JOIN period_transfer_out pto
        ON pto.base_id = be.base_id
        AND pto.equipment_type_id = be.equipment_type_id

      LEFT JOIN period_assignments pa
        ON pa.base_id = be.base_id
        AND pa.equipment_type_id = be.equipment_type_id

      LEFT JOIN period_expenditures pe
        ON pe.base_id = be.base_id
        AND pe.equipment_type_id = be.equipment_type_id

      WHERE ($1::INT IS NULL OR be.base_id = $1)
        AND (
          $2::INT IS NULL
          OR be.equipment_type_id = $2
        )

      ORDER BY
        b.name,
        et.name;
    `;

    const values = [
      effectiveBaseId,
      equipmentTypeId || null,
      startDate || null,
      endDate || null,
    ];

    const result = await db.query(
      query,
      values
    );

    return res.status(200).json({
      success: true,

      filters: {
        baseId: effectiveBaseId,
        equipmentTypeId:
          equipmentTypeId || null,
        startDate:
          startDate || null,
        endDate:
          endDate || null,
      },

      inventory: result.rows.map((row) => ({
        baseId: row.base_id,
        baseName: row.base_name,

        equipmentTypeId:
          row.equipment_type_id,

        equipmentName:
          row.equipment_name,

        category:
          row.category,

        openingBalance:
          Number(row.opening_balance),

        purchases:
          Number(row.purchases),

        transfersIn:
          Number(row.transfers_in),

        transfersOut:
          Number(row.transfers_out),

        netMovement:
          Number(row.net_movement),

        assigned:
          Number(row.assigned),

        expended:
          Number(row.expended),

        closingBalance:
          Number(row.closing_balance),
      })),
    });

  } catch (error) {

    console.error(
      "Inventory error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to calculate inventory.",
      error: error.message,
    });
  }
};