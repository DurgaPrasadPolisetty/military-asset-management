import express from "express";

import {
  authenticateToken,
} from "../middlewares/authMiddleware.js";

import {
  authorizeRoles,
  enforceBaseScope,
} from "../middlewares/rbacMiddleware.js";

const router = express.Router();


// ============================================
// Any authenticated user
// ============================================

router.get(
  "/protected",
  authenticateToken,
  (req, res) => {

    res.json({
      success: true,
      message: "Protected route accessed successfully.",
      user: req.user,
    });

  }
);


// ============================================
// Admin only
// ============================================

router.get(
  "/admin",
  authenticateToken,
  authorizeRoles("ADMIN"),
  (req, res) => {

    res.json({
      success: true,
      message: "Welcome Admin. You have global access.",
      user: req.user,
    });

  }
);


// ============================================
// Base scoped route
// ============================================

router.get(
  "/base-data",
  authenticateToken,
  enforceBaseScope,
  (req, res) => {

    res.json({
      success: true,
      message: "Base scoped data accessed.",
      baseId: req.query.baseId || "ALL_BASES",
      user: req.user,
    });

  }
);

export default router;