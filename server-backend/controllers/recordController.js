const MedicalRecord = require("../models/MedicalRecord");
const User = require("../models/User");

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
};