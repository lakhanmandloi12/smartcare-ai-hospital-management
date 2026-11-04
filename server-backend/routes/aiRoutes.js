const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const { chat, suggestDoctor } = require("../controllers/aiController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Har user ke liye alag limit: 1 minute mein 15 requests
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    keyGenerator: (req) => String(req.user._id),
    message: { message: "Bahut zyada requests. Ek minute baad try karo." },
});

router.use(protect, authorize("patient"), limiter);

router.post("/chat", chat);
router.post("/department", suggestDoctor);

module.exports = router;