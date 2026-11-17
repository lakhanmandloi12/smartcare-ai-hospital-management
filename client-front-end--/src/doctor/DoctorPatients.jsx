import { useState } from "react";
import { Link } from "react-router-dom";
import useApi from "./useApi";
import { ageFrom, fmtApptDate, initials } from "./doctorUtils";

function DoctorPatients() {
    const { data, loading, error, reload } = useApi("/doctors/me/patients", (r) => r.patients || []);
    const [q, setQ] = useState("");

    const shown = (data || []).filter((p) =>
        `${p.name} ${p.email} ${p.phone || ""}`.toLowerCase().includes(q.trim().toLowerCase())
    );

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 className="fw-bold mb-1">My patients</h2>
                    <p className="text-muted mb-0">Patients who have booked with you.</p>
                </div>
                <div className="input-group search-box">
                    <span className="input-group-text">
                        <i className="bi bi-search"></i>
                    </span>
                    <input
                        className="form-control"
                        placeholder="Search name, email or phone"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
            </div>

            {error && (
                <div className="dr-alert error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={reload}>Retry</button>
                </div>
            )}

            <div className="dashboard-card">
                {loading ? (
                    <p className="text-muted mb-0">Loading...</p>
                ) : shown.length === 0 ? (
                    <div className="dr-empty">
                        <i className="bi bi-people"></i>
                        <p>{data?.length ? "No patient matches your search." : "No patients yet. They appear after someone books with you."}</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Age / Gender</th>
                                    <th>Blood group</th>
                                    <th>Visits</th>
                                    <th>Last visit</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((p) => {
                                    const age = ageFrom(p.dob);
                                    return (
                                        <tr key={p._id}>
                                            <td>
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="table-avatar">{initials(p.name)}</div>
                                                    <div>
                                                        <div className="fw-semibold">{p.name}</div>
                                                        <div className="text-muted small">{p.phone || p.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-capitalize">
                                                {[age != null ? `${age} yrs` : null, p.gender].filter(Boolean).join(" / ") || "-"}
                                            </td>
                                            <td>{p.bloodGroup || "-"}</td>
                                            <td>{p.visits}</td>
                                            <td className="text-nowrap">{fmtApptDate(p.lastVisit)}</td>
                                            <td className="text-end">
                                                <Link
                                                    to="/doctor/records"
                                                    state={{ patientId: p._id }}
                                                    className="btn btn-outline-primary btn-sm"
                                                >
                                                    <i className="bi bi-file-earmark-plus me-1"></i>Write prescription
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default DoctorPatients;