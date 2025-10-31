import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { sendResponse } from "../utils/responseHandler.js";

/**
 * Middleware to verify that the user is an admin.
 * Checks JWT, validates user from DB, and ensures role === 'admin'.
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Ensure token exists
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendResponse(res, 401, false, "No token provided");
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user and verify role
    const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [decoded.id]);
    const user = rows[0];

    if (!user || user.role !== "admin") {
      return sendResponse(res, 403, false, "Access denied — Admins only");
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Admin verification failed:", err.message);
    return sendResponse(res, 401, false, "Invalid or expired token");
  }
};
