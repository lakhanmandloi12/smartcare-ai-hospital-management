const mongoose = require("mongoose");

const recordSchema = new mongoose.Schema(
    {
        patient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        doctor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        type: { type: String, enum: ["prescription", "report", "other"], default: "report" },
        title: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
        medicines: [{ name: String, dosage: String, duration: String }], // prescription ke liye
        date: { type: Date, default: Date.now },
        diagnosis: { type: String, trim: true },
    },
    { timestamps: true }
);

recordSchema.index({ patient: 1, date: -1 });

module.exports = mongoose.model("MedicalRecord", recordSchema);