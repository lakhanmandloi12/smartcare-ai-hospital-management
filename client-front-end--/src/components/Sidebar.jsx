import { NavLink } from "react-router-dom";

function Sidebar() {
    return (
        <aside className="sidebar">

            {/* BRAND */}
            <div className="brand">
                <div className="brand-icon">
                    <i className="bi bi-heart-pulse-fill"></i>
                </div>

                <div>
                    <h5>SmartCare</h5>
                    <small>AI Healthcare</small>
                </div>
            </div>


            <div className="menu-title">MAIN MENU</div>

            <nav>

                <NavLink
                    to="/"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-grid-1x2-fill"></i>
                    Dashboard
                </NavLink>


                <NavLink
                    to="/patients"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-people-fill"></i>
                    Patients
                </NavLink>


                <NavLink
                    to="/doctors"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-person-badge-fill"></i>
                    Doctors
                </NavLink>


                <NavLink
                    to="/appointments"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-calendar2-check-fill"></i>
                    Appointments
                </NavLink>


                <NavLink
                    to="/medical-records"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-file-medical-fill"></i>
                    Medical Records
                </NavLink>


                <NavLink
                    to="/prescriptions"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-capsule"></i>
                    Prescriptions
                </NavLink>


                <NavLink
                    to="/billing"
                    className={({ isActive }) =>
                        `sidebar-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-credit-card-fill"></i>
                    Billing
                </NavLink>

            </nav>


            <div className="menu-title mt-4">
                SMART TOOLS
            </div>

            <nav>

                <NavLink
                    to="/ai-assistant"
                    className={({ isActive }) =>
                        `sidebar-link ai-link ${isActive ? "active" : ""}`
                    }
                >
                    <i className="bi bi-stars"></i>
                    AI Assistant
                </NavLink>

            </nav>


            <div className="sidebar-bottom">

                <a className="sidebar-link">
                    <i className="bi bi-gear-fill"></i>
                    Settings
                </a>

                <a className="sidebar-link">
                    <i className="bi bi-box-arrow-right"></i>
                    Logout
                </a>

            </div>

        </aside>
    );
}

export default Sidebar;