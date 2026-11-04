const User = require("../models/User");

// Approval ka intezaar kar rahe doctors
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
exports.getDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: "doctor", isApproved: true })
            .select("-password")
            .sort({ createdAt: -1 });
        res.json({ doctors });
    } catch (e) {
        res.status(500).json({ message: e.message });
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