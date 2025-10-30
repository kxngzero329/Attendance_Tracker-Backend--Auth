import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { getProfile } from "../controllers/userController.js";

const router = express.Router();

// Get logged-in user's profile (with initials)
router.get("/profile", verifyToken, getProfile);

// old route, got changed to forgot-password
// Change password (protected route) 
// router.put("/change-password", verifyToken, changePassword);

export default router;
