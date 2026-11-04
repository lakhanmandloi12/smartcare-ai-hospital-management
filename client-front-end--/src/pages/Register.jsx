import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../pages/services/api";
import AuthHero from "../components/AuthHero";
import "./Login.css";

const roleRoutes = {
    patient: "/patient",
    doctor: "/doctor",
    admin: "/",
};

const roles = [
    {
        value: "patient",
        label: "Patient",
        icon: "bi-person",
        note: "Book appointments and view your prescriptions and records.",
    },
    {
        value: "doctor",
        label: "Doctor",
        icon: "bi-person-badge",
        note: "Doctor accounts are reviewed by the hospital admin. You can sign in once approved.",
    },
    {
        value: "admin",
        label: "Admin",
        icon: "bi-shield-lock",
        note: "Admin accounts need an invite code from the hospital owner.",
    },
];

const specializations = [
    "General Medicine", "Cardiology", "Dermatology", "Neurology", "Orthopedics",
    "Pediatrics", "Gynecology", "ENT", "Psychiatry", "Radiology", "Dentistry", "Other",
];

function Register() {
    const navigate = useNavigate();
    const [role, setRole] = useState("patient");
    const [form, setForm] = useState({
        name: "", email: "", phone: "", password: "", confirm: "",
        specialization: "", licenseNumber: "", experience: "", adminCode: "",
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const activeRole = roles.find((r) => r.value === role);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function chooseRole(value) {
        setRole(value);
        setError("");
    }

    // Sirf Google signup ke liye (Google se seedha login ho jata hai)
    function finishLogin(user) {
        localStorage.setItem(
            "smartcareUser",
            JSON.stringify({ name: user.name, email: user.email, role: user.role })
        );
        window.location.href = roleRoutes[user.role] || "/";
    }

    function showError(err) {
        setError(
            err.response?.data?.message ||
            "Server se connect nahi ho paya. Check karo backend chal raha hai."
        );
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");

        if (form.password.length < 6) {
            return setError("Password kam se kam 6 characters ka rakho.");
        }
        if (form.password !== form.confirm) {
            return setError("Dono passwords match nahi kar rahe.");
        }

        const payload = {
            role,
            name: form.name.trim(),
            email: form.email,
            phone: form.phone,
            password: form.password,
        };
        if (role === "doctor") {
            payload.specialization = form.specialization;
            payload.licenseNumber = form.licenseNumber.trim();
            payload.experience = form.experience;
        }
        if (role === "admin") {
            payload.adminCode = form.adminCode;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/register", payload);
            // Register ke baad login page par bhejo, message ke saath
            navigate("/login", { replace: true, state: { notice: data.message } });
        } catch (err) {
            showError(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle(response) {
        setError("");
        try {
            const { data } = await api.post("/auth/google", {
                credential: response.credential,
            });
            finishLogin(data.user);
        } catch (err) {
            showError(err);
        }
    }

    return (
        <div className="sc-login sc-login--register">
            <AuthHero />

            <main className="sc-panel">
                <div className="sc-box">
                    <nav className="sc-tabs" data-mode="register">
                        <span className="sc-tab-indicator" aria-hidden="true"></span>
                        <Link className="sc-tab" to="/login">Sign in</Link>
                        <span className="sc-tab active" aria-current="page">Create account</span>
                    </nav>

                    <h2 className="sc-title">Create your account</h2>
                    <p className="sc-sub">Choose how you will use SmartCare.</p>

                    <div className="sc-roles" role="radiogroup" aria-label="Account type">
                        {roles.map((r) => (
                            <button
                                key={r.value}
                                type="button"
                                role="radio"
                                aria-checked={role === r.value}
                                className={`sc-role ${role === r.value ? "active" : ""}`}
                                onClick={() => chooseRole(r.value)}
                            >
                                <i className={`bi ${r.icon}`}></i>
                                {r.label}
                            </button>
                        ))}
                    </div>

                    <p className="sc-role-note">
                        <i className="bi bi-info-circle"></i>
                        <span>{activeRole.note}</span>
                    </p>

                    <form onSubmit={handleSubmit} className="sc-form">
                        {error && (
                            <div className="sc-error" role="alert">
                                <i className="bi bi-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

                        <label className="sc-field">
                            <span className="sc-label">Full name</span>
                            <span className="sc-input">
                                <i className="bi bi-person"></i>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder={role === "doctor" ? "Dr. Anita Verma" : "Rahul Sharma"}
                                    autoComplete="name"
                                    required
                                />
                            </span>
                        </label>

                        <div className="sc-row">
                            <label className="sc-field">
                                <span className="sc-label">Email</span>
                                <span className="sc-input">
                                    <i className="bi bi-envelope"></i>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        required
                                    />
                                </span>
                            </label>

                            <label className="sc-field">
                                <span className="sc-label">Phone</span>
                                <span className="sc-input">
                                    <i className="bi bi-telephone"></i>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                        placeholder="98765 43210"
                                        autoComplete="tel"
                                    />
                                </span>
                            </label>
                        </div>

                        {role === "doctor" && (
                            <>
                                <label className="sc-field">
                                    <span className="sc-label">Specialization</span>
                                    <span className="sc-input">
                                        <i className="bi bi-heart-pulse"></i>
                                        <select
                                            name="specialization"
                                            value={form.specialization}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select specialization</option>
                                            {specializations.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </span>
                                </label>

                                <div className="sc-row">
                                    <label className="sc-field">
                                        <span className="sc-label">License number</span>
                                        <span className="sc-input">
                                            <i className="bi bi-card-text"></i>
                                            <input
                                                name="licenseNumber"
                                                value={form.licenseNumber}
                                                onChange={handleChange}
                                                placeholder="MCI-123456"
                                                required
                                            />
                                        </span>
                                    </label>

                                    <label className="sc-field">
                                        <span className="sc-label">Experience (years)</span>
                                        <span className="sc-input">
                                            <i className="bi bi-briefcase"></i>
                                            <input
                                                type="number"
                                                min="0"
                                                max="60"
                                                name="experience"
                                                value={form.experience}
                                                onChange={handleChange}
                                                placeholder="5"
                                                required
                                            />
                                        </span>
                                    </label>
                                </div>
                            </>
                        )}

                        {role === "admin" && (
                            <label className="sc-field">
                                <span className="sc-label">Admin invite code</span>
                                <span className="sc-input">
                                    <i className="bi bi-key"></i>
                                    <input
                                        type="password"
                                        name="adminCode"
                                        value={form.adminCode}
                                        onChange={handleChange}
                                        placeholder="Enter the invite code"
                                        autoComplete="off"
                                        required
                                    />
                                </span>
                            </label>
                        )}

                        <label className="sc-field">
                            <span className="sc-label">Password</span>
                            <span className="sc-input">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="At least 6 characters"
                                    autoComplete="new-password"
                                    required
                                />
                                <button
                                    type="button"
                                    className="sc-eye"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                                </button>
                            </span>
                        </label>

                        <label className="sc-field">
                            <span className="sc-label">Confirm password</span>
                            <span className="sc-input">
                                <i className="bi bi-lock-fill"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="confirm"
                                    value={form.confirm}
                                    onChange={handleChange}
                                    placeholder="Repeat your password"
                                    autoComplete="new-password"
                                    required
                                />
                            </span>
                        </label>

                        <button className="sc-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                    Please wait
                                </>
                            ) : (
                                <>
                                    {role === "doctor"
                                        ? "Submit for approval"
                                        : `Create ${role} account`}
                                    <i className="bi bi-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Google se sirf patient account banta hai */}
                    {role === "patient" && (
                        <>
                            <div className="sc-divider"><span>or</span></div>
                            <div className="sc-google">
                                <GoogleLogin
                                    onSuccess={handleGoogle}
                                    onError={() => setError("Google signup fail ho gaya. Dobara try karo.")}
                                    text="signup_with"
                                    shape="rectangular"
                                    width="300"
                                />
                            </div>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Register;