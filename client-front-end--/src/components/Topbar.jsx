import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import api from "../pages/services/api"; // services folder src/ mein hai to "../services/api"
import "./Topbar.css";

/* ---------- Data ---------- */
const NAV = {
    admin: [
        { label: "Dashboard", to: "/", icon: "bi-grid" },
        { label: "Patients", to: "/patients", icon: "bi-people" },
        { label: "Doctors", to: "/doctors", icon: "bi-person-badge" },
        { label: "Appointments", to: "/appointments", icon: "bi-calendar-check" },
        { label: "Medical Records", to: "/medical-records", icon: "bi-file-earmark-medical" },
        { label: "Prescriptions", to: "/prescriptions", icon: "bi-capsule" },
        { label: "Billing", to: "/billing", icon: "bi-receipt" },
        { label: "AI Assistant", to: "/ai-assistant", icon: "bi-stars" },
        { label: "Settings", to: "/settings", icon: "bi-gear" },
    ],
    doctor: [
        { label: "Dashboard", to: "/doctor", icon: "bi-grid" },
        { label: "Appointments", to: "/doctor/appointments", icon: "bi-calendar-check" },
        { label: "My patients", to: "/doctor/patients", icon: "bi-people" },
        { label: "Prescriptions", to: "/doctor/records", icon: "bi-file-earmark-medical" },
        { label: "My profile", to: "/doctor/profile", icon: "bi-person" },
    ],
    patient: [
        { label: "Dashboard", to: "/patient", icon: "bi-grid" },
        { label: "Appointments", to: "/patient/appointments", icon: "bi-calendar-check" },
        { label: "Medical records", to: "/patient/records", icon: "bi-file-earmark-medical" },
        { label: "AI Assistant", to: "/patient/ai", icon: "bi-stars" },
        { label: "My profile", to: "/patient/profile", icon: "bi-person" },
    ],
};

// Abhi dummy hain. Asli notifications baad mein backend se aayengi.
const NOTIFICATIONS = {
    admin: [
        { icon: "bi-person-exclamation", tone: "amber", text: "New doctor registration pending", time: "5 min ago", to: "/doctors" },
        { icon: "bi-calendar-plus", tone: "blue", text: "3 appointment requests waiting", time: "20 min ago", to: "/appointments" },
        { icon: "bi-person-plus", tone: "green", text: "New patient registered", time: "1 hour ago", to: "/patients" },
    ],
    doctor: [
        { icon: "bi-calendar-plus", tone: "blue", text: "New appointment request", time: "10 min ago", to: "/doctor/appointments" },
        { icon: "bi-file-earmark-medical", tone: "violet", text: "Lab report is available", time: "1 hour ago", to: "/doctor/records" },
    ],
    patient: [
        { icon: "bi-alarm", tone: "amber", text: "Your appointment is tomorrow at 11:00 AM", time: "2 hours ago", to: "/patient/appointments" },
        { icon: "bi-capsule", tone: "green", text: "Your prescription was updated", time: "Yesterday", to: "/patient/records" },
    ],
};

const roleLabels = { admin: "Administrator", doctor: "Doctor", patient: "Patient" };
const READ_KEY = "smartcareReadNotifs";
const ALL_NAV = Object.values(NAV).flat();

// Intro animation sirf pehli baar (har page par Topbar dobara mount hota hai)
let introPlayed = false;

/* ---------- Helpers ---------- */
function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("smartcareUser")) || {};
    } catch {
        return {};
    }
}

function loadRead() {
    try {
        return JSON.parse(localStorage.getItem(READ_KEY)) || [];
    } catch {
        return [];
    }
}

function pageTitle(pathname) {
    const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
    const hit = ALL_NAV.find((n) => n.to === path);
    if (hit) return hit.label;
    const last = path.split("/").filter(Boolean).pop() || "Dashboard";
    return last.replace(/-/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

/* ---------- Quick search (Ctrl + K) ---------- */
function Palette({ items, onClose, onGo }) {
    const [q, setQ] = useState("");
    const [active, setActive] = useState(0);
    const inputRef = useRef(null);

    const list = useMemo(
        () => items.filter((i) => i.label.toLowerCase().includes(q.trim().toLowerCase())),
        [items, q]
    );

    useEffect(() => {
        inputRef.current?.focus();
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, []);

    useEffect(() => setActive(0), [q]);

    useEffect(() => {
        document.getElementById(`tb-opt-${active}`)?.scrollIntoView({ block: "nearest" });
    }, [active]);

    function onKeyDown(e) {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => (list.length ? (a + 1) % list.length : 0));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => (list.length ? (a - 1 + list.length) % list.length : 0));
        } else if (e.key === "Enter" && list[active]) {
            e.preventDefault();
            onGo(list[active].to);
        }
    }

    return (
        <div
            className="tb-overlay"
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="tb-palette" role="dialog" aria-modal="true" aria-label="Jump to a page">
                <div className="tb-palette-input">
                    <i className="bi bi-search"></i>
                    <input
                        ref={inputRef}
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        onKeyDown={onKeyDown}
                        placeholder="Jump to a page..."
                        aria-label="Search pages"
                    />
                    <kbd>Esc</kbd>
                </div>

                <ul className="tb-palette-list" role="listbox">
                    {list.length === 0 && <li className="tb-palette-empty">No page found</li>}
                    {list.map((item, i) => (
                        <li
                            id={`tb-opt-${i}`}
                            key={item.to}
                            role="option"
                            aria-selected={i === active}
                            className={i === active ? "active" : ""}
                            onMouseEnter={() => setActive(i)}
                            onClick={() => onGo(item.to)}
                        >
                            <span className="tb-palette-icon"><i className={`bi ${item.icon}`}></i></span>
                            <span>{item.label}</span>
                            <i className="bi bi-arrow-return-left tb-palette-enter"></i>
                        </li>
                    ))}
                </ul>

                <div className="tb-palette-foot">
                    <span><kbd>↑</kbd><kbd>↓</kbd> move</span>
                    <span><kbd>Enter</kbd> open</span>
                </div>
            </div>
        </div>
    );
}

