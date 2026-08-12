import express from "express";

import {
  createAssignment,
  getAssignments,
} from "../controllers/assignmentController.js";

import { authenticateToken } from "../middlewares/authMiddleware.js";

import { authorizeRoles } from "../middlewares/rbacMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authenticateToken,
  getAssignments
);

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "BASE_COMMANDER"
  ),
  createAssignment
);

export default router;