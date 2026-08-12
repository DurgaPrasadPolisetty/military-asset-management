import express from "express";

import {
  createExpenditure,
  getExpenditures,
} from "../controllers/expenditureController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  getExpenditures
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER"
  ),
  createExpenditure
);

export default router;