import { useEffect, useState } from "react";

const KEY = "smartcareTheme";
const EVENT = "smartcare-theme";
let timer;

export function getTheme() {
    try {
        return localStorage.getItem(KEY) === "dark" ? "dark" : "light";
    } catch {
        return "light";
    }
}

function setAttr(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
}

export function applyTheme(theme) {
    const root = document.documentElement;
    try {
        localStorage.setItem(KEY, theme);
    } catch {
        /* storage band ho to bhi theme badal jayegi */
    }

    // Poore page par halka sa fade (jinhe animation pasand nahi unke liye skip)
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.classList.add("theme-transition");
        clearTimeout(timer);
        timer = setTimeout(() => root.classList.remove("theme-transition"), 350);
    }

    setAttr(theme);
    window.dispatchEvent(new CustomEvent(EVENT, { detail: theme }));
}

export function toggleTheme() {
    applyTheme(getTheme() === "dark" ? "light" : "dark");
}

export function initTheme() {
    setAttr(getTheme());
}

// Component mein: const [theme, toggle] = useTheme();
export function useTheme() {
    const [theme, setTheme] = useState(getTheme);

    useEffect(() => {
        const onChange = (e) => setTheme(e.detail);
        const onStorage = (e) => {
            // Dusre tab mein theme badli ho to yahan bhi badal do
            if (e.key === KEY) {
                setAttr(getTheme());
                setTheme(getTheme());
            }
        };
        window.addEventListener(EVENT, onChange);
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener(EVENT, onChange);
            window.removeEventListener("storage", onStorage);
        };
    }, []);

    return [theme, toggleTheme];
}