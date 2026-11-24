import { useEffect, useState } from "react";
import api from "../pages/services/api";

import useFetch from "./useFetch";
import { fmtDate, getUser } from "./patientUtils";
import { getTheme, applyTheme } from "../theme";

const emptyForm = {
    name: "",
    phone: "",
    dob: "",
    gender: "",
    bloodGroup: "",
    address: "",
    emergencyContact: "",
};

function PatientProfile() {
    const { data: user, loading, error, reload } = useFetch("/auth/me", (r) => r.user);
    const [form, setForm] = useState(emptyForm);
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState(null);
    // lazy init: getTheme() har render par nahi chalega
    const [dark, setDark] = useState(() => getTheme() === "dark");

    useEffect(() => {
        if (!user) return;
        setForm({
            name: user.name || "",
            phone: user.phone || "",
            dob: user.dob ? String(user.dob).slice(0, 10) : "",
            gender: user.gender || "",
            bloodGroup: user.bloodGroup || "",
            address: user.address || "",
            emergencyContact: user.emergencyContact || "",
        });
    }, [user]);

    useEffect(() => {
        if (!notice) return;
        const t = setTimeout(() => setNotice(null), 4000);
        return () => clearTimeout(t);
    }, [notice]);

    // Theme ko hamesha state ke saath sync rakho (poore app par apply hota hai)
    useEffect(() => {
        applyTheme(dark ? "dark" : "light");
    }, [dark]);

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

    function toggleTheme(e) {
        setDark(e.target.checked);
    }

    async function save(e) {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await api.put("/auth/me", form);
            // Topbar mein naya naam dikhe isliye local copy bhi update karo
            const stored = getUser();
            localStorage.setItem(
                "smartcareUser",
                JSON.stringify({
                    ...stored,
                    name: data.user?.name ?? form.name,
                    phone: data.user?.phone ?? form.phone,
                })
            );
            setNotice({ type: "success", text: "Profile updated." });
            reload();
        } catch (err) {
            setNotice({
                type: "error",
                text: err.response?.data?.message || "Profile update nahi ho paaya.",
            });
        } finally {
            setBusy(false);
        }
    }

    return (
        <>
            <div className="pt-header">
                <h2>My profile</h2>
                <p>Keep your details up to date so doctors can reach you.</p>
            </div>

            {notice && (
                <div className={`pt-alert ${notice.type}`} role="status">
                    <i className={`bi ${notice.type === "success" ? "bi-check-circle-fill" : "bi-exclamation-circle"}`}></i>
                    <span>{notice.text}</span>
                </div>
            )}
            {error && (
                <div className="pt-alert error" role="alert">
                    <i className="bi bi-exclamation-circle"></i>
                    <span>{error}</span>
                    <button onClick={reload}>Retry</button>
                </div>
            )}

            <div className="pt-grid wide-left">
                <form className="pt-card" onSubmit={save}>
                    <h5 className="mb-3">Personal details</h5>

                    <label htmlFor="name">Full name</label>
                    <input id="name" name="name" value={form.name} onChange={onChange} required disabled={loading} />

                    <div className="pt-two">
                        <div>
                            <label htmlFor="email">Email</label>
                            <input id="email" value={user?.email || ""} disabled readOnly />
                        </div>
                        <div>
                            <label htmlFor="phone">Phone</label>
                            <input id="phone" type="tel" name="phone" value={form.phone} onChange={onChange} />
                        </div>
                    </div>

                    <div className="pt-two">
                        <div>
                            <label htmlFor="dob">Date of birth</label>
                            <input
                                id="dob"
                                type="date"
                                name="dob"
                                max={new Date().toISOString().slice(0, 10)}
                                value={form.dob}
                                onChange={onChange}
                            />
                        </div>
                        <div>
                            <label htmlFor="gender">Gender</label>
                            <select id="gender" name="gender" value={form.gender} onChange={onChange}>
                                <option value="">Select</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-two">
                        <div>
                            <label htmlFor="bloodGroup">Blood group</label>
                            <select id="bloodGroup" name="bloodGroup" value={form.bloodGroup} onChange={onChange}>
                                <option value="">Select</option>
                                {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((g) => (
                                    <option key={g} value={g}>
                                        {g}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="emergencyContact">Emergency contact</label>
                            <input
                                id="emergencyContact"
                                type="tel"
                                name="emergencyContact"
                                placeholder="Phone number"
                                value={form.emergencyContact}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <label htmlFor="address">Address</label>
                    <textarea id="address" name="address" rows="3" value={form.address} onChange={onChange} />

                    <button type="submit" className="pt-btn" disabled={busy || loading}>
                        {busy ? "Saving..." : "Save changes"}
                    </button>
                </form>

                <div className="pt-side">
                    <section className="pt-card pt-center">
                        <div className="pt-big-avatar">{(form.name || "U").charAt(0).toUpperCase()}</div>
                        <h5>{form.name || "Patient"}</h5>
                        <span className="pt-status confirmed">Patient</span>
                        <p className="pt-muted">
                            {user?.createdAt ? `Member since ${fmtDate(user.createdAt)}` : ""}
                        </p>
                    </section>


                </div>
            </div>
        </>
    );
}

export default PatientProfile;