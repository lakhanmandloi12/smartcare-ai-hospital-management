require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.set("trust proxy", 1);
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// DB connection (har request pe reuse hoga)    
async function connectDB() {
    if (mongoose.connection.readyState === 1) return;
    await mongoose.connect(process.env.MONGO_URI);
}
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error("Mongo error:", err.message);
        res.status(500).json({ message: "Database connection failed", error: err.message });
    }
});

app.get("/", (req, res) => res.send("API running"));

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/records", require("./routes/recordRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));

// Sirf local pe chalane ke liye (Vercel pe ye skip hoga)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log("Server chal gaya on " + PORT));
}

module.exports = app;