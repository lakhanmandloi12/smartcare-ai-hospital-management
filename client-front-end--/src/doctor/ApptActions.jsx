import { useState } from "react";
import api from "../pages/services/api";

function ApptActions({ appt, onDone, onError }) {
    const [busy, setBusy] = useState(false);

    async function setStatus(status) {
        if (status === "cancelled" && !window.confirm("Is appointment ko cancel karna hai?")) return;
        setBusy(true);
        try {
            await api.patch(`/appointments/${appt._id}/status`, { status });
            onDone();
        } catch (err) {
            onError?.(err.response?.data?.message || "Status update nahi ho paya.");
        } finally {
            setBusy(false);
        }
    }

    if (appt.status === "pending")
        return (
            <div className="dr-actions">
                <button className="btn btn-success btn-sm" disabled={busy} onClick={() => setStatus("confirmed")}>
                    <i className="bi bi-check-lg me-1"></i>Confirm
                </button>
                <button className="btn btn-outline-danger btn-sm" disabled={busy} onClick={() => setStatus("cancelled")}>
                    Cancel
                </button>
            </div>
        );

    if (appt.status === "confirmed")
        return (
            <div className="dr-actions">
                <button className="btn btn-primary btn-sm" disabled={busy} onClick={() => setStatus("completed")}>
                    <i className="bi bi-check2-all me-1"></i>Complete
                </button>
                <button className="btn btn-outline-danger btn-sm" disabled={busy} onClick={() => setStatus("cancelled")}>
                    Cancel
                </button>
            </div>
        );

    return <span className="text-muted small">-</span>;
}

export default ApptActions;