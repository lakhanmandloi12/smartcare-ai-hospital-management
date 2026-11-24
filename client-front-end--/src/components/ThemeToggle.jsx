import { useTheme } from "../theme";

function ThemeToggle() {
    const [theme, toggle] = useTheme();
    const dark = theme === "dark";

    return (
        <button
            type="button"
            className="theme-toggle"
            role="switch"
            aria-checked={dark}
            aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
            title={dark ? "Light mode" : "Dark mode"}
            onClick={toggle}
        >
            <i className="bi bi-sun-fill theme-toggle-bg-sun" aria-hidden="true"></i>
            <i className="bi bi-moon-stars-fill theme-toggle-bg-moon" aria-hidden="true"></i>

            <span className="theme-toggle-knob" aria-hidden="true">
                <i className="bi bi-sun-fill theme-toggle-sun"></i>
                <i className="bi bi-moon-stars-fill theme-toggle-moon"></i>
            </span>
        </button>
    );
}

export default ThemeToggle;