const express = require("express");
const router = express.Router();
const {
    getMyRecords,
    createRecord,
    getAllRecords,
    adminCreateRecord,
} = require("../controllers/recordController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/my", getMyRecords);
router.post("/", authorize("doctor"), createRecord);

router.get("/all", authorize("admin"), getAllRecords);
router.post("/admin", authorize("admin"), adminCreateRecord);

module.exports = router;