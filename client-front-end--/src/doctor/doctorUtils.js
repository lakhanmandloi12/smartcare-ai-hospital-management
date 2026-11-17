export function getStoredUser() {
    try {
        return JSON.parse(localStorage.getItem("smartcareUser")) || {};
    } catch {
        return {};
    }
}

// Appointment ki date UTC midnight par save hoti hai, isliye UTC mein dikhao
export const fmtApptDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

export const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export function fmtTime(t) {
    if (!t) return "";
    const [h, m] = t.split(":").map(Number);
    return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export const initials = (name) =>
    (name || "?").split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();

export const ageFrom = (dob) => (dob ? Math.floor((Date.now() - new Date(dob)) / 31557600000) : null);

export const statusLabel = {
    pending: "Pending",
    confirmed: "Confirmed",
    completed: "Completed",
    cancelled: "Cancelled",
};

export function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}