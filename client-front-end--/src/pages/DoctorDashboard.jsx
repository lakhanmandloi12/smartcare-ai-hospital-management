import api from "./services/api"; // agar services folder src/ mein hai to "../services/api"

function DoctorDashboard() {
    let user = {};

    try {
        user = JSON.parse(localStorage.getItem("smartcareUser")) || {};
    } catch {
        user = {};
    }

    const name = user.name || "Doctor";
    const displayName = /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;

    async function handleLogout() {
        try {
            await api.post("/auth/logout"); // backend cookie hataye
        } catch {
            // server band ho tab bhi local logout chalega
        }
        localStorage.removeItem("smartcareUser");
        window.location.href = "/login";
    }

    return (
        <div className="role-dashboard">
            <header className="role-topbar">
                <h4 className="fw-bold mb-0">
                    <i className="bi bi-heart-pulse-fill text-primary me-2"></i>
                    SmartCare AI — Doctor Portal
                </h4>

                <button className="btn btn-outline-secondary" onClick={handleLogout}>
                    Logout
                </button>
            </header>

            <main className="role-content">
                <p className="text-primary fw-semibold">DOCTOR PORTAL</p>
                <h2 className="fw-bold">Welcome, {displayName} 👋</h2>
                <p className="text-muted">
                    Manage your schedule and patient appointments.
                </p>

                <div className="row g-4 mt-2">
                    {[
                        ["Today's Appointments", "8", "bi-calendar-check"],
                        ["Assigned Patients", "24", "bi-people"],
                        ["Pending Records", "5", "bi-file-medical"],
                    ].map(([title, value, icon]) => (
                        <div className="col-md-4" key={title}>
                            <div className="role-card">
                                <div className="role-card-icon">
                                    <i className={`bi ${icon}`}></i>
                                </div>
                                <p className="text-muted mt-3 mb-1">{title}</p>
                                <h2 className="fw-bold">{value}</h2>
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}

export default DoctorDashboard;