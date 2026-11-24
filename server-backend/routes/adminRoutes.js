const express = require("express");
const router = express.Router();

const {
    getPendingDoctors,
    getDoctors,
    approveDoctor,
    rejectDoctor,
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    setPatientStatus,
    getStats
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Ye saare routes sirf admin ke liye hain
router.use(protect, authorize("admin"));
router.get("/stats", getStats);
router.get("/doctors", getDoctors);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/doctors/:id/approve", approveDoctor);
router.delete("/doctors/:id/reject", rejectDoctor);

router.get("/patients", getPatients);
router.post("/patients", createPatient);
router.get("/patients/:id", getPatient);
router.put("/patients/:id", updatePatient);
router.patch("/patients/:id/status", setPatientStatus);

module.exports = router;