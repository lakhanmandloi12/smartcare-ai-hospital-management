import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';
import api from "./services/api"; // services folder src/ mein hai to "../services/api"

function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
}

function fmtTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const initials = (name) =>
    (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

const withDr = (name = "Doctor") => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);

const statusClass = {
    pending: "status-badge pending-status",
    confirmed: "status-badge active-status",
    completed: "status-badge inactive-status",
};

function getStoredName() {
    try {
        return JSON.parse(localStorage.getItem("smartcareUser"))?.name || "";
    } catch {
        return "";
    }
}

function Dashboard() {
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [tick, setTick] = useState(0);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        setError("");
        api.get("/admin/stats")
            .then(({ data }) => alive && setData(data))
            .catch((err) => alive && setError(err.response?.data?.message || "Dashboard data load nahi ho paya."))
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [tick]);

    const firstName = (getStoredName() || "Admin").split(" ")[0];
    const show = (v) => (loading || v === undefined ? "-" : v);
    const today = data?.todayAppointments || [];

    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Topbar />

                <main className="dashboard-content">

                    <div className="mb-4">
                        <h2 className="fw-bold mb-1">
                            {greeting()}, {firstName} 👋
                        </h2>

                        <p className="text-muted mb-0">
                            Here's what's happening in your hospital today.
                        </p>
                    </div>

                    {error && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                            <span>{error}</span>
                            <button className="btn btn-sm btn-outline-danger" onClick={() => setTick((t) => t + 1)}>
                                Retry
                            </button>
                        </div>
                    )}

                    {data?.pendingDoctors > 0 && (
                        <div className="alert alert-warning d-flex justify-content-between align-items-center" role="status">
                            <span>
                                <i className="bi bi-person-exclamation me-2"></i>
                                {data.pendingDoctors} doctor{data.pendingDoctors > 1 ? "s are" : " is"} waiting for your approval.
                            </span>
                            <Link to="/doctors" className="btn btn-sm btn-warning">Review</Link>
                        </div>
                    )}

                    <div className="row g-4 mb-4">

                        <StatCard
                            icon="bi-people"
                            title="Total Patients"
                            value={show(data?.totalPatients)}
                            change={data ? `+${data.newPatients} this week` : ""}
                        />

                        <StatCard
                            icon="bi-person-badge"
                            title="Doctors"
                            value={show(data?.doctors)}
                            change={data ? `${data.pendingDoctors} pending` : ""}
                        />

                        <StatCard
                            icon="bi-calendar-check"
                            title="Appointments Today"
                            value={show(data ? today.length : undefined)}
                            change={data ? `${data.upcoming} upcoming` : ""}
                        />

                        <StatCard
                            icon="bi-cash-stack"
                            title="Revenue (this month)"
                            value={loading || !data ? "-" : `₹${data.revenue.toLocaleString("en-IN")}`}
                            change="Consultation fees"
                        />

                    </div>

                    <div className="row g-4">

                        <div className="col-lg-8">

                            <div className="dashboard-card">

                                <div className="d-flex justify-content-between align-items-center mb-4">

                                    <div>
                                        <h5 className="fw-bold mb-1">
                                            Today's Appointments
                                        </h5>

                                        <p className="text-muted small mb-0">
                                            Upcoming patient appointments
                                        </p>
                                    </div>

                                    <button
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => navigate("/appointments")}
                                    >
                                        View All
                                    </button>

                                </div>

                                {loading ? (
                                    <p className="text-muted mb-0">Loading...</p>
                                ) : today.length === 0 ? (
                                    <div className="text-center text-muted py-4">
                                        <i className="bi bi-calendar2-check fs-2 d-block mb-2"></i>
                                        No appointments scheduled for today.
                                    </div>
                                ) : (
                                    today.map((a) => (
                                        <div className="appointment-row" key={a._id}>
                                            <div className="doctor-avatar">{initials(a.doctor?.name)}</div>

                                            <div className="flex-grow-1">
                                                <h6 className="mb-1 fw-semibold">
                                                    {withDr(a.doctor?.name)}
                                                </h6>

                                                <small className="text-muted">
                                                    {a.doctor?.specialization || "General"} • Patient: {a.patient?.name || "Patient"}
                                                </small>
                                            </div>

                                            <span className={statusClass[a.status] || "status-badge"}>
                                                {a.status}
                                            </span>

                                            <span className="appointment-time">
                                                {fmtTime(a.time)}
                                            </span>
                                        </div>
                                    ))
                                )}

                            </div>

                        </div>

                        <div className="col-lg-4">

                            <div className="ai-card">

                                <div className="ai-icon">
                                    <i className="bi bi-stars"></i>
                                </div>

                                <h4 className="fw-bold mt-3">
                                    SmartCare AI
                                </h4>

                                <p>
                                    Get intelligent assistance for patient queries,
                                    department suggestions and medical summaries.
                                </p>

                                <button className="btn ai-button" onClick={() => navigate("/ai-assistant")}>
                                    <i className="bi bi-chat-dots me-2"></i>
                                    Open AI Assistant
                                </button>

                            </div>

                        </div>

                    </div>

                </main>

            </div>

        </div>
    );
}

export default Dashboard;