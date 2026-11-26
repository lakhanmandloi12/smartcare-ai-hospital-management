import { useState } from "react";
import useFetch from "./useFetch";
import { fmtDate } from "./patientUtils";

const filters = [
    ["all", "All"],
    ["prescription", "Prescriptions"],
    ["report", "Reports"],
];

function PatientRecords() {
    const { data, loading, error, reload } = useFetch("/records/my", (r) => r.records || []);
    const [filter, setFilter] = useState("all");
    const [openId, setOpenId] = useState(null);

    const records = [...(data || [])]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .filter((r) => filter === "all" || r.type === filter);

    return (
        <>
            <div className="pt-header">
                <h2>Medical records</h2>
                <p>Your prescriptions and test reports in one place.</p>
            </div>

            <section className="pt-card">
                <div className="pt-chips" role="tablist">
                    {filters.map(([key, label]) => (
                        <button
                            key={key}
                            role="tab"
                            aria-selected={filter === key}
                            className={filter === key ? "active" : ""}
                            onClick={() => setFilter(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="pt-alert error">
                        <i className="bi bi-exclamation-circle"></i>
                        <span>{error}</span>
                        <button onClick={reload}>Retry</button>
                    </div>
                )}

                {loading ? (
                    <p className="pt-muted">Loading...</p>
                ) : records.length === 0 ? (
                    <div className="pt-empty">
                        <i className="bi bi-file-earmark-medical"></i>
                        <p>No records found.</p>
                    </div>
                ) : (
                    <ul className="pt-record-list">
                        {records.map((r) => {
                            const open = openId === r._id;
                            return (
                                <li key={r._id}>
                                    <div className="pt-record-row">
                                        <span className="pt-stat-icon">
                                            <i
                                                className={`bi ${
                                                    r.type === "prescription" ? "bi-capsule" : "bi-clipboard2-pulse"
                                                }`}
                                            ></i>
                                        </span>
                                        <div className="pt-record-info">
                                            <strong>{r.title}</strong>
                                            <small>
                                                {r.type === "prescription" ? "Prescription" : "Report"}
                                                {r.doctor?.name ? ` · Dr. ${r.doctor.name}` : ""} · {fmtDate(r.date)}
                                            </small>
                                        </div>
                                        <div className="pt-record-actions">
                                            {r.notes && (
                                                <button
                                                    className="pt-btn ghost small"
                                                    aria-expanded={open}
                                                    onClick={() => setOpenId(open ? null : r._id)}
                                                >
                                                    {open ? "Hide details" : "Details"}
                                                </button>
                                            )}
                                            {r.fileUrl && (
                                                <a
                                                    className="pt-btn small"
                                                    href={r.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <i className="bi bi-download"></i> Download
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    {open && <p className="pt-record-notes">{r.notes}</p>}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </>
    );
}

export default PatientRecords;
