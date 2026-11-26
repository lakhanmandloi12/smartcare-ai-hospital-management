import { useEffect, useMemo, useState } from "react";
import PendingDoctors from "../components/PendingDoctors";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "./services/api"; // services folder src/ mein hai to "../services/api"

/* ---------- helpers ---------- */
const errMsg = (err, fallback) => err.response?.data?.message || fallback;
const withDr = (name = "Doctor") => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);
const initials = (name = "") =>
    name.replace(/^dr\.?\s+/i, "").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();
const fmtDate = (d) =>
    d ? new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "-";
const fmtApptDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });
function fmtTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

const SPECIALIZATIONS = [
    "General Medicine", "Cardiology", "Dermatology", "Neurology", "Orthopedics",
    "Pediatrics", "Gynecology", "ENT", "Psychiatry", "Radiology", "Dentistry", "Other",
];

const BUSY_AT = 6; // aaj itni ya zyada appointments ho to "Busy"

function statusOf(d) {
    if (d.isActive === false) return { label: "Inactive", cls: "status-badge inactive-status" };
    if ((d.todayCount || 0) >= BUSY_AT) return { label: "Busy", cls: "status-badge pending-status" };
    return { label: "Available", cls: "status-badge active-status" };
}

function genPassword() {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from(crypto.getRandomValues(new Uint32Array(10)))
        .map((n) => chars[n % chars.length])
        .join("");
}

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
function DoctorForm({ doctor, onClose, onSaved }) {
    const editing = Boolean(doctor);
    const [form, setForm] = useState({
        name: doctor?.name || "",
        email: doctor?.email || "",
        phone: doctor?.phone || "",
        password: "",
        specialization: doctor?.specialization || "",
        licenseNumber: doctor?.licenseNumber || "",
        experience: doctor?.experience ?? "",
        consultationFee: doctor?.consultationFee ?? "",
        bio: doctor?.bio || "",
    });
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
                const { data } = await api.put(`/admin/doctors/${doctor._id}`, payload);
                onSaved(data.doctor, "Doctor updated.");
                onClose();
            } else {
                const { data } = await api.post("/admin/doctors", form);
                onSaved(data.doctor, "Doctor added.");
                setCreated({ email: data.doctor.email, password: form.password });
            }
        } catch (err) {
            setError(errMsg(err, "Save nahi ho paya. Dobara try karo."));
        } finally {
            setBusy(false);
        }
    }

    if (created) {
        return (
            <>
                <div className="alert alert-success">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    Doctor account created. Share these login details with the doctor.
                </div>
                <div className="border rounded p-3 mb-3">
                    <div className="mb-2"><span className="text-muted">Email: </span><strong>{created.email}</strong></div>
                    <div><span className="text-muted">Password: </span><strong>{created.password}</strong></div>
                </div>
                <div className="d-flex gap-2 justify-content-end">
                    <button
                        className="btn btn-outline-secondary"
                        onClick={() => navigator.clipboard?.writeText(`Email: ${created.email}\nPassword: ${created.password}`)}
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
                    <label className="form-label" htmlFor="df-name">Full name</label>
                    <input id="df-name" className="form-control" name="name" value={form.name} onChange={onChange} placeholder="Dr. Anita Verma" required />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="df-email">Email</label>
                    <input id="df-email" type="email" className="form-control" name="email" value={form.email} onChange={onChange} required />
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="df-phone">Phone</label>
                    <input id="df-phone" type="tel" className="form-control" name="phone" value={form.phone} onChange={onChange} />
                </div>
                {!editing && (
                    <div className="col-md-6">
                        <label className="form-label" htmlFor="df-pw">Temporary password</label>
                        <div className="input-group">
                            <input
                                id="df-pw"
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
                )}

                <div className="col-md-6">
                    <label className="form-label" htmlFor="df-spec">Specialization</label>
                    <select id="df-spec" className="form-select" name="specialization" value={form.specialization} onChange={onChange} required>
                        <option value="" disabled>Select specialization</option>
                        {SPECIALIZATIONS.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                        {/* purani specialization jo list mein nahi hai, wo bhi dikhe */}
                        {form.specialization && !SPECIALIZATIONS.includes(form.specialization) && (
                            <option value={form.specialization}>{form.specialization}</option>
                        )}
                    </select>
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="df-lic">License number</label>
                    <input id="df-lic" className="form-control" name="licenseNumber" value={form.licenseNumber} onChange={onChange} placeholder="MCI-123456" required />
                </div>

                <div className="col-md-6">
                    <label className="form-label" htmlFor="df-exp">Experience (years)</label>
                    <input id="df-exp" type="number" min="0" max="60" className="form-control" name="experience" value={form.experience} onChange={onChange} />
                </div>
                <div className="col-md-6">
                    <label className="form-label" htmlFor="df-fee">Consultation fee (INR)</label>
                    <input id="df-fee" type="number" min="0" className="form-control" name="consultationFee" value={form.consultationFee} onChange={onChange} />
                </div>

                <div className="col-12">
                    <label className="form-label" htmlFor="df-bio">About</label>
                    <textarea id="df-bio" rows="2" className="form-control" name="bio" maxLength={500} value={form.bio} onChange={onChange} />
                </div>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" disabled={busy}>
                    {busy ? "Saving..." : editing ? "Save changes" : "Add doctor"}
                </button>
            </div>
        </form>
    );
}

/* ---------- View profile ---------- */
function DoctorDetails({ id, onEdit, onToggle }) {
    const [data, setData] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        api.get(`/admin/doctors/${id}`)
            .then((r) => setData(r.data))
            .catch((err) => setError(errMsg(err, "Details load nahi ho payi.")));
    }, [id]);

    if (error) return <div className="alert alert-danger mb-0">{error}</div>;
    if (!data) return <p className="text-muted mb-0">Loading...</p>;

    const { doctor: d, patientsCount, appointmentsCount, recordsCount, upcoming } = data;
    const active = d.isActive !== false;

    const rows = [
        ["Email", d.email],
        ["Phone", d.phone || "-"],
        ["Specialization", d.specialization || "-"],
        ["License number", d.licenseNumber || "-"],
        ["Experience", d.experience != null ? `${d.experience} years` : "-"],
        ["Consultation fee", d.consultationFee != null ? `₹${d.consultationFee}` : "Not set"],
        ["Joined", fmtDate(d.createdAt)],
    ];

    return (
        <>
            <div className="d-flex align-items-center gap-3 mb-4 flex-wrap">
                <div className="large-avatar">{initials(d.name)}</div>
                <div className="flex-grow-1">
                    <h5 className="fw-bold mb-1">{withDr(d.name)}</h5>
                    <span className={active ? "status-badge active-status" : "status-badge inactive-status"}>
                        {active ? "Active" : "Inactive"}
                    </span>
                </div>
                <div className="d-flex gap-2">
                    <button className="btn btn-outline-primary btn-sm" onClick={() => onEdit(d)}>
                        <i className="bi bi-pencil me-1"></i>Edit
                    </button>
                    <button className={`btn btn-sm ${active ? "btn-outline-danger" : "btn-outline-success"}`} onClick={() => onToggle(d)}>
                        <i className={`bi ${active ? "bi-person-slash" : "bi-person-check"} me-1`}></i>
                        {active ? "Deactivate" : "Activate"}
                    </button>
                </div>
            </div>

            <div className="row g-3 mb-4">
                {rows.map(([label, value]) => (
                    <div className="col-sm-6" key={label}>
                        <div className="text-muted small">{label}</div>
                        <div className="fw-semibold" style={{ overflowWrap: "anywhere" }}>{value}</div>
                    </div>
                ))}
                {d.bio && (
                    <div className="col-12">
                        <div className="text-muted small">About</div>
                        <div>{d.bio}</div>
                    </div>
                )}
            </div>

            <div className="row g-3 mb-4">
                {[
                    ["Patients", patientsCount],
                    ["Appointments", appointmentsCount],
                    ["Records written", recordsCount],
                ].map(([label, value]) => (
                    <div className="col-4" key={label}>
                        <div className="stat-card">
                            <div className="stat-title">{label}</div>
                            <div className="stat-value mb-0">{value}</div>
                        </div>
                    </div>
                ))}
            </div>

            <h6 className="fw-bold">Upcoming appointments</h6>
            {upcoming.length === 0 ? (
                <p className="text-muted mb-0">No upcoming appointments.</p>
            ) : (
                <ul className="list-unstyled mb-0">
                    {upcoming.map((a) => (
                        <li key={a._id} className="d-flex justify-content-between py-2 border-top">
                            <strong>{a.patient?.name || "Patient"}</strong>
                            <span className="text-muted small text-nowrap">
                                {fmtApptDate(a.date)} · {fmtTime(a.time)} · {a.status}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </>
    );
}

/* ---------- Page ---------- */
function Doctors() {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(null); // { type: "add" | "edit" | "view", doctor? }
    const [notice, setNotice] = useState(null);
    const [pendingKey, setPendingKey] = useState(0);

    function load() {
        setLoading(true);
        setError("");
        api.get("/admin/doctors")
            .then(({ data }) => setDoctors(data.doctors))
            .catch((err) => setError(errMsg(err, "Doctors load nahi ho paye.")))
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
        if (!s) return doctors;
        return doctors.filter((d) =>
            `${d.name} ${d.specialization || ""} ${d.email}`.toLowerCase().includes(s)
        );
    }, [doctors, q]);

    // Add/Edit ke baad list tazi karo (patients ka count bhi sahi rahe)
    function handleSaved(_saved, message) {
        load();
        setNotice({ type: "success", text: message });
    }

    async function toggleStatus(d) {
        const next = d.isActive === false;
        const ok = window.confirm(
            next
                ? `${withDr(d.name)} ko dobara Active karna hai?`
                : `${withDr(d.name)} ko Inactive karna hai? Wo login nahi kar payega aur booking mein nahi dikhega.`
        );
        if (!ok) return;
        try {
            await api.patch(`/admin/doctors/${d._id}/status`, { isActive: next });
            setModal(null);
            load();
            setNotice({ type: "success", text: next ? "Doctor activated." : "Doctor deactivated." });
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
                                Doctors
                            </h2>
                            <p className="text-muted mb-0">
                                Manage hospital doctors and departments.
                            </p>
                        </div>

                        <div className="d-flex gap-2 flex-wrap">

                            <div className="input-group search-box">
                                <span className="input-group-text">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search name or department"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </div>

                            <button className="btn btn-primary" onClick={() => setModal({ type: "add" })}>
                                <i className="bi bi-plus-lg me-2"></i>
                                Add Doctor
                            </button>

                        </div>

                    </div>

                    {notice && (
                        <div className={`alert alert-${notice.type}`} role="status">
                            {notice.text}
                        </div>
                    )}

                    {/* Approve hote hi neeche list mein doctor aa jaye (key badalne se box dobara load hota hai) */}
                    <PendingDoctors key={pendingKey} onChange={load} />

                    {error && (
                        <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
                            <span>{error}</span>
                            <button className="btn btn-sm btn-outline-danger" onClick={load}>Retry</button>
                        </div>
                    )}

                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <h5 className="fw-bold mb-0">All doctors</h5>
                        <small className="text-muted">
                            {loading
                                ? "Loading..."
                                : q.trim()
                                    ? `${shown.length} of ${doctors.length} doctors`
                                    : `${doctors.length} approved doctors`}
                        </small>
                    </div>

                    {!loading && shown.length === 0 && (
                        <div className="dashboard-card text-center text-muted py-5">
                            <i className="bi bi-person-badge fs-1 d-block mb-2"></i>
                            {doctors.length === 0
                                ? "No approved doctors yet. Approve a pending request or click Add Doctor."
                                : "No doctor matches your search."}
                        </div>
                    )}

                    <div className="row g-4">

                        {shown.map((doctor) => {
                            const status = statusOf(doctor);
                            return (

                                <div
                                    className="col-xl-3 col-lg-4 col-md-6"
                                    key={doctor._id}
                                >

                                    <div className="doctor-card" style={doctor.isActive === false ? { opacity: 0.75 } : undefined}>

                                        <div className="doctor-card-top">

                                            <div className="large-avatar">
                                                {initials(doctor.name)}
                                            </div>

                                            <span className={status.cls}>
                                                {status.label}
                                            </span>

                                        </div>


                                        <h5 className="fw-bold mt-3 mb-1">
                                            {withDr(doctor.name)}
                                        </h5>

                                        <p className="text-primary mb-3">
                                            {doctor.specialization || "General"}
                                        </p>


                                        <div className="doctor-info">

                                            <div>
                                                <small>Experience</small>
                                                <strong>{doctor.experience != null ? `${doctor.experience} Years` : "-"}</strong>
                                            </div>

                                            <div>
                                                <small>Patients</small>
                                                <strong>{doctor.patientsCount}</strong>
                                            </div>

                                        </div>


                                        <button
                                            className="btn btn-outline-primary w-100 mt-3"
                                            onClick={() => setModal({ type: "view", doctor })}
                                        >
                                            View Profile
                                        </button>

                                    </div>

                                </div>

                            );
                        })}

                    </div>

                </main>

            </div>

            {modal?.type === "add" && (
                <Modal title="Add doctor" onClose={closeModal}>
                    <DoctorForm onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

            {modal?.type === "edit" && (
                <Modal title="Edit doctor" onClose={closeModal}>
                    <DoctorForm doctor={modal.doctor} onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

            {modal?.type === "view" && (
                <Modal title="Doctor profile" onClose={closeModal}>
                    <DoctorDetails
                        id={modal.doctor._id}
                        onEdit={(d) => setModal({ type: "edit", doctor: d })}
                        onToggle={toggleStatus}
                    />
                </Modal>
            )}

        </div>
    );
}

export default Doctors;