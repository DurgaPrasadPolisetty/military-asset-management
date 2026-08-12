import express from "express";

import {
  createPurchase,
  getPurchases,
} from "../controllers/purchaseController.js";

import {
  authenticateToken,
} from "../middlewares/authMiddleware.js";

import {
  authorizeRoles,
  enforceBaseScope,
} from "../middlewares/rbacMiddleware.js";

const router = express.Router();


// =====================================================
// GET PURCHASE HISTORY
// =====================================================

router.get(
  "/",
  authenticateToken,
  enforceBaseScope,
  getPurchases
);


// =====================================================
// CREATE PURCHASE
// =====================================================

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "LOGISTICS_OFFICER"
  ),
  createPurchase
);


export default router;