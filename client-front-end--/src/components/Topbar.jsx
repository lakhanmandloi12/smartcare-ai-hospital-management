import { useEffect, useRef, useState } from "react";

import { useLocation } from "react-router-dom";
import api from "../pages/services/api"; // services folder src/ mein hai to "../services/api"
import "./Topbar.css"

const NOTIFICATIONS = {
    doctor: [
        "New appointment........",
        "Lab record available..",
    ],
    patient: [
        "Your appointement tommorrow at 11PM",
        "Prescription updated...",
    ],
    admin: [
        "New doctor registration pending..",
        "3 appointment requested..",
    ],
};

function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("smartcareUser")) || {};
    } catch {
        return {};
    }
}

const roleLabels = {
    admin: "Administrator",
    doctor: "Doctor",
    patient: "Patient",
};

function Topbar() {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(getStoredUser());
    const wrapRef = useRef(null);

    // ---- Notification state (profile menu se alag) ----
    const [notifOpen, setNotifOpen] = useState(false);
    const notifRef = useRef(null);
    const { pathname } = useLocation();

    // Role: pehle URL se, nahi mila to logged-in user ke role se
    const role = pathname.includes("/doctor")
        ? "doctor"
        : pathname.includes("/admin")
            ? "admin"
            : pathname.includes("/patient")
                ? "patient"
                : user.role || "patient";

    const items = NOTIFICATIONS[role] || [];

    // page badalne par notification dropdown band
    useEffect(() => {
        setNotifOpen(false);
    }, [pathname]);

    // bahar click par notification dropdown band
    useEffect(() => {
        function onClick(e) {
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    // Backend se poori details lao (phone, joined date, etc.)
    useEffect(() => {
        api.get("/auth/me")
            .then(({ data }) => setUser(data.user))
            .catch(() => { });
    }, []);

    // Bahar click karne ya Escape dabane par band ho
    useEffect(() => {
        function onClick(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
        }
        function onKey(e) {
            if (e.key === "Escape") {
                setOpen(false);
                setNotifOpen(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, []);

    async function handleLogout() {
        try {
            await api.post("/auth/logout");
        } catch {
            // server band ho tab bhi local logout chalega
        }
        localStorage.removeItem("smartcareUser");
        window.location.href = "/login";
    }

    const name = user.name || "User";
    const roleLabel = roleLabels[user.role] || "User";
    const joined = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        })
        : null;

    return (
        <header className="topbar">
            <div>
                <span className="text-muted">Hospital Management</span>
            </div>

            <div className="topbar-right">
                <div className="notification-wrap" ref={notifRef}>
                    <button
                        className="notification-btn"
                        onClick={() => {
                            setNotifOpen((o) => !o);
                            setOpen(false);
                        }}
                    >
                        <i className="bi bi-bell"></i>
                        {items.length > 0 && <span>{items.length}</span>}
                    </button>

                    {notifOpen && (
                        <div className="notification-dropdown">
                            <h6>{role.toUpperCase()} Notifications</h6>
                            {items.length === 0 ? (
                                <p>Koi notification nahi</p>
                            ) : (
                                items.map((n, i) => (
                                    <div key={i} className="notification-item">{n}</div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <div className="profile-wrap" ref={wrapRef}>
                    <div
                        className={`user-profile ${open ? "open" : ""}`}
                        role="button"
                        tabIndex={0}
                        aria-haspopup="menu"
                        aria-expanded={open}
                        onClick={() => {
                            setOpen((o) => !o);
                            setNotifOpen(false);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setOpen((o) => !o);
                            }
                        }}
                    >
                        <div className="user-avatar">{name.charAt(0).toUpperCase()}</div>

                        <div>
                            <strong>{name}</strong>
                            <small>{roleLabel}</small>
                        </div>

                        <i className="bi bi-chevron-down ms-2"></i>
                    </div>

                    {open && (
                        <div className="profile-menu" role="menu">
                            <div className="profile-menu-head">
                                <div className="profile-menu-avatar">{name.charAt(0).toUpperCase()}</div>
                                <div className="profile-menu-id">
                                    <strong>{name}</strong>
                                    <span className="badge bg-primary-subtle text-primary-emphasis">
                                        {roleLabel}
                                    </span>
                                </div>
                            </div>

                            <ul className="profile-menu-details">
                                <li>
                                    <i className="bi bi-envelope"></i>
                                    <span>{user.email || "-"}</span>
                                </li>
                                <li>
                                    <i className="bi bi-telephone"></i>
                                    <span>{user.phone || "Not added"}</span>
                                </li>
                                {joined && (
                                    <li>
                                        <i className="bi bi-calendar3"></i>
                                        <span>Member since {joined}</span>
                                    </li>
                                )}
                            </ul>

                            <button className="profile-menu-logout" onClick={handleLogout}>
                                <i className="bi bi-box-arrow-right"></i>
                                Logout
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}

export default Topbar;