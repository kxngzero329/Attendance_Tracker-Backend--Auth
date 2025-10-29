import pool from "../config/db.js";
import { sendResponse } from "../utils/responseHandler.js";

// ============================================================
// Fetch notifications for the logged-in user
// ============================================================
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch both personal (user_id match) and broadcast notifications
    const [rows] = await pool.query(
      `
      SELECT id, title, message, created_at, is_broadcast
      FROM notifications
      WHERE user_id = ? OR is_broadcast = TRUE
      ORDER BY created_at DESC
      `,
      [userId]
    );

    if (rows.length === 0)
      return sendResponse(res, 200, true, "No notifications yet.", { notifications: [] });

    return sendResponse(res, 200, true, "Notifications fetched successfully.", {
      notifications: rows,
    });
  } catch (err) {
    console.error("Fetch notifications error:", err);
    return sendResponse(res, 500, false, "Failed to fetch notifications.");
  }
};

// ============================================================
// Admin: Send notification to all users (broadcast)
// ============================================================
export const sendBroadcastNotification = async (req, res) => {
  try {
    const { title, message } = req.body;

    if (!title || !message)
      return sendResponse(res, 400, false, "Title and message are required.");

    // Insert a single broadcast notification (visible to everyone)
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, is_broadcast) VALUES (?, ?, ?, TRUE)",
      [0, title, message] // user_id = 0 just to keep structure
    );

    return sendResponse(res, 201, true, "Broadcast notification sent to all users.");
  } catch (err) {
    console.error("Broadcast notification error:", err);
    return sendResponse(res, 500, false, "Failed to send broadcast notification.");
  }
};

// ============================================================
// Admin: Send personal notification to a specific user
// ============================================================
export const sendPersonalNotification = async (req, res) => {
  try {
    const { userId, title, message } = req.body;

    if (!userId || !title || !message)
      return sendResponse(res, 400, false, "userId, title, and message are required.");

    // Insert personal message for one specific user
    await pool.query(
      "INSERT INTO notifications (user_id, title, message, is_broadcast) VALUES (?, ?, ?, FALSE)",
      [userId, title, message]
    );

    return sendResponse(res, 201, true, `Notification sent to user ID ${userId}.`);
  } catch (err) {
    console.error("Personal notification error:", err);
    return sendResponse(res, 500, false, "Failed to send personal notification.");
  }
};
