const User = require("../models/User");
const bcrypt = require("bcryptjs");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

exports.getPendingDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: "doctor", isApproved: false })
            .select("-password")
            .sort({ createdAt: -1 });
        res.json({ doctors });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Approved doctors ki list (Doctors page ko real data dene ke liye)
/* ================= Doctors (admin) ================= */
exports.getDoctors = async (req, res) => {
    try {
        const today = new Date(new Date().toLocaleDateString("en-CA"));

        const [doctors, patientCounts, todayCounts] = await Promise.all([
            User.find({ role: "doctor", isApproved: true }).select("-password").sort({ createdAt: -1 }).lean(),
            // Har doctor ke alag-alag patients
            Appointment.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                { $group: { _id: { doctor: "$doctor", patient: "$patient" } } },
                { $group: { _id: "$_id.doctor", count: { $sum: 1 } } },
            ]),
            // Aaj ki active appointments
            Appointment.aggregate([
                { $match: { date: today, status: { $in: ["pending", "confirmed"] } } },
                { $group: { _id: "$doctor", count: { $sum: 1 } } },
            ]),
        ]);

        const pc = new Map(patientCounts.map((x) => [String(x._id), x.count]));
        const tc = new Map(todayCounts.map((x) => [String(x._id), x.count]));

        res.json({
            doctors: doctors.map((d) => ({
                ...d,
                patientsCount: pc.get(String(d._id)) || 0,
                todayCount: tc.get(String(d._id)) || 0,
            })),
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

const DOCTOR_FIELDS = ["name", "email", "phone", "specialization", "licenseNumber", "experience", "consultationFee", "bio"];

function pickDoctor(body) {
    const out = {};
    for (const k of DOCTOR_FIELDS) if (body[k] !== undefined) out[k] = body[k];
    for (const k of ["experience", "consultationFee"]) {
        if (out[k] === "" || out[k] === null) out[k] = null;
        else if (out[k] !== undefined) out[k] = Number(out[k]);
    }
    for (const k of ["name", "specialization", "licenseNumber"])
        if (typeof out[k] === "string") out[k] = out[k].trim();
    if (typeof out.email === "string") out.email = out.email.trim().toLowerCase();
    return out;
}

exports.getDoctor = async (req, res) => {
    try {
        const doctor = await User.findOne({ _id: req.params.id, role: "doctor" }).select("-password");
        if (!doctor) return res.status(404).json({ message: "Doctor nahi mila" });

        const today = new Date(new Date().toLocaleDateString("en-CA"));
        const [patientIds, appointmentsCount, recordsCount, upcoming] = await Promise.all([
            Appointment.distinct("patient", { doctor: doctor._id, status: { $ne: "cancelled" } }),
            Appointment.countDocuments({ doctor: doctor._id }),
            MedicalRecord.countDocuments({ doctor: doctor._id }),
            Appointment.find({ doctor: doctor._id, date: { $gte: today }, status: { $in: ["pending", "confirmed"] } })
                .populate("patient", "name")
                .sort({ date: 1, time: 1 })
                .limit(5),
        ]);

        res.json({ doctor, patientsCount: patientIds.length, appointmentsCount, recordsCount, upcoming });
    } catch {
        res.status(400).json({ message: "Invalid doctor id" });
    }
};

// Admin seedha approved doctor banata hai
exports.createDoctor = async (req, res) => {
    try {
        const { password } = req.body;
        const data = pickDoctor(req.body);

        if (!data.name || !data.email) return res.status(400).json({ message: "Naam aur email zaroori hain" });
        if (!data.specialization || !data.licenseNumber)
            return res.status(400).json({ message: "Specialization aur license number zaroori hain" });
        if (!password || password.length < 6)
            return res.status(400).json({ message: "Password kam se kam 6 characters ka rakho" });
        if (await User.findOne({ email: data.email }))
            return res.status(409).json({ message: "Ye email pehle se registered hai" });

        const doctor = await User.create({
            ...data,
            password: await bcrypt.hash(password, 12),
            role: "doctor",
            isApproved: true,
        });
        const obj = doctor.toObject();
        delete obj.password;
        res.status(201).json({ doctor: obj });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const updates = pickDoctor(req.body);

        if (updates.name !== undefined && !updates.name)
            return res.status(400).json({ message: "Naam khali nahi ho sakta" });
        if (updates.email) {
            const clash = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
            if (clash) return res.status(409).json({ message: "Ye email kisi aur ke paas hai" });
        }

        const doctor = await User.findOneAndUpdate({ _id: req.params.id, role: "doctor" }, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!doctor) return res.status(404).json({ message: "Doctor nahi mila" });
        res.json({ doctor });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

exports.setDoctorStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive true ya false hona chahiye" });

        const doctor = await User.findOneAndUpdate(
            { _id: req.params.id, role: "doctor" },
            { isActive },
            { new: true }
        ).select("-password");

        if (!doctor) return res.status(404).json({ message: "Doctor nahi mila" });
        res.json({ doctor });
    } catch {
        res.status(400).json({ message: "Invalid doctor id" });
    }
};

exports.approveDoctor = async (req, res) => {
    try {
        const doctor = await User.findOneAndUpdate(
            { _id: req.params.id, role: "doctor" },
            { isApproved: true },
            { new: true }
        ).select("-password");

        if (!doctor) return res.status(404).json({ message: "Doctor nahi mila" });
        res.json({ doctor, message: `${doctor.name} approved` });
    } catch (e) {
        res.status(400).json({ message: "Invalid doctor id" });
    }
};

// Reject karne par pending request delete ho jati hai (doctor dobara register kar sakta hai)
exports.rejectDoctor = async (req, res) => {
    try {
        const doctor = await User.findOneAndDelete({
            _id: req.params.id,
            role: "doctor",
            isApproved: false,
        });

        if (!doctor) return res.status(404).json({ message: "Pending request nahi mili" });
        res.json({ message: `${doctor.name} ki request reject ho gayi` });
    } catch (e) {
        res.status(400).json({ message: "Invalid doctor id" });
    }
};
/* ================= Patients (admin) ================= */
const PATIENT_FIELDS = ["name", "email", "phone", "dob", "gender", "bloodGroup", "address", "emergencyContact"];

function pickPatient(body) {
    const out = {};
    for (const k of PATIENT_FIELDS) if (body[k] !== undefined) out[k] = body[k];
    if (out.dob === "") out.dob = null;
    if (typeof out.name === "string") out.name = out.name.trim();
    if (typeof out.email === "string") out.email = out.email.trim().toLowerCase();
    return out;
}

exports.getPatients = async (req, res) => {
    try {
        const patients = await User.find({ role: "patient" }).select("-password").sort({ createdAt: -1 });
        res.json({ patients });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.getPatient = async (req, res) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: "patient" }).select("-password");
        if (!patient) return res.status(404).json({ message: "Patient nahi mila" });

        const [appointmentsCount, recordsCount, recent] = await Promise.all([
            Appointment.countDocuments({ patient: patient._id }),
            MedicalRecord.countDocuments({ patient: patient._id }),
            Appointment.find({ patient: patient._id })
                .populate("doctor", "name specialization")
                .sort({ date: -1 })
                .limit(5),
        ]);
        res.json({ patient, appointmentsCount, recordsCount, recent });
    } catch {
        res.status(400).json({ message: "Invalid patient id" });
    }
};

