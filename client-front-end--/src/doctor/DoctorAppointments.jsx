import { useState } from "react";
import useApi from "./useApi";
import ApptActions from "./ApptActions";
import { fmtApptDate, fmtTime, statusLabel } from "./doctorUtils";

const TABS = ["all", "pending", "confirmed", "completed", "cancelled"];

function DoctorAppointments() {
    const { data, loading, error, reload } = useApi("/appointments/my", (r) => r.appointments || []);
    const [tab, setTab] = useState("all");
    const [q, setQ] = useState("");
    const [actionError, setActionError] = useState("");

    const list = data || [];
    const counts = Object.fromEntries(
        TABS.map((t) => [t, t === "all" ? list.length : list.filter((a) => a.status === t).length])
    );

    const todayStr = new Date().toLocaleDateString("en-CA");
    const key = (a) => `${a.date.slice(0, 10)} ${a.time}`;

    // Aane wali pehle (nazdeek se door), phir purani (nayi se purani)
    const shown = list
        .filter(
            (a) =>
                (tab === "all" || a.status === tab) &&
                (a.patient?.name || "").toLowerCase().includes(q.trim().toLowerCase())
        )
        .sort((a, b) => {
            const au = a.date.slice(0, 10) >= todayStr;
            const bu = b.date.slice(0, 10) >= todayStr;
            if (au !== bu) return au ? -1 : 1;
            return au ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a));
        });

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 className="fw-bold mb-1">Appointments</h2>
                    <p className="text-muted mb-0">Confirm, complete or cancel your patients' appointments.</p>
                </div>
                <div className="input-group search-box">
                    <span className="input-group-text">
                        <i className="bi bi-search"></i>
                    </span>
                    <input
                        className="form-control"
                        placeholder="Search patient"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                    />
                </div>
            </div>

            {(error || actionError) && (
                <div className="dr-alert error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error || actionError}</span>
                    <button onClick={reload}>Retry</button>
                </div>
            )}

            <div className="dr-tabs" role="tablist">
                {TABS.map((t) => (
                    <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
                        {t === "all" ? "All" : statusLabel[t]} <span>{counts[t]}</span>
                    </button>
                ))}
            </div>

            <div className="dashboard-card">
                {loading ? (
                    <p className="text-muted mb-0">Loading...</p>
                ) : shown.length === 0 ? (
                    <div className="dr-empty">
                        <i className="bi bi-calendar-x"></i>
                        <p>No appointments found.</p>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle">
                            <thead>
                                <tr>
                                    <th>Patient</th>
                                    <th>Date and time</th>
                                    <th>Reason</th>
                                    <th>Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shown.map((a) => (
                                    <tr key={a._id}>
                                        <td>
                                            <div className="fw-semibold">{a.patient?.name || "Patient"}</div>
                                            <div className="text-muted small">
                                                {a.patient?.phone || a.patient?.email}
                                            </div>
                                        </td>
                                        <td className="text-nowrap">
                                            {fmtApptDate(a.date)}
                                            <div className="text-muted small">{fmtTime(a.time)}</div>
                                        </td>
                                        <td style={{ maxWidth: 240 }}>{a.reason || "-"}</td>
                                        <td>
                                            <span className={`dr-badge ${a.status}`}>{statusLabel[a.status]}</span>
                                        </td>
                                        <td>
                                            <ApptActions appt={a} onDone={reload} onError={setActionError} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

export default DoctorAppointments;