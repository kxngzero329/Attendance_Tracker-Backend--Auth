// routes/adminNotificationRoutes.js
import express from "express";
import { broadcastNotification, personalNotification } from "../controllers/adminNotificationController.js";
import { verifyAdmin } from "../middleware/verifyAdmin.js";

const router = express.Router();

/**
 * POST /api/admin/notify/all
 * Send a broadcast message to all staff
 */
router.post("/notify/all", verifyAdmin, broadcastNotification);

/**
 * POST /api/admin/notify/user
 * Send a message to a specific staff member
 */
router.post("/notify/user", verifyAdmin, personalNotification);

export default router;
