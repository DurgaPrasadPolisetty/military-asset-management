import express from "express";

import {
  getDashboardMetrics,
  getInventory,
} from "../controllers/assetController.js";

import {
  authenticateToken,
} from "../middlewares/authMiddleware.js";

import {
  enforceBaseScope,
} from "../middlewares/rbacMiddleware.js";


const router = express.Router();


/*
 * Dashboard metrics
 *
 * GET /api/assets/dashboard
 */
router.get(
  "/dashboard",
  authenticateToken,
  enforceBaseScope,
  getDashboardMetrics
);


/*
 * Inventory
 *
 * GET /api/assets/inventory
 *
 * Supports:
 * ?baseId=
 * ?equipmentTypeId=
 * ?startDate=
 * ?endDate=
 */
router.get(
  "/inventory",
  authenticateToken,
  enforceBaseScope,
  getInventory
);


export default router;