exports.createPatient = async (req, res) => {
    try {
        const { password } = req.body;
        const data = pickPatient(req.body);

        if (!data.name || !data.email) return res.status(400).json({ message: "Naam aur email zaroori hain" });
        if (!password || password.length < 6)
            return res.status(400).json({ message: "Password kam se kam 6 characters ka rakho" });
        if (await User.findOne({ email: data.email }))
            return res.status(409).json({ message: "Ye email pehle se registered hai" });

        const patient = await User.create({
            ...data,
            password: await bcrypt.hash(password, 12),
            role: "patient",
        });
        const obj = patient.toObject();
        delete obj.password;
        res.status(201).json({ patient: obj });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

exports.updatePatient = async (req, res) => {
    try {
        const updates = pickPatient(req.body);

        if (updates.name !== undefined && !updates.name)
            return res.status(400).json({ message: "Naam khali nahi ho sakta" });
        if (updates.dob && new Date(updates.dob) > new Date())
            return res.status(400).json({ message: "Date of birth future ki nahi ho sakti" });
        if (updates.email) {
            const clash = await User.findOne({ email: updates.email, _id: { $ne: req.params.id } });
            if (clash) return res.status(409).json({ message: "Ye email kisi aur ke paas hai" });
        }

        const patient = await User.findOneAndUpdate({ _id: req.params.id, role: "patient" }, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        if (!patient) return res.status(404).json({ message: "Patient nahi mila" });
        res.json({ patient });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};

exports.setPatientStatus = async (req, res) => {
    try {
        const { isActive } = req.body;
        if (typeof isActive !== "boolean") return res.status(400).json({ message: "isActive true ya false hona chahiye" });

        const patient = await User.findOneAndUpdate(
            { _id: req.params.id, role: "patient" },
            { isActive },
            { new: true }
        ).select("-password");

        if (!patient) return res.status(404).json({ message: "Patient nahi mila" });
        res.json({ patient });
    } catch {
        res.status(400).json({ message: "Invalid patient id" });
    }
};
/* ================= Dashboard stats ================= */
exports.getStats = async (req, res) => {
    try {
        // Appointments ki date UTC midnight par save hoti hai
        const today = new Date(new Date().toLocaleDateString("en-CA"));
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));

        const [
            totalPatients,
            newPatients,
            doctors,
            pendingDoctors,
            todayAppointments,
            upcoming,
            revenueAgg,
        ] = await Promise.all([
            User.countDocuments({ role: "patient" }),
            User.countDocuments({ role: "patient", createdAt: { $gte: weekAgo } }),
            User.countDocuments({ role: "doctor", isApproved: true }),
            User.countDocuments({ role: "doctor", isApproved: false }),
            Appointment.find({ date: today, status: { $ne: "cancelled" } })
                .populate("doctor", "name specialization")
                .populate("patient", "name")
                .sort({ time: 1 }),
            Appointment.countDocuments({ date: { $gt: today }, status: { $in: ["pending", "confirmed"] } }),
            Appointment.aggregate([
                { $match: { status: "completed", date: { $gte: monthStart } } },
                { $lookup: { from: "users", localField: "doctor", foreignField: "_id", as: "d" } },
                { $unwind: "$d" },
                { $group: { _id: null, total: { $sum: { $ifNull: ["$d.consultationFee", 0] } } } },
            ]),
        ]);

        res.json({
            totalPatients,
            newPatients,
            doctors,
            pendingDoctors,
            todayAppointments,
            upcoming,
            revenue: revenueAgg[0]?.total || 0,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};