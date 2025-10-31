import pool from "../config/db.js";
import { notifyUser } from "../utils/notifyUser.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * Send a notification to ALL staff members (broadcast message).
 * Only admins can use this route.
 */
export const broadcastNotification = async (req, res) => {
  const { title, message } = req.body;

  if (!title || !message) {
    return sendResponse(res, 400, false, "Title and message are required");
  }

  try {
    // Get all staff users
    const [staff] = await pool.query("SELECT id FROM users WHERE role = 'staff'");

    // Send to each staff member
    for (const user of staff) {
      await notifyUser(user.id, title, message);
    }

    return sendResponse(res, 200, true, "Broadcast message sent to all staff");
  } catch (err) {
    console.error("Broadcast failed:", err);
    return sendResponse(res, 500, false, "Failed to send broadcast message");
  }
};

/**
 * Send a notification to a specific staff member.
 * Only admins can use this route so if the user's role is not admin, it won't send the message.
 */
export const personalNotification = async (req, res) => {
  const { userId, title, message } = req.body;

  if (!userId || !title || !message) {
    return sendResponse(res, 400, false, "userId, title, and message are required");
  }

  try {
    const [userRows] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      return sendResponse(res, 404, false, "User not found");
    }

    await notifyUser(userId, title, message);
    return sendResponse(res, 200, true, "Message sent to selected staff member");
  } catch (err) {
    console.error("Personal message failed:", err);
    return sendResponse(res, 500, false, "Failed to send personal message");
  }
};
