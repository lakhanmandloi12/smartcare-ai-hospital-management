import { useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import PatientSidebar from "../components/PatientSidebar";
import Topbar from "../components/Topbar";
import { getUser } from "./patientUtils";
import "./patient.css";

function PatientLayout() {
    const [menuOpen, setMenuOpen] = useState(false);
    const user = getUser();

    // Login nahi hai ya role patient nahi hai to login par bhejo
    if (!user.role) return <Navigate to="/login" replace />;
    if (user.role !== "patient") return <Navigate to="/" replace />;

    return (
        <div className="patient-shell">
            <PatientSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

            <div className="patient-main">
                <Topbar />

                <button
                    className="pt-menu-btn"
                    aria-label="Open menu"
                    onClick={() => setMenuOpen(true)}
                >
                    <i className="bi bi-list"></i>
                </button>

                <main className="patient-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default PatientLayout;