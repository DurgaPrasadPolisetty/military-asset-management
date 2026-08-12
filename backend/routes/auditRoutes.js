import express from "express";

import {
  getAuditLogs,
} from "../controllers/auditController.js";

import {
  authenticateToken,
} from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  getAuditLogs
);

export default router;