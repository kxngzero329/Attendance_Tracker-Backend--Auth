//   Handles user registration, login, password reset, and account unlock.
//   Includes account lockout logic and sends toast-ready responses.
//   Also logs important actions (like login or password reset) into
//   the notifications table for users to view later.

import pool from "../config/db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { hashPassword, comparePassword } from "../utils/hashPassword.js";
import { sendResponse } from "../utils/responseHandler.js"; // toast-friendly response helper
import { notifyUser } from "../utils/notifyUser.js"; // notification logger

// =============================================
// ACCOUNT LOCKOUT SETTINGS
// =============================================
// After 3 failed login attempts, the account locks for 30 seconds.
const MAX_FAILED_ATTEMPTS = 3;
const LOCK_DURATION_SECONDS = 30;

// =============================================
// JWT TOKEN GENERATOR
// =============================================
// Creates a signed token that expires after 15 days (for demo purposes).
// This token is used by the frontend for protected routes.
const generateAccessToken = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "15d",
  });

// ===================================================
// REGISTER USER
// ===================================================
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Check that required fields exist
    if (!email || !password)
      return sendResponse(res, 400, false, "Email and password are required.");

    // Check if email already exists in DB
    const [existing] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (existing.length)
      return sendResponse(res, 409, false, "User already exists.");

    // Hash the password before saving for security
    const hashed = await hashPassword(password);
    await pool.query(
      "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
      [email, name || null, hashed]
    );

    // Fetch new user's ID for notifications
    const [newUser] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);

    // Log a welcome notification
    await notifyUser(
      newUser[0].id,
      "Welcome!",
      "Your account has been created successfully."
    );

    return sendResponse(res, 201, true, "User registered successfully.");
  } catch (err) {
    console.error("Signup Error:", err);
    next(err);
  }
};

// ===================================================
// LOGIN USER + ACCOUNT LOCKOUT HANDLING
// ===================================================
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Ensure both fields are provided
    if (!email || !password)
      return sendResponse(res, 400, false, "Email and password are required.");

    // Check if the user exists
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (!rows.length)
      return sendResponse(res, 401, false, "Invalid credentials.");

    const user = rows[0];

    // Check if user account is temporarily locked
    if (user.lock_until && new Date(user.lock_until) > new Date()) {
      const secondsLeft = Math.ceil((new Date(user.lock_until) - new Date()) / 1000);
      return sendResponse(
        res,
        423,
        false,
        `Account temporarily locked. Try again in ${secondsLeft}s.`
      );
    }

    // Compare entered password with stored hash
    const isMatch = await comparePassword(password, user.password_hash);

    if (!isMatch) {
      // Password is incorrect → increase failed attempts
      const attempts = (user.failed_login_attempts || 0) + 1;
      let lockUntil = null;

      // Lock account for 30s after 3 failed attempts
      if (attempts >= MAX_FAILED_ATTEMPTS)
        lockUntil = new Date(Date.now() + LOCK_DURATION_SECONDS * 1000);

      // Save the new attempt count and lock time
      await pool.query(
        "UPDATE users SET failed_login_attempts=?, lock_until=? WHERE id=?",
        [attempts, lockUntil, user.id]
      );

      // Return appropriate error message
      return sendResponse(
        res,
        401,
        false,
        attempts >= MAX_FAILED_ATTEMPTS
          ? "Account locked for 30 seconds after 3 failed attempts."
          : "Invalid email or password."
      );
    }

    // Password correct → reset failed attempts and unlock account
    await pool.query(
      "UPDATE users SET failed_login_attempts=0, lock_until=NULL WHERE id=?",
      [user.id]
    );

    // Save notification
    await notifyUser(
      user.id,
      "Login Successful",
      "You have successfully logged in to your account."
    );

    // Generate access token
    const token = generateAccessToken(user);

    return sendResponse(res, 200, true, "Login successful.", { token });
  } catch (err) {
    console.error("Login Error:", err);
    next(err);
  }
};

// ===================================================
// FORGOT PASSWORD (Generate reset token)
// ===================================================
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendResponse(res, 400, false, "Email is required.");

    // Find user
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (!rows.length)
      return sendResponse(res, 200, true, "If that email exists, a reset link was sent.");

    const user = rows[0];

    // Generate secure reset token
    const token = crypto.randomBytes(32).toString("hex");
    const hashed = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 mins expiry

    // Store hashed token + expiry in DB
    await pool.query(
      "UPDATE users SET reset_token_hash=?, reset_expires=? WHERE id=?",
      [hashed, expires, user.id]
    );

    // Create frontend reset link
    const resetLink = `${process.env.FRONTEND_ORIGIN}/reset-password?token=${token}&email=${encodeURIComponent(
      email
    )}`;

    // Log notification
    await notifyUser(
      user.id,
      "Password Reset Requested",
      "A password reset link was generated for your account."
    );

    return sendResponse(res, 200, true, "Password reset link generated.", { resetLink });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    next(err);
  }
};

// ===================================================
// RESET PASSWORD (verify token & update password)
// ===================================================
export const resetPassword = async (req, res, next) => {
  try {
    const { email, token, newPassword } = req.body;

    if (!email || !token || !newPassword)
      return sendResponse(res, 400, false, "Email, token, and new password are required.");

    // Verify token by hashing the one user sent
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? AND reset_token_hash = ?",
      [email, tokenHash]
    );

    if (!rows.length)
      return sendResponse(res, 400, false, "Invalid or expired token.");

    const user = rows[0];

    // Check if token is expired
    if (new Date(user.reset_expires) < new Date())
      return sendResponse(res, 400, false, "Reset token has expired.");

    // Update password and clear reset data
    const hashed = await hashPassword(newPassword);
    await pool.query(
      "UPDATE users SET password_hash=?, reset_token_hash=NULL, reset_expires=NULL WHERE id=?",
      [hashed, user.id]
    );

    // Log notification
    await notifyUser(
      user.id,
      "Password Reset",
      "Your password has been successfully reset."
    );

    return sendResponse(res, 200, true, "Password reset successful.");
  } catch (err) {
    console.error("Reset Password Error:", err);
    next(err);
  }
};

// ===================================================
// UNLOCK ACCOUNT (only if the user wants to manual reset)
// ===================================================
export const unlockAccount = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return sendResponse(res, 400, false, "Email is required.");

    await pool.query(
      "UPDATE users SET failed_login_attempts=0, lock_until=NULL WHERE email=?",
      [email]
    );

    // ✅ Log notification (optional)
    const [rows] = await pool.query("SELECT id FROM users WHERE email = ?", [email]);
    if (rows.length) {
      await notifyUser(
        rows[0].id,
        "Account Unlocked",
        "Your account was manually unlocked by an administrator or system action."
      );
    }

    return sendResponse(res, 200, true, "Account unlocked successfully.");
  } catch (err) {
    console.error("Error unlocking account:", err);
    next(err);
  }
};
