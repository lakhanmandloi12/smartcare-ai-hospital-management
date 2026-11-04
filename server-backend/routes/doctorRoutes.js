const express = require("express");
const router = express.Router();
const { listDoctors } = require("../controllers/doctorController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, listDoctors);

module.exports = router;