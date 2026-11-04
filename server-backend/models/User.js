const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true },
        password: { type: String, minlength: 6, select: false }, // Google users ke liye optional
        googleId: String,
        avatar: String,
        phone: String,
        role: { type: String, enum: ["admin", "doctor", "patient"], default: "patient" },
        dob: Date,
        gender: { type: String, enum: ["male", "female", "other", ""], default: "" },
        bloodGroup: {
            type: String,
            enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", ""],
            default: "",
        },
        address: { type: String, trim: true, maxlength: 300 },
        emergencyContact: String,
        // Sirf doctors ke liye
        specialization: String,
        licenseNumber: String,
        experience: Number,

        // Doctor ke liye register par false hota hai, admin approve karta hai
        isApproved: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);