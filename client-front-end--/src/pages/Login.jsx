import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import api from "../pages/services/api";
import AuthHero from "../components/AuthHero";
import "./Login.css";

const roleRoutes = {
    patient: "/patient",
    doctor: "/doctor",
    admin: "/",
};

function Login() {
    const [form, setForm] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const location = useLocation();
    const notice = location.state?.notice || "";

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

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
        setLoading(true);
        try {
            const { data } = await api.post("/auth/login", {
                email: form.email,
                password: form.password,
            });
            finishLogin(data.user);
        } catch (err) {
            showError(err);
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogle(response) {
        setError("");

        if (!response?.credential) {
            setError("Google se credential nahi mila. Dobara try karo.");
            return;
        }

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
        <div className="sc-login">
            <AuthHero />

            <main className="sc-panel">
                <div className="sc-box">
                    <nav className="sc-tabs" data-mode="login">
                        <span className="sc-tab-indicator" aria-hidden="true"></span>
                        <span className="sc-tab active" aria-current="page">Sign in</span>
                        <Link className="sc-tab" to="/register">Create account</Link>
                    </nav>

                    <h2 className="sc-title">Welcome back</h2>
                    <p className="sc-sub">Sign in to open your dashboard.</p>

                    {notice && (
                        <div className="sc-success" role="status">
                            <i className="bi bi-check-circle"></i>
                            <span>{notice}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="sc-form">
                        {error && (
                            <div className="sc-error" role="alert">
                                <i className="bi bi-exclamation-circle"></i>
                                <span>{error}</span>
                            </div>
                        )}

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
                            <span className="sc-label">Password</span>
                            <span className="sc-input">
                                <i className="bi bi-lock"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
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

                        <button className="sc-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm" aria-hidden="true"></span>
                                    Please wait
                                </>
                            ) : (
                                <>
                                    Sign in <i className="bi bi-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="sc-divider"><span>or</span></div>

                    <div className="sc-google">
                        <GoogleLogin
                            onSuccess={handleGoogle}
                            onError={() => setError("Google login fail ho gaya. Dobara try karo.")}
                            text="continue_with"
                            shape="rectangular"
                            width="300"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default Login;