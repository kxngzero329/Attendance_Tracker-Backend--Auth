import jwt from "jsonwebtoken";
import pool from "../config/db.js";

/**
 * Middleware to verify that the user is an admin.
 * Checks JWT, validates user from DB, and ensures role === 'admin'.
 */
export const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.query("SELECT id, role FROM users WHERE id = ?", [decoded.id]);
    const user = rows[0];

    if (!user || user.role !== "admin") {
      return res.status(403).json({ success: false, message: "Access denied — Admins only" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("Admin verification failed:", err.message);
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
