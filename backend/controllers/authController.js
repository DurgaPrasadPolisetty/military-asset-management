import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../config/db.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // 1. Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required.",
      });
    }

    // 2. Find user
    const result = await db.query(
      `
      SELECT
        id,
        username,
        password_hash,
        role,
        base_id
      FROM users
      WHERE username = $1
      `,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    const user = result.rows[0];

    // 3. Compare password with bcrypt hash
    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // 4. Create JWT
    const token = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        baseId: user.base_id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // 5. Record login in audit log
    await db.query(
      `
      INSERT INTO audit_logs
        (user_id, action, details)
      VALUES
        ($1, 'LOGIN', $2)
      `,
      [
        user.id,
        `User ${user.username} logged into the system`,
      ]
    );

    // 6. Send response
    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        baseId: user.base_id,
      },
    });

  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};