/* ---------- Topbar ---------- */
function Topbar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();

    const [user, setUser] = useState(getStoredUser);
    const [open, setOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [readIds, setReadIds] = useState(loadRead);
    const [intro] = useState(!introPlayed);

    const profileRef = useRef(null);
    const notifRef = useRef(null);

    const role =
        user.role ||
        (/^\/doctor(\/|$)/.test(pathname) ? "doctor" : /^\/patient(\/|$)/.test(pathname) ? "patient" : "admin");

    const title = useMemo(() => pageTitle(pathname), [pathname]);
    const today = useMemo(
        () => new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" }),
        []
    );
    const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);

    const notifs = useMemo(
        () =>
            (NOTIFICATIONS[role] || []).map((n, i) => {
                const id = `${role}:${i}`;
                return { ...n, id, read: readIds.includes(id) };
            }),
        [role, readIds]
    );
    const unread = notifs.filter((n) => !n.read).length;

    /* ----- effects ----- */
    useEffect(() => {
        introPlayed = true;
    }, []);

    // Backend se poori details lao
    useEffect(() => {
        api.get("/auth/me")
            .then(({ data }) => setUser(data.user))
            .catch(() => { });
    }, []);

    // Scroll par shadow aur blur
    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 6);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Page badalne par sab band
    useEffect(() => {
        setOpen(false);
        setNotifOpen(false);
        setPaletteOpen(false);
    }, [pathname]);

    // Bahar click karne par dropdown band
    useEffect(() => {
        function onDown(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) setOpen(false);
            if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
        }
        document.addEventListener("mousedown", onDown);
        return () => document.removeEventListener("mousedown", onDown);
    }, []);

    // Keyboard: Ctrl/Cmd + K aur Escape
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
                e.preventDefault();
                setPaletteOpen((o) => !o);
                setOpen(false);
                setNotifOpen(false);
            } else if (e.key === "Escape") {
                setOpen(false);
                setNotifOpen(false);
                setPaletteOpen(false);
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, []);

    /* ----- actions ----- */
    function persist(next) {
        setReadIds(next);
        try {
            localStorage.setItem(READ_KEY, JSON.stringify(next));
        } catch {
            /* storage band ho to bhi chalega */
        }
    }

    const markAll = () => persist([...new Set([...readIds, ...notifs.map((n) => n.id)])]);

    function openNotif(n) {
        if (!n.read) persist([...readIds, n.id]);
        setNotifOpen(false);
        if (n.to) navigate(n.to);
    }

    function goTo(to) {
        setPaletteOpen(false);
        navigate(to);
    }

    async function handleLogout() {
        try {
            await api.post("/auth/logout");
        } catch {
            // server band ho tab bhi local logout chalega
        }
        localStorage.removeItem("smartcareUser");
        window.location.href = "/login";
    }

    /* ----- derived ----- */
    const name = user.name || "User";
    const initial = name.charAt(0).toUpperCase();
    const roleLabel = roleLabels[role] || "User";
    const joined = user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
        : null;
    const profileLink =
        role === "admin"
            ? { to: "/settings", label: "Settings", icon: "bi-gear" }
            : { to: `/${role}/profile`, label: "My profile", icon: "bi-person" };

    return (
        <>
            <header className={`tb ${scrolled ? "scrolled" : ""} ${intro ? "tb-intro" : ""}`}>
                <div className="tb-left">
                    <span className="tb-logo" aria-hidden="true">
                        <i className="bi bi-heart-pulse-fill"></i>
                    </span>
                    <div className="tb-heading">
                        <div className="tb-title">{title}</div>
                        <span className="tb-date">{today}</span>
                    </div>
                </div>

                <div className="tb-right">
                    <button
                        type="button"
                        className="tb-search"
                        onClick={() => {
                            setPaletteOpen(true);
                            setOpen(false);
                            setNotifOpen(false);
                        }}
                        aria-label="Search pages"
                    >
                        <i className="bi bi-search"></i>
                        <span className="tb-search-text">Search pages</span>
                        <kbd>{isMac ? "⌘K" : "Ctrl K"}</kbd>
                    </button>

                    <ThemeToggle />

                    {/* ===== Notifications ===== */}
                    <div className="tb-wrap" ref={notifRef}>
                        <button
                            type="button"
                            className={`tb-icon-btn tb-bell ${notifOpen ? "active" : ""} ${intro && unread > 0 ? "ring" : ""}`}
                            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
                            aria-haspopup="dialog"
                            aria-expanded={notifOpen}
                            onClick={() => {
                                setNotifOpen((o) => !o);
                                setOpen(false);
                            }}
                        >
                            <i className="bi bi-bell tb-bell-icon"></i>
                            {unread > 0 && <span className="tb-badge" key={unread}>{unread}</span>}
                        </button>

                        {notifOpen && (
                            <div className="tb-pop tb-notif" role="dialog" aria-label="Notifications">
                                <div className="tb-pop-head">
                                    <strong>Notifications</strong>
                                    {unread > 0 && (
                                        <button type="button" className="tb-link" onClick={markAll}>
                                            Mark all read
                                        </button>
                                    )}
                                </div>

                                {notifs.length === 0 ? (
                                    <div className="tb-notif-empty">
                                        <i className="bi bi-bell-slash"></i>
                                        <p>You're all caught up</p>
                                    </div>
                                ) : (
                                    <ul className="tb-notif-list">
                                        {notifs.map((n, i) => (
                                            <li key={n.id}>
                                                <button
                                                    type="button"
                                                    className={`tb-notif-item tb-anim ${n.read ? "" : "unread"}`}
                                                    style={{ "--i": i }}
                                                    onClick={() => openNotif(n)}
                                                >
                                                    <span className={`tb-tone tone-${n.tone}`}>
                                                        <i className={`bi ${n.icon}`}></i>
                                                    </span>
                                                    <span className="tb-notif-body">
                                                        <span className="tb-notif-text">{n.text}</span>
                                                        <small>{n.time}</small>
                                                    </span>
                                                    {!n.read && <span className="tb-dot" aria-label="Unread"></span>}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>

                    {/* ===== Profile ===== */}
                    <div className="tb-wrap" ref={profileRef}>
                        <div
                            className={`tb-profile ${open ? "open" : ""}`}
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
                                    setNotifOpen(false);
                                }
                            }}
                        >
                            <span className="tb-avatar">
                                <span className="tb-avatar-face">{initial}</span>
                                <span className="tb-status"></span>
                            </span>

                            <span className="tb-profile-text">
                                <strong>{name}</strong>
                                <small>{roleLabel}</small>
                            </span>

                            <i className="bi bi-chevron-down tb-chevron"></i>
                        </div>

                        {open && (
                            <div className="tb-pop tb-menu" role="menu">
                                <div className="tb-menu-head">
                                    <span className="tb-avatar lg">
                                        <span className="tb-avatar-face">{initial}</span>
                                    </span>
                                    <div className="tb-menu-id">
                                        <strong>{name}</strong>
                                        <span className="tb-role">{roleLabel}</span>
                                    </div>
                                </div>

                                <ul className="tb-menu-details">
                                    <li className="tb-anim" style={{ "--i": 0 }}>
                                        <i className="bi bi-envelope"></i>
                                        <span>{user.email || "-"}</span>
                                    </li>
                                    <li className="tb-anim" style={{ "--i": 1 }}>
                                        <i className="bi bi-telephone"></i>
                                        <span>{user.phone || "Not added"}</span>
                                    </li>
                                    {joined && (
                                        <li className="tb-anim" style={{ "--i": 2 }}>
                                            <i className="bi bi-calendar3"></i>
                                            <span>Member since {joined}</span>
                                        </li>
                                    )}
                                </ul>

                                <button
                                    type="button"
                                    role="menuitem"
                                    className="tb-menu-link tb-anim"
                                    style={{ "--i": 3 }}
                                    onClick={() => {
                                        setOpen(false);
                                        navigate(profileLink.to);
                                    }}
                                >
                                    <i className={`bi ${profileLink.icon}`}></i>
                                    {profileLink.label}
                                    <i className="bi bi-chevron-right"></i>
                                </button>

                                <button type="button" role="menuitem" className="tb-logout" onClick={handleLogout}>
                                    <i className="bi bi-box-arrow-right"></i>
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Portal: header ke blur ke andar fixed element galat jagah dikhta hai, isliye body mein */}
            {paletteOpen &&
                createPortal(
                    <Palette items={NAV[role] || NAV.admin} onClose={() => setPaletteOpen(false)} onGo={goTo} />,
                    document.body
                )}
        </>
    );
}

export default Topbar;