const KEY = "smartcareTheme";

export function getTheme() {
    return localStorage.getItem(KEY) || "light";
}

export function applyTheme(theme) {
    localStorage.setItem(KEY, theme);
    document.documentElement.setAttribute("data-bs-theme", theme);
}

export function initTheme() {
    document.documentElement.setAttribute("data-bs-theme", getTheme());
}