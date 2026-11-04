import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import "./Settings.css";

const STORAGE_KEY = "hospitalSettings";

const defaultSettings = {
    hospitalName: "SmartCare AI Hospital",
    email: "admin@smartcare.com",
    phone: "+91 9876543210",
    address: "Indore, Madhya Pradesh",
    notifications: true,
    emailAlerts: true,
    darkMode: false,
};

const preferenceItems = [
    {
        name: "notifications",
        label: "Enable notifications",
        hint: "Show alerts for new appointments and patient updates.",
    },
    {
        name: "emailAlerts",
        label: "Email alerts",
        hint: "Send important updates to the hospital email address.",
    },
    {
        name: "darkMode",
        label: "Dark mode",
        hint: "Use a darker color theme across the dashboard.",
    },
];

// Pehle se save ki hui settings load karo (default ke upar merge)
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        return { ...defaultSettings, ...(saved || {}) };
    } catch {
        return defaultSettings;
    }
}

function Settings() {
    const [settings, setSettings] = useState(loadSettings);
    const [saved, setSaved] = useState(false);

    // Dark mode Bootstrap 5.3 ke data-bs-theme se chalta hai
    useEffect(() => {
        document.documentElement.setAttribute(
            "data-bs-theme",
            settings.darkMode ? "dark" : "light"
        );
    }, [settings.darkMode]);

    // Success message 3 second baad apne aap hat jaye
    useEffect(() => {
        if (!saved) return;
        const t = setTimeout(() => setSaved(false), 3000);
        return () => clearTimeout(t);
    }, [saved]);

    const updateSetting = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
            setSaved(true);
        } catch {
            alert("Settings save nahi ho paayi. Browser storage check karo.");
        }
    };

    const handleReset = () => {
        setSettings(defaultSettings);
        localStorage.removeItem(STORAGE_KEY);
        setSaved(false);
    };

    return (
        <div className="app-layout">
            <Sidebar />

            <div className="main-content">
                <Topbar />

                <main className="settings-content">
                    <div className="settings-header">
                        <h2 className="fw-bold mb-1">Settings</h2>
                        <p className="text-muted mb-0">
                            Manage hospital and application preferences.
                        </p>
                    </div>

                    {saved && (
                        <div
                            className="alert alert-success d-flex align-items-center gap-2 settings-alert"
                            role="status"
                        >
                            <i className="bi bi-check-circle-fill"></i>
                            Settings saved successfully.
                        </div>
                    )}

                    <div className="row g-4">
                        <div className="col-lg-8">
                            <form
                                className="card settings-card p-4"
                                onSubmit={handleSave}
                            >
                                <h5 className="fw-bold mb-4">
                                    Hospital information
                                </h5>

                                <div className="mb-3">
                                    <label
                                        className="form-label"
                                        htmlFor="hospitalName"
                                    >
                                        Hospital name
                                    </label>
                                    <input
                                        id="hospitalName"
                                        className="form-control"
                                        name="hospitalName"
                                        value={settings.hospitalName}
                                        onChange={updateSetting}
                                        required
                                    />
                                </div>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="email"
                                        >
                                            Email address
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={settings.email}
                                            onChange={updateSetting}
                                            required
                                        />
                                    </div>

                                    <div className="col-md-6 mb-3">
                                        <label
                                            className="form-label"
                                            htmlFor="phone"
                                        >
                                            Phone number
                                        </label>
                                        <input
                                            id="phone"
                                            type="tel"
                                            className="form-control"
                                            name="phone"
                                            value={settings.phone}
                                            onChange={updateSetting}
                                        />
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <label
                                        className="form-label"
                                        htmlFor="address"
                                    >
                                        Hospital address
                                    </label>
                                    <textarea
                                        id="address"
                                        className="form-control"
                                        rows="3"
                                        name="address"
                                        value={settings.address}
                                        onChange={updateSetting}
                                    />
                                </div>

                                <div className="d-flex gap-2">
                                    <button type="submit" className="btn btn-primary">
                                        <i className="bi bi-check-circle me-2"></i>
                                        Save changes
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={handleReset}
                                    >
                                        Reset to default
                                    </button>
                                </div>
                            </form>

                            <div className="card settings-card p-4 mt-4">
                                <h5 className="fw-bold mb-3">Preferences</h5>

                                {preferenceItems.map(({ name, label, hint }) => (
                                    <div className="pref-row" key={name}>
                                        <div>
                                            <label
                                                className="pref-label"
                                                htmlFor={name}
                                            >
                                                {label}
                                            </label>
                                            <div className="pref-hint">{hint}</div>
                                        </div>
                                        <div className="form-check form-switch m-0">
                                            <input
                                                id={name}
                                                className="form-check-input"
                                                type="checkbox"
                                                role="switch"
                                                name={name}
                                                checked={settings[name]}
                                                onChange={updateSetting}
                                            />
                                        </div>
                                    </div>
                                ))}

                                <p className="pref-note">
                                    Preferences "Save changes" dabane par save hoti hain.
                                </p>
                            </div>
                        </div>

                        <div className="col-lg-4">
                            <div className="card settings-card p-4 text-center">
                                <div className="brand-icon">
                                    <i className="bi bi-hospital"></i>
                                </div>
                                <h5 className="fw-bold mt-3 mb-1">
                                    {settings.hospitalName || "SmartCare AI"}
                                </h5>
                                <p className="text-muted small mb-3">
                                    Hospital Management System
                                </p>
                                <span className="badge bg-success align-self-center">
                                    Admin account
                                </span>

                                <ul className="brand-details">
                                    <li>
                                        <i className="bi bi-envelope"></i>
                                        <span>{settings.email || "-"}</span>
                                    </li>
                                    <li>
                                        <i className="bi bi-telephone"></i>
                                        <span>{settings.phone || "-"}</span>
                                    </li>
                                    <li>
                                        <i className="bi bi-geo-alt"></i>
                                        <span>{settings.address || "-"}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

export default Settings;