const User = require("../models/User");

exports.listDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: "doctor", isApproved: true })
            .select("name specialization experience")
            .sort({ name: 1 });
        res.json({ doctors });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};