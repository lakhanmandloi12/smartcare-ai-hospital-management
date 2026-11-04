const express = require("express");
const router = express.Router();
const { getMyRecords, createRecord } = require("../controllers/recordController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/my", getMyRecords);
router.post("/", authorize("doctor"), createRecord);

module.exports = router;