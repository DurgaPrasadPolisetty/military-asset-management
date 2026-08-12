import express from "express";

import {
  createTransfer,
  getTransfers,
} from "../controllers/transferController.js";

import {
  authenticateToken,
} from "../middlewares/authMiddleware.js";

import {
  authorizeRoles,
} from "../middlewares/rbacMiddleware.js";

const router = express.Router();


// GET transfer history

router.get(
  "/",
  authenticateToken,
  getTransfers
);


// CREATE transfer

router.post(
  "/",
  authenticateToken,
  authorizeRoles(
    "ADMIN",
    "LOGISTICS_OFFICER"
  ),
  createTransfer
);


export default router;