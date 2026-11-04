import { useEffect, useState } from "react";
import api from "../pages/services/api";

function PendingDoctors({ onChange }) {
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [busyId, setBusyId] = useState(null);

    async function load() {
        setError("");
        try {
            const { data } = await api.get("/admin/doctors/pending");
            setDoctors(data.doctors);
        } catch (err) {
            setError(err.response?.data?.message || "Pending doctors load nahi ho paye.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
    }, []);

    async function approve(doc) {
        setBusyId(doc._id);
        try {
            await api.patch(`/admin/doctors/${doc._id}/approve`);
            setDoctors((list) => list.filter((d) => d._id !== doc._id));
            onChange?.(); // parent ko bolo apni doctors list refresh kare
        } catch (err) {
            setError(err.response?.data?.message || "Not Approval..");
        } finally {
            setBusyId(null);
        }
    }

    async function reject(doc) {
        if (!window.confirm(`${doc.name} rejected ?`)) return;
        setBusyId(doc._id);
        try {
            await api.delete(`/admin/doctors/${doc._id}/reject`);
            setDoctors((list) => list.filter((d) => d._id !== doc._id));
        } catch (err) {
            setError(err.response?.data?.message || "Not reject");
        } finally {
            setBusyId(null);
        }
    }

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body">
                <div className="d-flex align-items-center justify-content-between mb-3">
                    <h5 className="fw-bold mb-0">
                        <i className="bi bi-person-check text-primary me-2"></i>
                        Pending doctor approvals
                    </h5>
                    {doctors.length > 0 && (
                        <span className="badge bg-warning text-dark">{doctors.length} waiting</span>
                    )}
                </div>

                {error && <div className="alert alert-danger py-2">{error}</div>}

                {loading ? (
                    <p className="text-muted mb-0">Loading...</p>
                ) : doctors.length === 0 ? (
                    <p className="text-muted mb-0">
                        New Doctors will be there...
                    </p>
                ) : (
                    <div className="table-responsive">
                        <table className="table align-middle mb-0">
                            <thead>
                                <tr>
                                    <th>Doctor</th>
                                    <th>Specialization</th>
                                    <th>License</th>
                                    <th>Experience</th>
                                    <th>Applied</th>
                                    <th className="text-end">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {doctors.map((d) => (
                                    <tr key={d._id}>
                                        <td>
                                            <div className="fw-semibold">{d.name}</div>
                                            <div className="text-muted small">
                                                {d.email}
                                                {d.phone ? ` · ${d.phone}` : ""}
                                            </div>
                                        </td>
                                        <td>{d.specialization || "-"}</td>
                                        <td>{d.licenseNumber || "-"}</td>
                                        <td>{d.experience ?? 0} yrs</td>
                                        <td className="text-muted small">
                                            {new Date(d.createdAt).toLocaleDateString("en-IN")}
                                        </td>
                                        <td className="text-end text-nowrap">
                                            <button
                                                className="btn btn-success btn-sm me-2"
                                                disabled={busyId === d._id}
                                                onClick={() => approve(d)}
                                            >
                                                <i className="bi bi-check-lg me-1"></i>
                                                Approve
                                            </button>
                                            <button
                                                className="btn btn-outline-danger btn-sm"
                                                disabled={busyId === d._id}
                                                onClick={() => reject(d)}
                                            >
                                                <i className="bi bi-x-lg me-1"></i>
                                                Reject
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PendingDoctors;