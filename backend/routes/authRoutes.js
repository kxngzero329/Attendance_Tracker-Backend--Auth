import express from "express";
import {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  unlockAccount,
} from "../controllers/authController.js";

const router = express.Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/forgot", forgotPassword);
router.post("/reset", resetPassword);
router.post("/unlock", unlockAccount);

export default router;
