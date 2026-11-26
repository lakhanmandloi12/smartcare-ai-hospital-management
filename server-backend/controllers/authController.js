const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendToken = (user, res, status = 200) => {
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(status).json({
        user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
};

const PENDING_MSG = "Your doctor account is waiting for admin approval.";

exports.register = async (req, res) => {
    try {
        const {
            name, email, password, phone,
            role = "patient",
            specialization, licenseNumber, experience,
            adminCode,
        } = req.body;

        if (!name || !email || !password)
            return res.status(400).json({ message: "Name, email aur password zaroori hain" });
        if (password.length < 6)
            return res.status(400).json({ message: "Password kam se kam 6 characters ka rakho" });
        if (!["patient", "doctor", "admin"].includes(role))
            return res.status(400).json({ message: "Invalid role" });
        if (await User.findOne({ email: email.toLowerCase() }))
            return res.status(409).json({ message: "Ye email pehle se registered hai" });

        const data = {
            name,
            email,
            phone,
            role,
            password: await bcrypt.hash(password, 12),
        };

        if (role === "admin") {
            // ADMIN_INVITE_CODE set nahi hai to admin registration band rahega
            if (!process.env.ADMIN_INVITE_CODE || adminCode !== process.env.ADMIN_INVITE_CODE)
                return res.status(403).json({ message: "Invalid admin invite code" });
        }

        if (role === "doctor") {
            if (!specialization || !licenseNumber)
                return res.status(400).json({ message: "Specialization aur license number zaroori hain" });
            Object.assign(data, {
                specialization,
                licenseNumber,
                experience: Number(experience) || 0,
                isApproved: false,
            });
        }

        const user = await User.create(data);

        if (role === "doctor") {
            // Token nahi dete, approval ke baad hi login hoga
            return res.status(201).json({ pending: true, message: PENDING_MSG });
        }
        sendToken(user, res, 201);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select("+password");
        if (!user || !user.password || !(await bcrypt.compare(password, user.password)))
            return res.status(401).json({ message: "Email ya password galat hai" });
        if (user.isActive === false)
            return res.status(403).json({ message: "Your account has been deactivated. Please contact the hospital." });
        if (user.role === "doctor" && !user.isApproved)
            return res.status(403).json({ message: PENDING_MSG });

        sendToken(user, res);
    } catch (e) {
        res.status(500).json({ message: e.message });
    }
};

exports.googleLogin = async (req, res) => {
    try {
        const { credential } = req.body;

        if (!credential)
            return res.status(400).json({ message: "Google credential nahi mila" });

        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error("GOOGLE_CLIENT_ID backend .env me set nahi hai");
            return res.status(500).json({ message: "Server par Google login configure nahi hai" });
        }

        // 1) Token verify karo (galat client id / expire token yahin pakda jayega)
        let payload;
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch (err) {
            console.error("Google token verify fail:", err.message);
            return res.status(401).json({ message: "Google token invalid ya expire ho gaya. Dobara try karo." });
        }

        const { sub, name, picture, email_verified } = payload;
        const email = payload.email?.toLowerCase();

        if (!email || !email_verified)
            return res.status(401).json({ message: "Google account ka email verified nahi hai" });

        // 2) User dhundo ya naya patient banao
        let user = await User.findOne({ email });
        if (!user) {
            // Google se naya account hamesha patient hota hai
            user = await User.create({
                name: name || email.split("@")[0],
                email,
                googleId: sub,
                avatar: picture,
                role: "patient",
            });
        } else if (!user.googleId) {
            user.googleId = sub;
            if (!user.avatar && picture) user.avatar = picture;
            await user.save({ validateBeforeSave: false });
        }

        if (user.role === "doctor" && !user.isApproved)
            return res.status(403).json({ message: PENDING_MSG });

        sendToken(user, res);
    } catch (e) {
        console.error("googleLogin error:", e);
        res.status(500).json({ message: e.message || "Google login fail" });
    }
};

exports.logout = (req, res) => {
    res.clearCookie("token");
    res.json({ message: "Logged out" });
};
// Logged-in user apni profile update karta hai
exports.updateMe = async (req, res) => {
    try {
        // Sirf ye fields badal sakte hain. role, email, isApproved yahan se kabhi nahi badlenge
        const allowed = ["name", "phone", "dob", "gender", "bloodGroup", "address", "emergencyContact"];
        if (req.user.role === "doctor") allowed.push("bio", "consultationFee", "experience");
        const updates = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) updates[key] = req.body[key];
        }

        if (updates.name !== undefined) {
            updates.name = String(updates.name).trim();
            if (!updates.name) return res.status(400).json({ message: "Naam khali nahi ho sakta" });
        }
        if (updates.dob === "") updates.dob = null; // date hata di
        for (const k of ["experience", "consultationFee"]) if (updates[k] === "") updates[k] = null;
        if (updates.dob && new Date(updates.dob) > new Date())
            return res.status(400).json({ message: "Date of birth future ki nahi ho sakti" });

        const user = await User.findByIdAndUpdate(req.user._id, updates, {
            new: true,
            runValidators: true,
        }).select("-password");

        res.json({ user });
    } catch (e) {
        res.status(400).json({ message: e.message });
    }
};
exports.me = (req, res) => res.json({ user: req.user });