import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import api from "../pages/services/api";
import useApi from "./useApi";
import { fmtDate } from "./doctorUtils";

const emptyMed = { name: "", dosage: "", duration: "" };

function DoctorRecords() {
    const location = useLocation();
    const patients = useApi("/doctors/me/patients", (r) => r.patients || []);
    const records = useApi("/records/my", (r) => r.records || []);

    const [patientId, setPatientId] = useState(location.state?.patientId || "");
    const [type, setType] = useState("prescription");
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [meds, setMeds] = useState([{ ...emptyMed }]);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    function setMed(i, field, value) {
        setMeds((list) => list.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));
    }

    async function submit(e) {
        e.preventDefault();
        const medicines = meds.filter((m) => m.name.trim());
        if (type === "prescription" && medicines.length === 0)
            return setNotice({ type: "error", text: "Prescription mein kam se kam ek dawai likho." });

        setBusy(true);
        try {
            await api.post("/records", {
                patientId,
                type,
                title: title.trim(),
                description: description.trim(),
                medicines: type === "prescription" ? medicines : [],
            });
            setNotice({ type: "success", text: "Record saved." });
            setTitle("");
            setDescription("");
            setMeds([{ ...emptyMed }]);
            records.reload();
        } catch (err) {
            setNotice({ type: "error", text: err.response?.data?.message || "Record save nahi ho paya." });
        } finally {
            setBusy(false);
        }
    }

    const list = records.data || [];
    const noPatients = !patients.loading && (patients.data || []).length === 0;

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 className="fw-bold mb-1">Prescriptions and records</h2>
                    <p className="text-muted mb-0">Write a prescription or report for your patients.</p>
                </div>
            </div>

            {notice && (
                <div className={`dr-alert ${notice.type}`} role="status">
                    <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle"}`}></i>
                    <span>{notice.text}</span>
                </div>
            )}

            <div className="dr-grid">
                <form className="dashboard-card" onSubmit={submit}>
                    <h5 className="fw-bold mb-3">New record</h5>

                    <label className="form-label" htmlFor="rp">Patient</label>
                    <select
                        id="rp"
                        className="form-select mb-3"
                        value={patientId}
                        onChange={(e) => setPatientId(e.target.value)}
                        required
                    >
                        <option value="" disabled>
                            {noPatients ? "No patients yet" : "Select patient"}
                        </option>
                        {(patients.data || []).map((p) => (
                            <option key={p._id} value={p._id}>
                                {p.name}
                            </option>
                        ))}
                    </select>

                    <div className="row g-3 mb-3">
                        <div className="col-sm-5">
                            <label className="form-label" htmlFor="rt">Type</label>
                            <select id="rt" className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                                <option value="prescription">Prescription</option>
                                <option value="report">Report</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div className="col-sm-7">
                            <label className="form-label" htmlFor="rtitle">Title</label>
                            <input
                                id="rtitle"
                                className="form-control"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder={type === "prescription" ? "e.g. Fever and cold" : "e.g. Blood test report"}
                                required
                            />
                        </div>
                    </div>

                    {type === "prescription" && (
                        <div className="mb-3">
                            <label className="form-label">Medicines</label>
                            {meds.map((m, i) => (
                                <div className="dr-med-row" key={i}>
                                    <input
                                        className="form-control"
                                        placeholder="Medicine name"
                                        value={m.name}
                                        onChange={(e) => setMed(i, "name", e.target.value)}
                                    />
                                    <input
                                        className="form-control"
                                        placeholder="Dose (1-0-1)"
                                        value={m.dosage}
                                        onChange={(e) => setMed(i, "dosage", e.target.value)}
                                    />
                                    <input
                                        className="form-control"
                                        placeholder="Days"
                                        value={m.duration}
                                        onChange={(e) => setMed(i, "duration", e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        disabled={meds.length === 1}
                                        onClick={() => setMeds((l) => l.filter((_, idx) => idx !== i))}
                                        aria-label="Remove medicine"
                                    >
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            ))}
                            <button
                                type="button"
                                className="btn btn-link p-0"
                                onClick={() => setMeds((l) => [...l, { ...emptyMed }])}
                            >
                                <i className="bi bi-plus-circle me-1"></i>Add medicine
                            </button>
                        </div>
                    )}

                    <label className="form-label" htmlFor="rd">Notes</label>
                    <textarea
                        id="rd"
                        rows="3"
                        className="form-control mb-3"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Diagnosis, advice, follow-up..."
                    />

                    <button className="btn btn-primary" disabled={busy || noPatients}>
                        {busy ? "Saving..." : "Save record"}
                    </button>
                </form>

                <section className="dashboard-card">
                    <h5 className="fw-bold mb-3">Recently written</h5>

                    {records.error && <p className="text-danger small">{records.error}</p>}

                    {records.loading ? (
                        <p className="text-muted mb-0">Loading...</p>
                    ) : list.length === 0 ? (
                        <div className="dr-empty">
                            <i className="bi bi-file-earmark-medical"></i>
                            <p>Nothing written yet.</p>
                        </div>
                    ) : (
                        <ul className="dr-records">
                            {list.slice(0, 12).map((r) => (
                                <li key={r._id}>
                                    <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div>
                                            <strong>{r.title}</strong>
                                            <div className="text-muted small">
                                                {r.patient?.name || "Patient"} · {fmtDate(r.date)}
                                            </div>
                                        </div>
                                        <span className={`dr-badge ${r.type}`}>{r.type}</span>
                                    </div>
                                    {r.medicines?.length > 0 && (
                                        <ul className="dr-meds">
                                            {r.medicines.map((m, i) => (
                                                <li key={i}>
                                                    {m.name}
                                                    {m.dosage ? ` · ${m.dosage}` : ""}
                                                    {m.duration ? ` · ${m.duration}` : ""}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </>
    );
}

export default DoctorRecords;