const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");
const Appointment = require("../models/Appointment");
// Patient ko apne records, doctor ko apne likhe hue
exports.getMyRecords = async (req, res) => {
    try {
        const filter =
            req.user.role === "doctor" ? { doctor: req.user._id } : { patient: req.user._id };

        const records = await MedicalRecord.find(filter)
            .populate("doctor", "name specialization")
            .populate("patient", "name email")
            .sort({ date: -1 });

        res.json({ records });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Doctor patient ke liye prescription/report banata hai
exports.createRecord = async (req, res) => {
    try {
        const { patientId, type, title, description, medicines, date } = req.body;
        if (!patientId || !title)
            return res.status(400).json({ message: "Patient aur title zaroori hain" });

        const patient = await User.findOne({ _id: patientId, role: "patient" });
        if (!patient) return res.status(404).json({ message: "Patient nahi mila" });
        const treated = await Appointment.exists({ doctor: req.user._id, patient: patient._id });
        if (!treated)
            return res.status(403).json({ message: "Aap sirf apne patients ke liye record likh sakte hain" });
        const record = await MedicalRecord.create({
            patient: patient._id,
            doctor: req.user._id,
            type,
            title,
            description,
            medicines,
            date,
        });
        res.status(201).json({ record });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};/* ================= Admin ================= */
// Saare records
exports.getAllRecords = async (req, res) => {
    try {
        const records = await MedicalRecord.find()
            .populate("patient", "name email phone")
            .populate("doctor", "name specialization")
            .sort({ date: -1, createdAt: -1 });
        res.json({ records });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Admin kisi patient ke liye record banata hai
exports.adminCreateRecord = async (req, res) => {
    try {
        const { patientId, doctorId, type, diagnosis, description, medicines, date } = req.body;

        if (!patientId || !doctorId || !diagnosis || !String(diagnosis).trim())
            return res.status(400).json({ message: "Patient, doctor aur diagnosis zaroori hain" });

        const recordType = ["prescription", "report", "other"].includes(type) ? type : "report";

        let when = new Date();
        if (date) {
            when = new Date(date);
            if (isNaN(when)) return res.status(400).json({ message: "Invalid date" });
            // Aaj ki date allow hai (timezone ke liye 1 din ki chhoot)
            if (when > new Date(Date.now() + 24 * 60 * 60 * 1000))
                return res.status(400).json({ message: "Record ki date future ki nahi ho sakti" });
        }

        const patient = await User.findOne({ _id: patientId, role: "patient" });
        if (!patient) return res.status(404).json({ message: "Patient nahi mila" });

        const doctor = await User.findOne({ _id: doctorId, role: "doctor", isApproved: true });
        if (!doctor) return res.status(404).json({ message: "Doctor nahi mila" });

        const cleanMeds = (Array.isArray(medicines) ? medicines : [])
            .filter((m) => m && String(m.name || "").trim())
            .slice(0, 20)
            .map((m) => ({
                name: String(m.name).trim().slice(0, 100),
                dosage: String(m.dosage || "").trim().slice(0, 50),
                duration: String(m.duration || "").trim().slice(0, 50),
            }));

        if (recordType === "prescription" && cleanMeds.length === 0)
            return res.status(400).json({ message: "Prescription mein kam se kam ek dawai likho" });

        const diag = String(diagnosis).trim().slice(0, 150);
        const record = await MedicalRecord.create({
            patient: patient._id,
            doctor: doctor._id,
            type: recordType,
            title: diag,
            diagnosis: diag,
            description: String(description || "").trim().slice(0, 2000),
            medicines: recordType === "prescription" ? cleanMeds : [],
            date: when,
        });

        await record.populate([
            { path: "patient", select: "name email phone" },
            { path: "doctor", select: "name specialization" },
        ]);
        res.status(201).json({ record });
    } catch (e) {
        res.status(400).json({ message: "Record save nahi ho paya: " + e.message });
    }
};