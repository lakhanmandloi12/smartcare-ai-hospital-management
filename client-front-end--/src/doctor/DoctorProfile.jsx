import { useEffect, useState } from "react";
import api from "../pages/services/api";
import useApi from "./useApi";
import { fmtDate, getStoredUser } from "./doctorUtils";

function DoctorProfile() {
    const { data: user, loading, error, reload } = useApi("/auth/me", (r) => r.user);
    const [form, setForm] = useState({ name: "", phone: "", experience: "", consultationFee: "", bio: "" });
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);

    useEffect(() => {
        if (!user) return;
        setForm({
            name: user.name || "",
            phone: user.phone || "",
            experience: user.experience ?? "",
            consultationFee: user.consultationFee ?? "",
            bio: user.bio || "",
        });
    }, [user]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    async function save(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.put("/auth/me", form);
            localStorage.setItem(
                "smartcareUser",
                JSON.stringify({ ...getStoredUser(), name: data.user?.name ?? form.name })
            );
            setNotice({ type: "success", text: "Profile updated." });
            reload();
        } catch (err) {
            setNotice({ type: "error", text: err.response?.data?.message || "Profile update nahi ho paya." });
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <div className="page-header">
                <div>
                    <h2 className="fw-bold mb-1">My profile</h2>
                    <p className="text-muted mb-0">Patients see these details when they book with you.</p>
                </div>
            </div>

            {notice && (
                <div className={`dr-alert ${notice.type}`} role="status">
                    <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle"}`}></i>
                    <span>{notice.text}</span>
                </div>
            )}
            {error && (
                <div className="dr-alert error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={reload}>Retry</button>
                </div>
            )}

            <div className="dr-grid">
                <form className="dashboard-card" onSubmit={save}>
                    <h5 className="fw-bold mb-3">Professional details</h5>

                    <label className="form-label" htmlFor="pn">Full name</label>
                    <input id="pn" className="form-control mb-3" name="name" value={form.name} onChange={onChange} required disabled={loading} />

                    <div className="row g-3 mb-3">
                        <div className="col-sm-6">
                            <label className="form-label">Email</label>
                            <input className="form-control" value={user?.email || ""} disabled readOnly />
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="pp">Phone</label>
                            <input id="pp" className="form-control" type="tel" name="phone" value={form.phone} onChange={onChange} />
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-sm-6">
                            <label className="form-label">Specialization</label>
                            <input className="form-control" value={user?.specialization || ""} disabled readOnly />
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label">License number</label>
                            <input className="form-control" value={user?.licenseNumber || ""} disabled readOnly />
                        </div>
                    </div>

                    <div className="row g-3 mb-3">
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="pe">Experience (years)</label>
                            <input id="pe" className="form-control" type="number" min="0" max="60" name="experience" value={form.experience} onChange={onChange} />
                        </div>
                        <div className="col-sm-6">
                            <label className="form-label" htmlFor="pf">Consultation fee (INR)</label>
                            <input id="pf" className="form-control" type="number" min="0" name="consultationFee" value={form.consultationFee} onChange={onChange} />
                        </div>
                    </div>

                    <label className="form-label" htmlFor="pb">About you</label>
                    <textarea id="pb" className="form-control mb-3" rows="4" name="bio" maxLength={500} value={form.bio} onChange={onChange} placeholder="Short introduction for patients" />

                    <button className="btn btn-primary" disabled={busy || loading}>
                        {busy ? "Saving..." : "Save changes"}
                    </button>
                </form>

                <section className="dashboard-card text-center">
                    <div className="dr-big-avatar">{(form.name || "D").charAt(0).toUpperCase()}</div>
                    <h5 className="fw-bold mt-3 mb-1">{form.name || "Doctor"}</h5>
                    <span className="dr-badge confirmed">{user?.specialization || "Doctor"}</span>
                    <p className="text-muted small mt-3 mb-0">
                        {user?.createdAt ? `Member since ${fmtDate(user.createdAt)}` : ""}
                    </p>
                    <p className="text-muted small mb-0">
                        Specialization and license can only be changed by the admin.
                    </p>
                </section>
            </div>
        </>
    );
}

export default DoctorProfile;