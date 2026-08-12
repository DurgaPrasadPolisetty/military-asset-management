import db from "../config/db.js";

export const getAuditLogs = async (req, res) => {
  try {
    const {
      action,
      userId,
      startDate,
      endDate,
    } = req.query;

    const conditions = [];
    const values = [];
    let index = 1;

    // Base Commander restriction
    if (req.user.role === "BASE_COMMANDER") {
      conditions.push(`
        al.user_id IN (
          SELECT id
          FROM users
          WHERE base_id = $${index}
        )
      `);

      values.push(req.user.baseId);
      index++;
    }

    if (action) {
      conditions.push(
        `al.action = $${index}`
      );

      values.push(action);
      index++;
    }

    if (userId) {
      conditions.push(
        `al.user_id = $${index}`
      );

      values.push(userId);
      index++;
    }

    if (startDate) {
      conditions.push(
        `al.created_at >= $${index}::TIMESTAMP`
      );

      values.push(startDate);
      index++;
    }

    if (endDate) {
      conditions.push(
        `al.created_at <= $${index}::TIMESTAMP`
      );

      values.push(`${endDate} 23:59:59`);
      index++;
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const result = await db.query(
      `
      SELECT
        al.id,

        al.user_id AS "userId",

        u.username,

        u.role,

        u.base_id AS "baseId",

        b.name AS "baseName",

        al.action,

        al.details,

        al.created_at AS "createdAt"

      FROM audit_logs al

      LEFT JOIN users u
        ON u.id = al.user_id

      LEFT JOIN bases b
        ON b.id = u.base_id

      ${whereClause}

      ORDER BY al.created_at DESC
      `,
      values
    );

    return res.status(200).json({
      success: true,

      filters: {
        action: action || null,
        userId: userId || null,
        startDate: startDate || null,
        endDate: endDate || null,
      },

      count: result.rows.length,

      logs: result.rows,
    });

  } catch (error) {
    console.error(
      "Get audit logs error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve audit logs.",
      error: error.message,
    });
  }
};