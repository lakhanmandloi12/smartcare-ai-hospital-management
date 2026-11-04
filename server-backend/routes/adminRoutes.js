const express = require("express");
const router = express.Router();

const {
    getPendingDoctors,
    getDoctors,
    approveDoctor,
    rejectDoctor,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Ye saare routes sirf admin ke liye hain
router.use(protect, authorize("admin"));

router.get("/doctors", getDoctors);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/doctors/:id/approve", approveDoctor);
router.delete("/doctors/:id/reject", rejectDoctor);

module.exports = router;