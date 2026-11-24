import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "./services/api"; // services folder src/ mein hai to "../services/api"

/* ---------- helpers ---------- */
const apptCode = (id) => `A-${String(id).slice(-5).toUpperCase()}`;
const withDr = (name = "Doctor") => (/^dr\.?\s/i.test(name) ? name : `Dr. ${name}`);
const errMsg = (err, fallback) => err.response?.data?.message || fallback;
const dateKey = (a) => String(a.date).slice(0, 10); // appointment ki date UTC midnight par save hai
const todayStr = () => new Date().toLocaleDateString("en-CA");

// Appointment ki date UTC mein dikhao, warna timezone ki wajah se ek din aage-peeche ho sakti hai
const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });

function fmtTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${String(((h + 11) % 12) + 1).padStart(2, "0")}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

// 9:00 AM se 4:30 PM, har 30 minute
const SLOTS = [];
for (let h = 9; h < 17; h++) for (const m of ["00", "30"]) SLOTS.push(`${String(h).padStart(2, "0")}:${m}`);

const STATUS_CLASS = {
    confirmed: "status-badge active-status",
    pending: "status-badge pending-status",
    completed: "status-badge completed-status",
    cancelled: "status-badge cancelled-status",
};
const isActive = (a) => a.status === "pending" || a.status === "confirmed";

const FILTERS = [
    ["all", "All Appointments"],
    ["today", "Today"],
    ["upcoming", "Upcoming"],
    ["pending", "Pending"],
    ["completed", "Completed"],
    ["cancelled", "Cancelled"],
];

function matchesFilter(a, filter) {
    const today = todayStr();
    switch (filter) {
        case "today": return dateKey(a) === today;
        case "upcoming": return dateKey(a) >= today && isActive(a);
        case "pending":
        case "completed":
        case "cancelled": return a.status === filter;
        default: return true;
    }
}

/* ---------- hooks ---------- */
function useBooked(doctorId, date) {
    const [booked, setBooked] = useState([]);
    useEffect(() => {
        if (!doctorId || !date) {
            setBooked([]);
            return;
        }
        let alive = true;
        api.get("/appointments/booked", { params: { doctor: doctorId, date } })
            .then(({ data }) => alive && setBooked(data.booked || []))
            .catch(() => alive && setBooked([]));
        return () => {
            alive = false;
        };
    }, [doctorId, date]);
    return booked;
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
            <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable">
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

/* ---------- Time slot dropdown (booked slots disabled) ---------- */
function TimeSelect({ id, value, onChange, booked, ownTime, disabled }) {
    return (
        <select id={id} className="form-select" value={value} onChange={onChange} required disabled={disabled}>
            <option value="" disabled>Select time</option>
            {SLOTS.map((t) => {
                const taken = booked.includes(t) && t !== ownTime;
                return (
                    <option key={t} value={t} disabled={taken}>
                        {fmtTime(t)}{taken ? " (booked)" : ""}
                    </option>
                );
            })}
        </select>
    );
}

/* ---------- New appointment ---------- */
function NewAppointmentForm({ onClose, onSaved }) {
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loadingLists, setLoadingLists] = useState(true);
    const [form, setForm] = useState({ patientId: "", doctorId: "", date: "", time: "", reason: "" });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        Promise.all([api.get("/admin/patients"), api.get("/admin/doctors")])
            .then(([p, d]) => {
                setPatients(p.data.patients.filter((x) => x.isActive !== false));
                setDoctors(d.data.doctors);
            })
            .catch((err) => setError(errMsg(err, "Patients aur doctors load nahi ho paye.")))
            .finally(() => setLoadingLists(false));
    }, []);

    const booked = useBooked(form.doctorId, form.date);

    function onChange(e) {
        const { name, value } = e.target;
        // Doctor ya date badalne par purana time hata do (slot alag ho sakta hai)
        setForm((f) => ({ ...f, [name]: value, ...(name === "doctorId" || name === "date" ? { time: "" } : {}) }));
    }

    async function submit(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const { data } = await api.post("/appointments/admin", form);
            onSaved(data.appointment, "Appointment booked.");
            onClose();
        } catch (err) {
            setError(errMsg(err, "Appointment nahi ban payi."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

            <label className="form-label" htmlFor="na-patient">Patient</label>
            <select id="na-patient" className="form-select mb-3" name="patientId" value={form.patientId} onChange={onChange} required disabled={loadingLists}>
                <option value="" disabled>{loadingLists ? "Loading..." : patients.length ? "Select patient" : "No active patients"}</option>
                {patients.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.email})</option>
                ))}
            </select>

            <label className="form-label" htmlFor="na-doctor">Doctor</label>
            <select id="na-doctor" className="form-select mb-3" name="doctorId" value={form.doctorId} onChange={onChange} required disabled={loadingLists}>
                <option value="" disabled>{loadingLists ? "Loading..." : doctors.length ? "Select doctor" : "No approved doctors"}</option>
                {doctors.map((d) => (
                    <option key={d._id} value={d._id}>{withDr(d.name)}{d.specialization ? ` - ${d.specialization}` : ""}</option>
                ))}
            </select>

            <div className="row g-3 mb-3">
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="na-date">Date</label>
                    <input id="na-date" type="date" className="form-control" name="date" min={todayStr()} value={form.date} onChange={onChange} required />
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="na-time">Time</label>
                    <TimeSelect id="na-time" value={form.time} booked={booked}
                        onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                        disabled={!form.doctorId || !form.date} />
                </div>
            </div>

            <label className="form-label" htmlFor="na-reason">Reason (optional)</label>
            <textarea id="na-reason" rows="2" className="form-control" name="reason" maxLength={500} value={form.reason} onChange={onChange} />

            <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" disabled={busy || loadingLists}>
                    {busy ? "Booking..." : "Book appointment"}
                </button>
            </div>
        </form>
    );
}

