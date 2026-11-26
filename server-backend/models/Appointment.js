const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: Date, required: true },   // din (YYYY-MM-DD)
        time: { type: String, required: true }, // "10:30"
        reason: { type: String, trim: true, maxlength: 500 },
        status: {
            type: String,
            enum: ["pending", "confirmed", "completed", "cancelled"],
            default: "pending",
        },
    },
    { timestamps: true }
);

appointmentSchema.index({ patient: 1, date: 1 });
appointmentSchema.index({ doctor: 1, date: 1, time: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);