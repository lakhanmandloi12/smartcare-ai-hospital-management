import { NavLink } from "react-router-dom";

const links = [
    { to: "/patient", label: "Dashboard", icon: "bi-grid", end: true },
    { to: "/patient/appointments", label: "Appointments", icon: "bi-calendar-check" },
    { to: "/patient/records", label: "Medical records", icon: "bi-file-earmark-medical" },
    { to: "/patient/profile", label: "My profile", icon: "bi-person" },
];

function PatientSidebar({ open, onClose }) {
    return (
        <>
            {open && <div className="pt-backdrop" onClick={onClose} />}

            <aside className={`sidebar patient-sidebar ${open ? "open" : ""}`}>
                <div className="ps-brand">
                    <span className="ps-logo">
                        <i className="bi bi-heart-pulse"></i>
                    </span>
                    <div>
                        <strong>SmartCare AI</strong>
                        <small>Patient portal</small>
                    </div>
                </div>

                <nav className="ps-nav" aria-label="Patient navigation">
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.end}
                            onClick={onClose}
                            className={({ isActive }) => `ps-link ${isActive ? "active" : ""}`}
                        >
                            <i className={`bi ${l.icon}`}></i>
                            {l.label}
                        </NavLink>

                    ))}
                </nav>
                <NavLink to="/patient/ai" className="ps-link">
                    <i className="bi bi-stars"></i> AI Assistant
                </NavLink>

                <div className="ps-help">
                    <i className="bi bi-telephone-outbound"></i>
                    <div>
                        <strong>Emergency?</strong>
                        <span>Call 108 for an ambulance</span>
                    </div>
                </div>
            </aside>
        </>
    );
}

export default PatientSidebar;