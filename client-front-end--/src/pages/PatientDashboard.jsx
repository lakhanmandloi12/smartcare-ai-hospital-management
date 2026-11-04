import { Link } from "react-router-dom";
import useFetch from "./useFetch";
import { fmtDate, fmtTime, getUser, greeting, isUpcoming, statusLabel } from "./patientUtils";

function PatientDashboard() {
    const user = getUser();
    const appts = useFetch("/appointments/my", (r) => r.appointments || []);
    const recs = useFetch("/records/my", (r) => r.records || []);

    const upcoming = (appts.data || [])
        .filter(isUpcoming)
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    const next = upcoming[0];

    const records = [...(recs.data || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
    const prescriptions = records.filter((r) => r.type === "prescription").length;
    const reports = records.filter((r) => r.type === "report").length;

    const error = appts.error || recs.error;
    const loading = appts.loading || recs.loading;
    const firstName = (user.name || "there").split(" ")[0];

    return (
        <>
            <div className="pt-header">
                <h2>
                    {greeting()}, {firstName}
                </h2>
                <p>Here is a summary of your health activity.</p>
            </div>

            {error && (
                <div className="pt-alert error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                    <button
                        onClick={() => {
                            appts.reload();
                            recs.reload();
                        }}
                    >
                        Retry
                    </button>
                </div>
            )}

            <div className="pt-stats">
                <div className="pt-stat">
                    <span className="pt-stat-icon"><i className="bi bi-calendar-check"></i></span>
                    <div>
                        <strong>{loading ? "-" : upcoming.length}</strong>
                        <small>Upcoming appointments</small>
                    </div>
                </div>
                <div className="pt-stat">
                    <span className="pt-stat-icon"><i className="bi bi-capsule"></i></span>
                    <div>
                        <strong>{loading ? "-" : prescriptions}</strong>
                        <small>Prescriptions</small>
                    </div>
                </div>
                <div className="pt-stat">
                    <span className="pt-stat-icon"><i className="bi bi-clipboard2-pulse"></i></span>
                    <div>
                        <strong>{loading ? "-" : reports}</strong>
                        <small>Reports</small>
                    </div>
                </div>
            </div>

            <div className="pt-grid">
                <section className="pt-card">
                    <div className="pt-card-head">
                        <h5>Next appointment</h5>
                        <Link to="/patient/appointments">Manage</Link>
                    </div>

                    {loading ? (
                        <p className="pt-muted">Loading...</p>
                    ) : next ? (
                        <div className="pt-next">
                            <div className="pt-next-date">
                                <strong>{new Date(next.date).getDate()}</strong>
                                <span>
                                    {new Date(next.date).toLocaleDateString("en-IN", { month: "short" })}
                                </span>
                            </div>
                            <div className="pt-next-info">
                                <strong>Dr. {next.doctor?.name || "Doctor"}</strong>
                                <span>{next.doctor?.specialization || "General physician"}</span>
                                <span>
                                    <i className="bi bi-clock"></i> {fmtTime(next.time)} on {fmtDate(next.date)}
                                </span>
                                {next.reason && <span className="pt-muted">Reason: {next.reason}</span>}
                            </div>
                            <span className={`pt-status ${next.status}`}>
                                {statusLabel[next.status] || next.status}
                            </span>
                        </div>
                    ) : (
                        <div className="pt-empty">
                            <i className="bi bi-calendar-plus"></i>
                            <p>No upcoming appointments.</p>
                            <Link to="/patient/appointments" className="pt-btn">
                                Book an appointment
                            </Link>
                        </div>
                    )}
                </section>

                <section className="pt-card">
                    <div className="pt-card-head">
                        <h5>Recent records</h5>
                        <Link to="/patient/records">View all</Link>
                    </div>

                    {loading ? (
                        <p className="pt-muted">Loading...</p>
                    ) : records.length === 0 ? (
                        <div className="pt-empty">
                            <i className="bi bi-file-earmark-medical"></i>
                            <p>Your prescriptions and reports will appear here.</p>
                        </div>
                    ) : (
                        <ul className="pt-list">
                            {records.slice(0, 4).map((r) => (
                                <li key={r._id}>
                                    <span className="pt-stat-icon small">
                                        <i className={`bi ${r.type === "prescription" ? "bi-capsule" : "bi-clipboard2-pulse"}`}></i>
                                    </span>
                                    <div>
                                        <strong>{r.title}</strong>
                                        <small>
                                            {r.doctor?.name ? `Dr. ${r.doctor.name} · ` : ""}
                                            {fmtDate(r.date)}
                                        </small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>

            <section className="pt-card pt-actions">
                <h5>Quick actions</h5>
                <div>
                    <Link to="/patient/appointments" className="pt-btn">
                        <i className="bi bi-calendar-plus"></i> Book appointment
                    </Link>
                    <Link to="/patient/records" className="pt-btn ghost">
                        <i className="bi bi-file-earmark-medical"></i> Medical records
                    </Link>
                    <Link to="/patient/profile" className="pt-btn ghost">
                        <i className="bi bi-person"></i> Update profile
                    </Link>
                </div>
            </section>
        </>
    );
}

export default PatientDashboard;
