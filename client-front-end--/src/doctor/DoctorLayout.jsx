import { NavLink, Outlet } from "react-router-dom";
import Topbar from "../components/Topbar";
import "./doctor.css";

const links = [
    ["/doctor", "bi-grid", "Dashboard", true],
    ["/doctor/appointments", "bi-calendar-check", "Appointments"],
    ["/doctor/patients", "bi-people", "My patients"],
    ["/doctor/records", "bi-file-earmark-medical", "Prescriptions"],
    ["/doctor/profile", "bi-person", "My profile"],
];

function DoctorLayout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="brand">
                    <div className="brand-icon">
                        <i className="bi bi-heart-pulse-fill"></i>
                    </div>
                    <div>
                        <h5>SmartCare AI</h5>
                        <small>Doctor Portal</small>
                    </div>
                </div>

                <div className="menu-title">MENU</div>

                {links.map(([to, icon, label, end]) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
                    >
                        <i className={`bi ${icon}`}></i>
                        {label}
                    </NavLink>
                ))}
            </aside>

            <div className="main-content">
                <Topbar />
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default DoctorLayout;