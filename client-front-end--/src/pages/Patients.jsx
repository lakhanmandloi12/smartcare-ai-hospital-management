import { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "./services/api"; // services folder src/ mein hai to "../services/api"

/* ---------- helpers ---------- */
const patientCode = (id) => `P-${String(id).slice(-5).toUpperCase()}`;
const ageFrom = (dob) => (dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : null);
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";
const fmtApptDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const errMsg = (err, fallback) => err.response?.data?.message || fallback;
const isActive = (p) => p.isActive !== false;

function genPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from(crypto.getRandomValues(new Uint32Array(10)))
        .map((n) => chars[n % chars.length])
        .join("");
}

const emptyForm = {
    name: "", email: "", phone: "", password: "",
    dob: "", gender: "", bloodGroup: "", address: "", emergencyContact: "",
};

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

/* ---------- Add / Edit form ---------- */
function PatientForm({ patient, onClose, onSaved }) {
    const editing = Boolean(patient);
    const [form, setForm] = useState(
        editing
            ? {
                name: patient.name || "",
                email: patient.email || "",
                phone: patient.phone || "",
                password: "",
                dob: patient.dob ? String(patient.dob).slice(0, 10) : "",
                gender: patient.gender || "",
                bloodGroup: patient.bloodGroup || "",
                address: patient.address || "",
                emergencyContact: patient.emergencyContact || "",
            }
            : emptyForm
    );
    const [showPw, setShowPw] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [created, setCreated] = useState(null);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    async function submit(e) {
        e.preventDefault();
        setError("");
        if (!editing && form.password.length < 6)
            return setError("Password kam se kam 6 characters ka rakho.");

        setBusy(true);
        try {
            if (editing) {
                const payload = { ...form };
                delete payload.password;
                const { data } = await api.put(`/admin/patients/${patient._id}`, payload);
                onSaved(data.patient, "Patient updated.");
                onClose();
            } else {
                const { data } = await api.post("/admin/patients", form);
                onSaved(data.patient, "Patient added.");
                setCreated({ email: data.patient.email, password: form.password });
            }
        } catch (err) {
            setError(errMsg(err, "Save nahi ho paya. Dobara try karo."));
        } finally {
            setBusy(false);
        }
    }

    // Naya patient ban gaya: login details dikhao (admin ko patient ko batani hain)
    if (created) {
        return (
            <>
                <div className="alert alert-success">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Patient account created. Share these login details with the patient.
                </div>
                <div className="border rounded p-3 mb-3">
                    <div className="mb-2"><span className="text-muted">Email: </span><strong>{created.email}</strong></div>
                    <div><span className="text-muted">Password: </span><strong>{created.password}</strong></div>
                </div>
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() =>
                            navigator.clipboard?.writeText(`Email: ${created.email}\nPassword: ${created.password}`)
                        }
                    >
                        <i className="bi bi-clipboard me-1"></i>Copy
                    </button>
                    <button className="btn btn-primary" onClick={onClose}>Done</button>
                </div>
            </>
        );
    }

    return (
        <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

            <div className="row g-3">
                <div className="col-md-6">
                    <label className="form-label" htmlFor="pf-name">Full name</label>
                    <input id="pf-name" className="form-control" name="name" value={form.name} onChange={onChange} required />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="pf-email">Email</label>
                    <input id="pf-email" type="email" className="form-control" name="email" value={form.email} onChange={onChange} required />
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="pf-phone">Phone</label>
                    <input id="pf-phone" type="tel" className="form-control" name="phone" value={form.phone} onChange={onChange} />
                </div>
                {!editing ? (
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="pf-pw">Temporary password</label>
                        <div className="input-group">
                            <input
                                id="pf-pw"
                                type={showPw ? "text" : "password"}
                                className="form-control"
                                name="password"
                                value={form.password}
                                onChange={onChange}
                                autoComplete="new-password"
                                required
                            />
                            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowPw((s) => !s)} aria-label="Show password">
                                <i className={`bi ${showPw ? "bi-eye-slash" : "bi-eye"}`}></i>
                            </button>
                            <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                    setForm((f) => ({ ...f, password: genPassword() }));
                                    setShowPw(true);
                                }}
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="pf-dob">Date of birth</label>
                        <input id="pf-dob" type="date" className="form-control" name="dob" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={onChange} />
                    </div>
                )}

                {!editing && (
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="pf-dob2">Date of birth</label>
                        <input id="pf-dob2" type="date" className="form-control" name="dob" max={new Date().toISOString().slice(0, 10)} value={form.dob} onChange={onChange} />
                    </div>
                )}
                <div className="col-md-6">
                    <label className="form-label" htmlFor="pf-gender">Gender</label>
                    <select id="pf-gender" className="form-select" name="gender" value={form.gender} onChange={onChange}>
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                    </select>
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="pf-bg">Blood group</label>
                    <select id="pf-bg" className="form-select" name="bloodGroup" value={form.bloodGroup} onChange={onChange}>
                        <option value="">Select</option>
                        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                            <option key={g} value={g}>{g}</option>
                        ))}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="pf-ec">Emergency contact</label>
                    <input id="pf-ec" type="tel" className="form-control" name="emergencyContact" value={form.emergencyContact} onChange={onChange} />
                </div>

                <div className="col-12">
                    <label className="form-label" htmlFor="pf-addr">Address</label>
                    <textarea id="pf-addr" rows="2" className="form-control" name="address" value={form.address} onChange={onChange} />
                </div>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" disabled={busy}>
                    {busy ? "Saving..." : editing ? "Save changes" : "Add patient"}
                </button>
            </div>
        </form>
    );
}

