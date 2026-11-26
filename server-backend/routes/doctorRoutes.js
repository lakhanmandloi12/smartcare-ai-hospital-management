const express = require("express");
const router = express.Router();
const { listDoctors, getMyStats, getMyPatients } = require("../controllers/doctorController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.get("/", protect, listDoctors);
router.get("/me/stats", protect, authorize("doctor"), getMyStats);
router.get("/me/patients", protect, authorize("doctor"), getMyPatients);

module.exports = router;