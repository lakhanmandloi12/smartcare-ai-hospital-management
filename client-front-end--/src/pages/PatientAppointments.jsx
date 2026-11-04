import { useEffect, useState } from "react";
import api from "../pages/services/api";
import useFetch from "./useFetch";
import { fmtDate, fmtTime, isUpcoming, statusLabel } from "./patientUtils";

// 9:00 AM se 5:00 PM, 1 PM ka lunch break chhodkar
const SLOTS = (() => {
    const s = [];
    for (let h = 9; h < 17; h++) {
        if (h === 13) continue;
        s.push(`${String(h).padStart(2, "0")}:00`, `${String(h).padStart(2, "0")}:30`);
    }
    return s;
})();

const today = () =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const emptyForm = { doctorId: "", date: "", time: "", reason: "" };

function PatientAppointments() {
    const appts = useFetch("/appointments/my", (r) => r.appointments || []);
    const docs = useFetch("/doctors", (r) => r.doctors || []);

    const [tab, setTab] = useState("upcoming");
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null); // { type: "success" | "error", text }

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const all = appts.data || [];
    const lists = {
        upcoming: all.filter(isUpcoming).sort((a, b) => new Date(a.date) - new Date(b.date)),
        past: all
            .filter((a) => a.status !== "cancelled" && !isUpcoming(a))
            .sort((a, b) => new Date(b.date) - new Date(a.date)),
        cancelled: all.filter((a) => a.status === "cancelled"),
    };
    const shown = lists[tab];

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    async function book(e) {
        e.preventDefault();
        setBusy(true);
        try {
            await api.post("/appointments", form);
            setNotice({ type: "success", text: "Appointment request sent." });
            setForm(emptyForm);
            setTab("upcoming");
            appts.reload();
        } catch (err) {
            setNotice({
                type: "error",
                text: err.response?.data?.message || "Appointment book nahi ho paayi.",
            });
        } finally {
            setBusy(false);
        }
    }

    async function cancel(id) {
        if (!window.confirm("Is appointment ko cancel karna hai?")) return;
        try {
            await api.patch(`/appointments/${id}/cancel`);
            setNotice({ type: "success", text: "Appointment cancelled." });
            appts.reload();
        } catch (err) {
            setNotice({
                type: "error",
                text: err.response?.data?.message || "Cancel nahi ho paaya.",
            });
        }
    }

    return (
        <>
            <div className="pt-header">
                <h2>Appointments</h2>
                <p>Book a visit and keep track of your appointments.</p>
            </div>

            {notice && (
                <div className={`pt-alert ${notice.type}`} role="status">
                    <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle"}`}></i>
                    <span>{notice.text}</span>
                </div>
            )}

            <div className="pt-grid wide-left">
                <section className="pt-card">
                    <div className="pt-tabs" role="tablist">
                        {[
                            ["upcoming", "Upcoming"],
                            ["past", "Past"],
                            ["cancelled", "Cancelled"],
                        ].map(([key, label]) => (
                            <button
                                key={key}
                                role="tab"
                                aria-selected={tab === key}
                                className={tab === key ? "active" : ""}
                                onClick={() => setTab(key)}
                            >
                                {label}
                                <span>{lists[key].length}</span>
                            </button>
                        ))}
                    </div>

                    {appts.error && (
                        <div className="pt-alert error">
                            <i className="bi bi-exclamation-circle"></i>
                            <span>{appts.error}</span>
                            <button onClick={appts.reload}>Retry</button>
                        </div>
                    )}

                    {appts.loading ? (
                        <p className="pt-muted">Loading...</p>
                    ) : shown.length === 0 ? (
                        <div className="pt-empty">
                            <i className="bi bi-calendar-x"></i>
                            <p>No {tab} appointments.</p>
                        </div>
                    ) : (
                        <ul className="pt-appt-list">
                            {shown.map((a) => (
                                <li key={a._id}>
                                    <div className="pt-next-date">
                                        <strong>{new Date(a.date).getDate()}</strong>
                                        <span>
                                            {new Date(a.date).toLocaleDateString("en-IN", { month: "short" })}
                                        </span>
                                    </div>
                                    <div className="pt-next-info">
                                        <strong>Dr. {a.doctor?.name || "Doctor"}</strong>
                                        <span>{a.doctor?.specialization || "General physician"}</span>
                                        <span>
                                            <i className="bi bi-clock"></i> {fmtTime(a.time)} · {fmtDate(a.date)}
                                        </span>
                                        {a.reason && <span className="pt-muted">{a.reason}</span>}
                                    </div>
                                    <div className="pt-appt-side">
                                        <span className={`pt-status ${a.status}`}>
                                            {statusLabel[a.status] || a.status}
                                        </span>
                                        {tab === "upcoming" && (
                                            <button className="pt-link-danger" onClick={() => cancel(a._id)}>
                                                Cancel
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <form className="pt-card" onSubmit={book}>
                    <h5 className="mb-3">Book an appointment</h5>

                    <label htmlFor="doctorId">Doctor</label>
                    <select id="doctorId" name="doctorId" value={form.doctorId} onChange={onChange} required>
                        <option value="">{docs.loading ? "Loading doctors..." : "Select a doctor"}</option>
                        {(docs.data || []).map((d) => (
                            <option key={d._id} value={d._id}>
                                Dr. {d.name}
                                {d.specialization ? ` - ${d.specialization}` : ""}
                            </option>
                        ))}
                    </select>
                    {docs.error && <small className="pt-field-error">{docs.error}</small>}

                    <div className="pt-two">
                        <div>
                            <label htmlFor="date">Date</label>
                            <input
                                id="date"
                                type="date"
                                name="date"
                                min={today()}
                                value={form.date}
                                onChange={onChange}
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="time">Time</label>
                            <select id="time" name="time" value={form.time} onChange={onChange} required>
                                <option value="">Select</option>
                                {SLOTS.map((s) => (
                                    <option key={s} value={s}>
                                        {fmtTime(s)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <label htmlFor="reason">Reason for visit</label>
                    <textarea
                        id="reason"
                        name="reason"
                        rows="3"
                        placeholder="Briefly describe your symptoms or concern"
                        value={form.reason}
                        onChange={onChange}
                        required
                    />

                    <button type="submit" className="pt-btn block" disabled={busy}>
                        {busy ? "Booking..." : "Request appointment"}
                    </button>
                    <small className="pt-muted">The doctor confirms your request before the visit.</small>
                </form>
            </div>
        </>
    );
}

export default PatientAppointments;
