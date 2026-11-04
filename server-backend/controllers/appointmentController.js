const Appointment = require("../models/Appointment");
const User = require("../models/User");

const ACTIVE = ["pending", "confirmed"];

// Patient ko apni, doctor ko apne paas ki appointments
exports.getMyAppointments = async (req, res) => {
    try {
        const filter =
            req.user.role === "doctor" ? { doctor: req.user._id } : { patient: req.user._id };

        const appointments = await Appointment.find(filter)
            .populate("doctor", "name specialization experience")
            .populate("patient", "name email phone")
            .sort({ date: 1, time: 1 });

        res.json({ appointments });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Admin: saari appointments
exports.getAllAppointments = async (req, res) => {
    try {
        const appointments = await Appointment.find()
            .populate("doctor", "name specialization")
            .populate("patient", "name email phone")
            .sort({ date: -1, time: 1 });
        res.json({ appointments });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Kisi doctor ke us din ke booked slots (booking page ke liye)
exports.bookedSlots = async (req, res) => {
    try {
        const { doctor, date } = req.query;
        if (!doctor || !date) return res.status(400).json({ message: "doctor aur date zaroori hain" });

        const rows = await Appointment.find({
            doctor,
            date: new Date(date),
            status: { $in: ACTIVE },
        }).select("time");

        res.json({ booked: rows.map((r) => r.time) });
    } catch {
        res.status(400).json({ message: "Invalid doctor ya date" });
    }
};

// Patient appointment book karta hai
exports.bookAppointment = async (req, res) => {
    try {
        const { doctorId, date, time, reason } = req.body;

        if (!doctorId || !date || !time)
            return res.status(400).json({ message: "Doctor, date aur time zaroori hain" });
        if (!/^\d{2}:\d{2}$/.test(time))
            return res.status(400).json({ message: "Time format HH:MM hona chahiye" });

        const day = new Date(date);
        if (isNaN(day)) return res.status(400).json({ message: "Invalid date" });

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (day < today) return res.status(400).json({ message: "Purani date par booking nahi ho sakti" });

        const doctor = await User.findOne({ _id: doctorId, role: "doctor", isApproved: true });
        if (!doctor) return res.status(404).json({ message: "Doctor nahi mila" });

        const taken = await Appointment.findOne({
            doctor: doctor._id,
            date: day,
            time,
            status: { $in: ACTIVE },
        });
        if (taken) return res.status(409).json({ message: "Ye slot pehle se booked hai" });

        const appointment = await Appointment.create({
            patient: req.user._id,
            doctor: doctor._id,
            date: day,
            time,
            reason,
        });
        await appointment.populate("doctor", "name specialization experience");

        res.status(201).json({ appointment });
    } catch (e) {
        res.status(400).json({ message: "Booking nahi ho payi: " + e.message });
    }
};

// Patient apni appointment cancel karta hai
exports.cancelAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findOne({
            _id: req.params.id,
            patient: req.user._id,
            status: { $in: ACTIVE },
        });
        if (!appointment)
            return res.status(404).json({ message: "Appointment nahi mili ya cancel nahi ho sakti" });

        appointment.status = "cancelled";
        await appointment.save();
        res.json({ appointment });
    } catch {
        res.status(400).json({ message: "Invalid appointment id" });
    }
};

// Doctor apni appointment ka status badalta hai
exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        if (!["confirmed", "completed", "cancelled"].includes(status))
            return res.status(400).json({ message: "Invalid status" });

        const appointment = await Appointment.findOneAndUpdate(
            { _id: req.params.id, doctor: req.user._id },
            { status },
            { new: true }
        ).populate("patient", "name email phone");

        if (!appointment) return res.status(404).json({ message: "Appointment nahi mili" });
        res.json({ appointment });
    } catch {
        res.status(400).json({ message: "Invalid appointment id" });
    }
};