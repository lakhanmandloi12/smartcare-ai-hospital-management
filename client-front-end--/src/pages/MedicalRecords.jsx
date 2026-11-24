import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "./services/api"; // services folder src/ mein hai to "../services/api"

/* ---------- helpers ---------- */
const recordCode = (id) => `MR-${String(id).slice(-5).toUpperCase()}`;
const withDr = (name = "Doctor") => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);
const errMsg = (err, fallback) => err.response?.data?.message || fallback;
const todayStr = () => new Date().toLocaleDateString("en-CA");
const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
const diagnosisOf = (r) => r.diagnosis || r.title || "-";
const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const TYPES = [
    ["all", "All records"],
    ["prescription", "Prescriptions"],
    ["report", "Reports"],
    ["other", "Other"],
];

const emptyMed = { name: "", dosage: "", duration: "" };

/* ---------- Modal wrapper ---------- */
function Modal({ title, onClose, children }) {
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "";
        };
    }, [onClose]);

    return (
        <div
            className="modal d-block"
            role="dialog"
            aria-modal="true"
            style={{ background: "rgba(0,0,0,0.5)" }}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-lg">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title fw-bold">{title}</h5>
                        <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">{children}</div>
                </div>
            </div>
        </div>
    );
}

/* ---------- Add record ---------- */
function AddRecordForm({ onClose, onSaved }) {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [form, setForm] = useState({
        patientId: "", doctorId: "", type: "report", diagnosis: "", date: todayStr(), description: "",
    });
    const [meds, setMeds] = useState([{ ...emptyMed }]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api.get("/admin/patients"), api.get("/admin/doctors")])
            .then(([p, d]) => {
                setPatients(p.data.patients);
                setDoctors(d.data.doctors);
            })
            .catch((err) => setError(errMsg(err, "Patients aur doctors load nahi ho paye.")))
            .finally(() => setLoadingLists(false));
    }, []);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const setMed = (i, field, value) =>
        setMeds((list) => list.map((m, idx) => (idx === i ? { ...m, [field]: value } : m)));

    async function submit(e) {
        e.preventDefault();
        setError("");

        const medicines = meds.filter((m) => m.name.trim());
        if (form.type === "prescription" && medicines.length === 0)
            return setError("Prescription mein kam se kam ek dawai likho.");

        setBusy(true);
        try {
            const { data } = await api.post("/records/admin", {
                ...form,
                medicines: form.type === "prescription" ? medicines : [],
            });
            onSaved(data.record, "Record added.");
            onClose();
        } catch (err) {
            setError(errMsg(err, "Record save nahi ho paya."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label" htmlFor="ar-patient">Patient</label>
                    <select id="ar-patient" className="form-select" name="patientId" value={form.patientId} onChange={onChange} required disabled={loadingLists}>
                        <option value="" disabled>{loadingLists ? "Loading..." : patients.length ? "Select patient" : "No patients"}</option>
                        {patients.map((p) => (
                            <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="ar-doctor">Doctor</label>
                    <select id="ar-doctor" className="form-select" name="doctorId" value={form.doctorId} onChange={onChange} required disabled={loadingLists}>
                        <option value="" disabled>{loadingLists ? "Loading..." : doctors.length ? "Select doctor" : "No approved doctors"}</option>
                        {doctors.map((d) => (
                            <option key={d._id} value={d._id}>{withDr(d.name)}{d.specialization ? ` - ${d.specialization}` : ""}</option>
                        ))}
                    </select>
                </div>

                <div className="col-md-4">
                    <label className="form-label" htmlFor="ar-type">Type</label>
                    <select id="ar-type" className="form-select" name="type" value={form.type} onChange={onChange}>
                        <option value="report">Report</option>
                        <option value="prescription">Prescription</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="col-md-5">
                    <label className="form-label" htmlFor="ar-diag">Diagnosis</label>
                    <input id="ar-diag" className="form-control" name="diagnosis" value={form.diagnosis} onChange={onChange}
                        placeholder="e.g. Hypertension" maxLength={150} required />
                </div>

                <div className="col-md-3">
                    <label className="form-label" htmlFor="ar-date">Date</label>
                    <input id="ar-date" type="date" className="form-control" name="date" max={todayStr()} value={form.date} onChange={onChange} required />
                </div>

                {form.type === "prescription" && (
                    <div className="col-12">
                        <label className="form-label">Medicines</label>
                        {meds.map((m, i) => (
                            <div className="row g-2 mb-2" key={i}>
                                <div className="col-sm-5">
                                    <input className="form-control" placeholder="Medicine name" value={m.name} onChange={(e) => setMed(i, "name", e.target.value)} />
                                </div>
                                <div className="col-sm-3">
                                    <input className="form-control" placeholder="Dose (1-0-1)" value={m.dosage} onChange={(e) => setMed(i, "dosage", e.target.value)} />
                                </div>
                                <div className="col-sm-3">
                                    <input className="form-control" placeholder="Duration" value={m.duration} onChange={(e) => setMed(i, "duration", e.target.value)} />
                                </div>
                                <div className="col-sm-1">
                                    <button type="button" className="btn btn-outline-secondary w-100" disabled={meds.length === 1}
                                        onClick={() => setMeds((l) => l.filter((_, idx) => idx !== i))} aria-label="Remove medicine">
                                        <i className="bi bi-x-lg"></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn btn-link p-0" onClick={() => setMeds((l) => [...l, { ...emptyMed }])}>
                            <i className="bi bi-plus-circle me-1"></i>Add medicine
                        </button>
                    </div>
                )}

                <div className="col-12">
                    <label className="form-label" htmlFor="ar-notes">Notes</label>
                    <textarea id="ar-notes" rows="3" className="form-control" name="description" maxLength={2000}
                        value={form.description} onChange={onChange} placeholder="Findings, advice, follow-up..." />
                </div>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" disabled={busy || loadingLists}>
                    {busy ? "Saving..." : "Save record"}
                </button>
            </div>
        </form>
    );
}

/* ---------- View record ---------- */
function RecordDetails({ record: r }) {
    const rows = [
        ["Record ID", recordCode(r._id)],
        ["Type", cap(r.type)],
        ["Date", fmtDate(r.date)],
        ["Patient", r.patient?.name || "-"],
        ["Patient contact", r.patient?.phone || r.patient?.email || "-"],
        ["Doctor", r.doctor ? withDr(r.doctor.name) : "-"],
        ["Specialization", r.doctor?.specialization || "-"],
    ];

    return (
        <>
            <div className="mb-4">
                <div className="text-muted small">Diagnosis</div>
                <span className="diagnosis-badge">{diagnosisOf(r)}</span>
            </div>

            <div className="row g-3 mb-4">
                {rows.map(([label, value]) => (
                    <div className="col-sm-6" key={label}>
                        <div className="text-muted small">{label}</div>
                        <div className="fw-semibold" style={{ overflowWrap: "anywhere" }}>{value}</div>
                    </div>
                ))}
            </div>

            {r.medicines?.length > 0 && (
                <div className="mb-4">
                    <h6 className="fw-bold">Medicines</h6>
                    <div className="table-responsive">
                        <table className="table table-sm align-middle mb-0">
                            <thead>
                                <tr><th>Medicine</th><th>Dose</th><th>Duration</th></tr>
                            </thead>
                            <tbody>
                                {r.medicines.map((m, i) => (
                                    <tr key={i}>
                                        <td>{m.name}</td>
                                        <td>{m.dosage || "-"}</td>
                                        <td>{m.duration || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div>
                <h6 className="fw-bold">Notes</h6>
                <p className="mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {r.description || <span className="text-muted">No notes added.</span>}
                </p>
            </div>
        </>
    );
}

/* ---------- Page ---------- */
function MedicalRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [type, setType] = useState("all");
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(null); // { type: "add" } | { type: "view", record }
    const [notice, setNotice] = useState(null);

    function load() {
        setLoading(true);
        setError("");
        api.get("/records/all")
            .then(({ data }) => setRecords(data.records))
            .catch((err) => setError(errMsg(err, "Records load nahi ho paye.")))
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const shown = useMemo(() => {
        const s = q.trim().toLowerCase();
        return records
            .filter((r) => type === "all" || r.type === type)
            .filter(
                (r) =>
                    !s ||
                    `${r.patient?.name || ""} ${r.doctor?.name || ""} ${diagnosisOf(r)} ${recordCode(r._id)}`
                        .toLowerCase()
                        .includes(s)
            );
    }, [records, type, q]);

    function handleSaved(saved, message) {
        setRecords((list) => [saved, ...list]);
        setNotice({ type: "success", text: message });
    }

    const closeModal = () => setModal(null);

    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Topbar />

                <main className="dashboard-content">

                    <div className="page-header">

                        <div>
                            <h2 className="fw-bold mb-1">
                                Medical Records
                            </h2>

                            <p className="text-muted">
                                Patient medical history and clinical records.
                            </p>
                        </div>

                        <button className="btn btn-primary" onClick={() => setModal({ type: "add" })}>
                            <i className="bi bi-plus-lg me-2"></i>
                            Add Record
                        </button>

                    </div>

                    {notice && (
                        <div className={`alert alert-${notice.type}`} role="status">
                            {notice.text}
                        </div>
                    )}

                    {error && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                            <span>{error}</span>
                            <button className="btn btn-sm btn-outline-danger" onClick={load}>Retry</button>
                        </div>
                    )}


                    <div className="dashboard-card">

                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">

                            <small className="text-muted">
                                {loading ? "Loading..." : `${shown.length} of ${records.length} records`}
                            </small>

                            <div className="d-flex gap-2 flex-wrap">

                                <div className="input-group search-box">
                                    <span className="input-group-text">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search patient, doctor or diagnosis"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="form-select appointment-filter"
                                    value={type}
                                    onChange={(e) => setType(e.target.value)}
                                    aria-label="Filter records"
                                >
                                    {TYPES.map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>

                            </div>

                        </div>

                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>Record ID</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Diagnosis</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {!loading && shown.length === 0 && (
                                        <tr>
                                            <td colSpan="6" className="text-center text-muted py-5">
                                                {records.length === 0
                                                    ? "No records yet. Click Add Record to create one."
                                                    : "No records match your search."}
                                            </td>
                                        </tr>
                                    )}

                                    {shown.map((record) => (

                                        <tr key={record._id}>

                                            <td>
                                                <strong>{recordCode(record._id)}</strong>
                                            </td>

                                            <td>{record.patient?.name || "-"}</td>

                                            <td>{record.doctor ? withDr(record.doctor.name) : "-"}</td>

                                            <td>
                                                <span className="diagnosis-badge">
                                                    {diagnosisOf(record)}
                                                </span>
                                                <div className="text-muted small mt-1 text-capitalize">{record.type}</div>
                                            </td>

                                            <td className="text-nowrap">{fmtDate(record.date)}</td>

                                            <td>

                                                <button
                                                    className="btn btn-sm btn-outline-primary"
                                                    onClick={() => setModal({ type: "view", record })}
                                                >
                                                    <i className="bi bi-eye me-1"></i>
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </main>

            </div>

            {modal?.type === "add" && (
                <Modal title="Add medical record" onClose={closeModal}>
                    <AddRecordForm onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

            {modal?.type === "view" && (
                <Modal title="Medical record" onClose={closeModal}>
                    <RecordDetails record={modal.record} />
                </Modal>
            )}

        </div>
    );
}

export default MedicalRecords;