import pool from "../config/db.js";

/**
 * Save a notification for a specific user.
 * Automatically skips duplicates (same title+message within 1 minute).
 * 
 * @param {number} userId - The user's ID.
 * @param {string} title - Short title of the notification.
 * @param {string} message - Detailed message body.
 */
export const notifyUser = async (userId, title, message) => {
  try {
    // Check user exists
    const [userRows] = await pool.query("SELECT id FROM users WHERE id = ?", [userId]);
    if (userRows.length === 0) {
      console.warn(`notifyUser: Skipped — user ${userId} not found`);
      return;
    }

    //prevent duplicate notifications within 1 minute
    const [dupCheck] = await pool.query(
      `SELECT id FROM notifications 
       WHERE user_id = ? AND title = ? AND message = ? 
       AND created_at >= NOW() - INTERVAL 1 MINUTE`,
      [userId, title, message]
    );
    if (dupCheck.length > 0) {
      console.log(`notifyUser: Skipped duplicate notification for user ${userId}`);
      return;
    }

    // Insert notification
    await pool.query(
      "INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)",
      [userId, title, message]
    );

    console.log(`Notification saved for user ${userId}: ${title}`);
  } catch (err) {
    console.error("❌ Error saving notification:", err.message);
  }
};
