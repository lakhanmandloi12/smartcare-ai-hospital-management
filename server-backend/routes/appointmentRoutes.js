const express = require("express");
const router = express.Router();
const c = require("../controllers/appointmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/my", c.getMyAppointments);
router.get("/booked", c.bookedSlots);
router.get("/all", authorize("admin"), c.getAllAppointments);
router.post("/admin", authorize("admin"), c.adminCreate);
router.patch("/:id/admin", authorize("admin"), c.adminUpdate);
router.post("/", authorize("patient"), c.bookAppointment);
router.patch("/:id/cancel", authorize("patient"), c.cancelAppointment);
router.patch("/:id/status", authorize("doctor"), c.updateStatus);

module.exports = router;