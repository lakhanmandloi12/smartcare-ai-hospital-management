const express = require("express");
const router = express.Router();

const {
    getStats,
    getDoctors,
    getPendingDoctors,
    approveDoctor,
    rejectDoctor,
    createDoctor,
    getDoctor,
    updateDoctor,
    setDoctorStatus,
    getPatients,
    getPatient,
    createPatient,
    updatePatient,
    setPatientStatus,
} = require("../controllers/adminController");
const { protect, authorize } = require("../middleware/authMiddleware");

// Ye saare routes sirf admin ke liye hain
router.use(protect, authorize("admin"));

router.get("/stats", getStats);

// Doctors (/pending wali route /:id wali routes se UPAR rahni chahiye)
router.get("/doctors", getDoctors);
router.post("/doctors", createDoctor);
router.get("/doctors/pending", getPendingDoctors);
router.patch("/doctors/:id/approve", approveDoctor);
router.delete("/doctors/:id/reject", rejectDoctor);
router.get("/doctors/:id", getDoctor);
router.put("/doctors/:id", updateDoctor);
router.patch("/doctors/:id/status", setDoctorStatus);

// Patients
router.get("/patients", getPatients);
router.post("/patients", createPatient);
router.get("/patients/:id", getPatient);
router.put("/patients/:id", updatePatient);
router.patch("/patients/:id/status", setPatientStatus);

module.exports = router;