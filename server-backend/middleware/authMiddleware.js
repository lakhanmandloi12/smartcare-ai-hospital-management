const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.protect = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) return res.status(401).json({ message: "Login karo" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id);
        if (!req.user) return res.status(401).json({ message: "User nahi mila" });

        if (req.user.role === "doctor" && !req.user.isApproved)
            return res.status(403).json({ message: "Doctor account approval pending" });

        next();
    } catch {
        res.status(401).json({ message: "Token invalid" });
    }
};

exports.authorize = (...roles) => (req, res, next) =>
    roles.includes(req.user.role) ? next() : res.status(403).json({ message: "Access denied" });