// routes/authRoutes.js
const express = require("express");
const router = express.Router();

const {
    register,
    login,
    googleLogin,
    logout,
    me,
    updateMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
router.post("/logout", logout);

// Protected routes (login hona zaroori hai)
router.get("/me", protect, me);
router.put("/me", protect, updateMe);

module.exports = router;