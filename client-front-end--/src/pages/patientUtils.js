export function getUser() {
    try {
        return JSON.parse(localStorage.getItem("smartcareUser")) || {};
    } catch {
        return {};
    }
}

export function fmtDate(d) {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

// "14:30" -> "2:30 PM"
export function fmtTime(t) {
    if (!t) return "";
    const [h, m] = String(t).split(":").map(Number);
    if (Number.isNaN(h)) return t;
    return `${h % 12 || 12}:${String(m || 0).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function isUpcoming(a) {
    if (a.status === "cancelled" || a.status === "completed") return false;
    const d = new Date(a.date);
    d.setHours(23, 59, 59, 999);
    return d >= new Date();
}

export const statusLabel = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
};

export function greeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}