/* ---------- View details ---------- */
function PatientDetails({ id, onEdit }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/admin/patients/${id}`)
            .then((r) => setData(r.data))
            .catch((err) => setError(errMsg(err, "Details load nahi ho payi.")));
    }, [id]);

    if (error) return <div className="alert alert-danger mb-0">{error}</div>;
    if (!data) return <p className="text-muted mb-0">Loading...</p>;

    const { patient: p, appointmentsCount, recordsCount, recent } = data;
    const age = ageFrom(p.dob);

    const rows = [
        ["Patient ID", patientCode(p._id)],
        ["Email", p.email],
        ["Phone", p.phone || "-"],
        ["Age", age != null ? `${age} years` : "-"],
        ["Gender", p.gender ? p.gender[0].toUpperCase() + p.gender.slice(1) : "-"],
        ["Blood group", p.bloodGroup || "-"],
        ["Emergency contact", p.emergencyContact || "-"],
        ["Registered on", fmtDate(p.createdAt)],
    ];

    return (
        <>
            <div className="d-flex align-items-center gap-3 mb-4">
                <div className="table-avatar" style={{ width: 56, height: 56, fontSize: 22 }}>
                    {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-grow-1">
                    <h5 className="fw-bold mb-1">{p.name}</h5>
                    <span className={isActive(p) ? "status-badge active-status" : "status-badge inactive-status"}>
                        {isActive(p) ? "Active" : "Inactive"}
                    </span>
                </div>
                <button className="btn btn-outline-primary btn-sm" onClick={() => onEdit(p)}>
                    <i className="bi bi-pencil me-1"></i>Edit
                </button>
            </div>

            <div className="row g-3 mb-4">
                {rows.map(([label, value]) => (
                    <div className="col-sm-6" key={label}>
                        <div className="text-muted small">{label}</div>
                        <div className="fw-semibold" style={{ overflowWrap: "anywhere" }}>{value}</div>
                    </div>
                ))}
                <div className="col-12">
                    <div className="text-muted small">Address</div>
                    <div className="fw-semibold">{p.address || "-"}</div>
                </div>
            </div>

            <div className="row g-3 mb-4">
                <div className="col-6">
                    <div className="stat-card">
                        <div className="stat-title">Appointments</div>
                        <div className="stat-value mb-0">{appointmentsCount}</div>
                    </div>
                </div>
                <div className="col-6">
                    <div className="stat-card">
                        <div className="stat-title">Medical records</div>
                        <div className="stat-value mb-0">{recordsCount}</div>
                    </div>
                </div>
            </div>

            <h6 className="fw-bold">Recent appointments</h6>
            {recent.length === 0 ? (
                <p className="text-muted mb-0">No appointments yet.</p>
            ) : (
                <ul className="list-unstyled mb-0">
                    {recent.map((a) => (
                        <li key={a._id} className="d-flex justify-content-between py-2 border-top">
                            <span>
                                <strong>Dr. {a.doctor?.name || "Doctor"}</strong>
                                <span className="text-muted small"> · {a.doctor?.specialization}</span>
                            </span>
                            <span className="text-muted small text-nowrap">
                                {fmtApptDate(a.date)} · {a.status}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

/* ---------- Page ---------- */
function Patients() {
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(null); // { type: "add" | "edit" | "view", patient? }
    const [notice, setNotice] = useState(null);

    function load() {
        setLoading(true);
        setError("");
        api.get("/admin/patients")
            .then(({ data }) => setPatients(data.patients))
            .catch((err) => setError(errMsg(err, "Patients load nahi ho paye.")))
            .finally(() => setLoading(false));
    }

    useEffect(load, []);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const filtered = useMemo(() => {
        const s = q.trim().toLowerCase();
        if (!s) return patients;
        return patients.filter((p) =>
            `${p.name} ${p.email} ${p.phone || ""} ${patientCode(p._id)}`.toLowerCase().includes(s)
        );
    }, [patients, q]);

    function handleSaved(saved, message) {
        setPatients((list) =>
            list.some((p) => p._id === saved._id)
                ? list.map((p) => (p._id === saved._id ? saved : p))
                : [saved, ...list]
        );
        setNotice({ type: "success", text: message });
    }

    async function toggleStatus(p) {
        const next = !isActive(p);
        const ok = window.confirm(
            next
                ? `${p.name} ko dobara Active karna hai?`
                : `${p.name} ko Inactive karna hai? Wo login nahi kar payega.`
        );
        if (!ok) return;
        try {
            const { data } = await api.patch(`/admin/patients/${p._id}/status`, { isActive: next });
            handleSaved(data.patient, next ? "Patient activated." : "Patient deactivated.");
        } catch (err) {
            setNotice({ type: "danger", text: errMsg(err, "Status badal nahi paya.") });
        }
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
                                Patients
                            </h2>

                            <p className="text-muted">
                                Manage and view all registered patients.
                            </p>
                        </div>

                        <button className="btn btn-primary" onClick={() => setModal({ type: "add" })}>
                            <i className="bi bi-plus-lg me-2"></i>
                            Add Patient
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

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>
                                <h5 className="fw-bold mb-1">
                                    Patient List
                                </h5>

                                <small className="text-muted">
                                    {loading
                                        ? "Loading..."
                                        : q.trim()
                                            ? `${filtered.length} of ${patients.length} patients`
                                            : `${patients.length} registered patients`}
                                </small>
                            </div>

                            <div className="input-group search-box">

                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search name, email, phone or ID"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />

                            </div>

                        </div>


                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>

                                    <tr>
                                        <th>Patient ID</th>
                                        <th>Patient</th>
                                        <th>Age</th>
                                        <th>Gender</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {!loading && filtered.length === 0 && (
                                        <tr>
                                            <td colSpan="7" className="text-center text-muted py-5">
                                                {patients.length === 0
                                                    ? "No patients yet. Click Add Patient to create one."
                                                    : "No patient matches your search."}
                                            </td>
                                        </tr>
                                    )}

                                    {filtered.map((patient) => {
                                        const age = ageFrom(patient.dob);
                                        const active = isActive(patient);
                                        return (

                                            <tr key={patient._id}>

                                                <td>
                                                    <strong>{patientCode(patient._id)}</strong>
                                                </td>

                                                <td>
                                                    <div className="d-flex align-items-center gap-3">

                                                        <div className="table-avatar">
                                                            {patient.name.charAt(0).toUpperCase()}
                                                        </div>

                                                        <strong>
                                                            {patient.name}
                                                        </strong>

                                                    </div>
                                                </td>

                                                <td>{age != null ? age : "-"}</td>

                                                <td className="text-capitalize">{patient.gender || "-"}</td>

                                                <td>{patient.phone || "-"}</td>

                                                <td>
                                                    <span
                                                        className={
                                                            active
                                                                ? "status-badge active-status"
                                                                : "status-badge inactive-status"
                                                        }
                                                    >
                                                        {active ? "Active" : "Inactive"}
                                                    </span>
                                                </td>

                                                <td className="text-nowrap">

                                                    <button
                                                        className="btn btn-sm btn-light"
                                                        title="View"
                                                        aria-label={`View ${patient.name}`}
                                                        onClick={() => setModal({ type: "view", patient })}
                                                    >
                                                        <i className="bi bi-eye"></i>
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-light ms-2"
                                                        title="Edit"
                                                        aria-label={`Edit ${patient.name}`}
                                                        onClick={() => setModal({ type: "edit", patient })}
                                                    >
                                                        <i className="bi bi-pencil"></i>
                                                    </button>

                                                    <button
                                                        className="btn btn-sm btn-light ms-2"
                                                        title={active ? "Deactivate" : "Activate"}
                                                        aria-label={active ? `Deactivate ${patient.name}` : `Activate ${patient.name}`}
                                                        onClick={() => toggleStatus(patient)}
                                                    >
                                                        <i className={`bi ${active ? "bi-person-slash" : "bi-person-check"}`}></i>
                                                    </button>

                                                </td>

                                            </tr>

                                        );
                                    })}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </main>

            </div>

            {modal?.type === "add" && (
                <Modal title="Add patient" onClose={closeModal}>
                    <PatientForm onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

            {modal?.type === "edit" && (
                <Modal title="Edit patient" onClose={closeModal}>
                    <PatientForm patient={modal.patient} onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

            {modal?.type === "view" && (
                <Modal title="Patient details" onClose={closeModal}>
                    <PatientDetails
                        id={modal.patient._id}
                        onEdit={(p) => setModal({ type: "edit", patient: p })}
                    />
                </Modal>
            )}

        </div>
    );
}

export default Patients;