/* ---------- Reschedule ---------- */
function RescheduleForm({ appt, onClose, onSaved }) {
    const [date, setDate] = useState(dateKey(appt));
    const [time, setTime] = useState(appt.time);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    const booked = useBooked(appt.doctor?._id, date);
    // Isi appointment ka apna slot khali maana jaye
    const ownTime = date === dateKey(appt) ? appt.time : null;

    async function submit(e) {
        e.preventDefault();
        setError("");
        setBusy(true);
        try {
            const { data } = await api.patch(`/appointments/${appt._id}/admin`, { date, time });
            onSaved(data.appointment, "Appointment rescheduled.");
            onClose();
        } catch (err) {
            setError(errMsg(err, "Reschedule nahi ho paya."));
        } finally {
            setBusy(false);
        }
    }

    return (
        <form onSubmit={submit}>
            {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

            <p className="text-muted">
                {appt.patient?.name || "Patient"} with <strong>{withDr(appt.doctor?.name)}</strong>
                <br />
                Currently: {fmtDate(appt.date)}, {fmtTime(appt.time)}
            </p>

            <div className="row g-3">
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="rs-date">New date</label>
                    <input id="rs-date" type="date" className="form-control" min={todayStr()} value={date}
                        onChange={(e) => { setDate(e.target.value); setTime(""); }} required />
                </div>
                <div className="col-sm-6">
                    <label className="form-label" htmlFor="rs-time">New time</label>
                    <TimeSelect id="rs-time" value={time} booked={booked} ownTime={ownTime}
                        onChange={(e) => setTime(e.target.value)} />
                </div>
            </div>

            <div className="d-flex gap-2 justify-content-end mt-4">
                <button type="button" className="btn btn-light" onClick={onClose}>Cancel</button>
                <button className="btn btn-primary" disabled={busy || !time}>
                    {busy ? "Saving..." : "Reschedule"}
                </button>
            </div>
        </form>
    );
}

/* ---------- Row menu (⋯) ---------- */
function RowMenu({ appt, onAction }) {
    const [pos, setPos] = useState(null);
    const btnRef = useRef(null);

    useEffect(() => {
        if (!pos) return;
        const close = () => setPos(null);
        window.addEventListener("scroll", close, true);
        window.addEventListener("resize", close);
        return () => {
            window.removeEventListener("scroll", close, true);
            window.removeEventListener("resize", close);
        };
    }, [pos]);

    function toggle() {
        if (pos) return setPos(null);
        const r = btnRef.current.getBoundingClientRect();
        setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
    }

    const pick = (action) => {
        setPos(null);
        onAction(action, appt);
    };

    return (
        <>
            <button
                ref={btnRef}
                className="btn btn-sm btn-light"
                aria-label="Appointment actions"
                aria-haspopup="menu"
                aria-expanded={Boolean(pos)}
                onClick={toggle}
            >
                <i className="bi bi-three-dots"></i>
            </button>

            {pos && (
                <>
                    <div style={{ position: "fixed", inset: 0, zIndex: 1055 }} onClick={() => setPos(null)} />
                    <div
                        className="dropdown-menu show shadow"
                        role="menu"
                        style={{ position: "fixed", top: pos.top, right: pos.right, left: "auto", zIndex: 1060, margin: 0 }}
                    >
                        {appt.status === "pending" && (
                            <button className="dropdown-item" onClick={() => pick("confirmed")}>
                                <i className="bi bi-check-lg me-2"></i>Confirm
                            </button>
                        )}
                        {appt.status === "confirmed" && (
                            <button className="dropdown-item" onClick={() => pick("completed")}>
                                <i className="bi bi-check2-all me-2"></i>Mark completed
                            </button>
                        )}
                        {isActive(appt) && (
                            <>
                                <button className="dropdown-item" onClick={() => pick("reschedule")}>
                                    <i className="bi bi-calendar2-week me-2"></i>Reschedule
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item text-danger" onClick={() => pick("cancelled")}>
                                    <i className="bi bi-x-circle me-2"></i>Cancel appointment
                                </button>
                            </>
                        )}
                        {!isActive(appt) && (
                            <span className="dropdown-item-text text-muted small">No actions available</span>
                        )}
                    </div>
                </>
            )}
        </>
    );
}

/* ---------- Page ---------- */
function Appointments() {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [filter, setFilter] = useState("all");
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(null); // { type: "new" } | { type: "reschedule", appt }
    const [notice, setNotice] = useState(null);

    function load() {
        setLoading(true);
        setError("");
        api.get("/appointments/all")
            .then(({ data }) => setAppointments(data.appointments))
            .catch((err) => setError(errMsg(err, "Appointments load nahi ho payi.")))
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
        const today = todayStr();
        const key = (a) => `${dateKey(a)} ${a.time}`;

        return appointments
            .filter((a) => matchesFilter(a, filter))
            .filter(
                (a) =>
                    !s ||
                    `${a.patient?.name || ""} ${a.doctor?.name || ""} ${apptCode(a._id)}`.toLowerCase().includes(s)
            )
            // Aaj aur aage ki pehle (nazdeek se door), phir purani (nayi se purani)
            .sort((a, b) => {
                const au = dateKey(a) >= today;
                const bu = dateKey(b) >= today;
                if (au !== bu) return au ? -1 : 1;
                return au ? key(a).localeCompare(key(b)) : key(b).localeCompare(key(a));
            });
    }, [appointments, filter, q]);

    function handleSaved(saved, message) {
        setAppointments((list) =>
            list.some((a) => a._id === saved._id)
                ? list.map((a) => (a._id === saved._id ? saved : a))
                : [saved, ...list]
        );
        setNotice({ type: "success", text: message });
    }

    async function handleAction(action, appt) {
        if (action === "reschedule") return setModal({ type: "reschedule", appt });
        if (action === "cancelled" && !window.confirm("Is appointment ko cancel karna hai?")) return;

        try {
            const { data } = await api.patch(`/appointments/${appt._id}/admin`, { status: action });
            handleSaved(data.appointment, `Appointment ${action}.`);
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
                                Appointments
                            </h2>

                            <p className="text-muted">
                                Manage patient appointments and schedules.
                            </p>
                        </div>

                        <button className="btn btn-primary" onClick={() => setModal({ type: "new" })}>
                            <i className="bi bi-plus-lg me-2"></i>
                            New Appointment
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

                            <div>
                                <h5 className="fw-bold mb-1">
                                    Appointment Schedule
                                </h5>

                                <small className="text-muted">
                                    {loading ? "Loading..." : `${shown.length} of ${appointments.length} appointments`}
                                </small>
                            </div>

                            <div className="d-flex gap-2 flex-wrap">

                                <div className="input-group search-box">
                                    <span className="input-group-text">
                                        <i className="bi bi-search"></i>
                                    </span>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Search patient or doctor"
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                    />
                                </div>

                                <select
                                    className="form-select appointment-filter"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    aria-label="Filter appointments"
                                >
                                    {FILTERS.map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>

                            </div>

                        </div>


                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Department</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>


                                <tbody>

                                    {!loading && shown.length === 0 && (
                                        <tr>
                                            <td colSpan="8" className="text-center text-muted py-5">
                                                {appointments.length === 0
                                                    ? "No appointments yet. Click New Appointment to book one."
                                                    : "No appointments match your filter."}
                                            </td>
                                        </tr>
                                    )}

                                    {shown.map((appointment) => (

                                        <tr key={appointment._id}>

                                            <td>
                                                <strong>{apptCode(appointment._id)}</strong>
                                            </td>

                                            <td>
                                                {appointment.patient?.name || "-"}
                                            </td>

                                            <td>
                                                {appointment.doctor ? withDr(appointment.doctor.name) : "-"}
                                            </td>

                                            <td>
                                                {appointment.doctor?.specialization || "-"}
                                            </td>

                                            <td className="text-nowrap">
                                                {fmtDate(appointment.date)}
                                            </td>

                                            <td>
                                                <strong>
                                                    {fmtTime(appointment.time)}
                                                </strong>
                                            </td>

                                            <td>

                                                <span className={STATUS_CLASS[appointment.status] || "status-badge"}>
                                                    {appointment.status[0].toUpperCase() + appointment.status.slice(1)}
                                                </span>

                                            </td>

                                            <td>

                                                <RowMenu appt={appointment} onAction={handleAction} />

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </main>

            </div>

            {modal?.type === "new" && (
                <Modal title="New appointment" onClose={closeModal}>
                    <NewAppointmentForm onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

            {modal?.type === "reschedule" && (
                <Modal title="Reschedule appointment" onClose={closeModal}>
                    <RescheduleForm appt={modal.appt} onClose={closeModal} onSaved={handleSaved} />
                </Modal>
            )}

        </div>
    );
}

export default Appointments;