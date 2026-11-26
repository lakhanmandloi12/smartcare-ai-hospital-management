const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");

// Booking ke liye approved doctors ki list
exports.listDoctors = async (req, res) => {
    try {
        const doctors = await User.find({ role: "doctor", isApproved: true })
            .select("name specialization experience consultationFee")
            .sort({ name: 1 });
        res.json({ doctors });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Doctor dashboard ke numbers + aaj ki appointments
exports.getMyStats = async (req, res) => {
    try {
        const doctor = req.user._id;
        // Appointments ki date UTC midnight par save hoti hai, isliye aaj ki date waise hi banao
        const today = new Date(new Date().toLocaleDateString("en-CA"));

        const [todayList, pendingCount, upcomingCount, patientIds, recordsCount] = await Promise.all([
            Appointment.find({ doctor, date: today, status: { $ne: "cancelled" } })
                .populate("patient", "name email phone")
                .sort({ time: 1 }),
            Appointment.countDocuments({ doctor, status: "pending", date: { $gte: today } }),
            Appointment.countDocuments({ doctor, status: { $in: ["pending", "confirmed"] }, date: { $gt: today } }),
            Appointment.distinct("patient", { doctor, status: { $ne: "cancelled" } }),
            MedicalRecord.countDocuments({ doctor }),
        ]);

        res.json({
            today: todayList,
            todayCount: todayList.length,
            pendingCount,
            upcomingCount,
            totalPatients: patientIds.length,
            recordsCount,
        });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

// Jin patients ko is doctor ne dekha / dekhega
exports.getMyPatients = async (req, res) => {
    try {
        const patients = await Appointment.aggregate([
            { $match: { doctor: req.user._id, status: { $ne: "cancelled" } } },
            { $group: { _id: "$patient", visits: { $sum: 1 }, lastVisit: { $max: "$date" } } },
            { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "p" } },
            { $unwind: "$p" },
            {
                $project: {
                    visits: 1,
                    lastVisit: 1,
                    name: "$p.name",
                    email: "$p.email",
                    phone: "$p.phone",
                    gender: "$p.gender",
                    bloodGroup: "$p.bloodGroup",
                    dob: "$p.dob",
                },
            },
            { $sort: { lastVisit: -1 } },
        ]);
        res.json({ patients });
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};