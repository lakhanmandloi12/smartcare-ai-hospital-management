import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "./useApi";
import ApptActions from "./ApptActions";
import { fmtTime, getStoredUser, greeting, initials, statusLabel } from "./doctorUtils";

function DoctorDashboard() {
    const { data, loading, error, reload } = useApi("/doctors/me/stats");
    const [actionError, setActionError] = useState("");

    const name = getStoredUser().name || "Doctor";
    const displayName = /^dr\.?\s/i.test(name) ? name : `Dr. ${name}`;

    const stats = [
        ["Today's appointments", data?.todayCount, "bi-calendar-check"],
        ["Pending requests", data?.pendingCount, "bi-hourglass-split"],
        ["My patients", data?.totalPatients, "bi-people"],
        ["Records written", data?.recordsCount, "bi-file-earmark-medical"],
    ];

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 className="fw-bold mb-1">
                        {greeting()}, {displayName}
                    </h2>
                    <p className="text-muted mb-0">Here is your schedule and patient activity.</p>
                </div>
                <Link to="/doctor/records" className="btn btn-primary">
                    <i className="bi bi-plus-lg me-1"></i> New prescription
                </Link>
            </div>

            {(error || actionError) && (
                <div className="dr-alert error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error || actionError}</span>
                    <button onClick={reload}>Retry</button>
                </div>
            )}

            <div className="row g-4 mb-4">
                {stats.map(([title, value, icon]) => (
                    <div className="col-sm-6 col-xl-3" key={title}>
                        <div className="stat-card d-flex justify-content-between align-items-start">
                            <div>
                                <div className="stat-title">{title}</div>
                                <div className="stat-value">{loading ? "-" : value ?? 0}</div>
                            </div>
                            <div className="stat-icon">
                                <i className={`bi ${icon}`}></i>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="dashboard-card">
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="fw-bold mb-0">Today's schedule</h5>
                    <Link to="/doctor/appointments" className="small text-decoration-none">
                        View all
                    </Link>
                </div>

                {loading ? (
                    <p className="text-muted mb-0 mt-3">Loading...</p>
                ) : data?.today?.length ? (
                    data.today.map((a) => (
                        <div className="appointment-row" key={a._id}>
                            <div className="dr-time">{fmtTime(a.time)}</div>
                            <div className="doctor-avatar">{initials(a.patient?.name)}</div>
                            <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                <strong>{a.patient?.name || "Patient"}</strong>
                                <div className="text-muted small">{a.reason || "No reason given"}</div>
                            </div>
                            <span className={`dr-badge ${a.status}`}>{statusLabel[a.status]}</span>
                            <ApptActions appt={a} onDone={reload} onError={setActionError} />
                        </div>
                    ))
                ) : (
                    <div className="dr-empty">
                        <i className="bi bi-calendar2-check"></i>
                        <p>No appointments today.</p>
                        {data?.upcomingCount > 0 && (
                            <small>{data.upcomingCount} more upcoming appointment(s) on other days.</small>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}

export default DoctorDashboard;