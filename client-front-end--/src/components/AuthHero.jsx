export default function AuthHero() {
    return (
        <aside className="sc-hero">
            <div className="sc-hero-top">
                <i className="bi bi-heart-pulse-fill"></i>
                <span>SmartCare AI</span>
            </div>

            <div className="sc-hero-body">
                <h1>Care that keeps pace with you.</h1>
                <p>
                    One place for appointments, prescriptions and records, for
                    patients, doctors and administrators.
                </p>
            </div>

            <svg className="sc-ecg" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
                <path
                    pathLength="1"
                    d="M0 70 H120 L140 70 L156 22 L180 112 L200 44 L214 70 H330 L346 70 L362 34 L384 98 L400 70 H600"
                />
            </svg>

            <ul className="sc-hero-points">
                <li><i className="bi bi-calendar2-check"></i> Book and track appointments</li>
                <li><i className="bi bi-file-earmark-medical"></i> Prescriptions and records in one place</li>
                <li><i className="bi bi-stars"></i> AI assistant for quick health questions</li>
            </ul>
        </aside>
    );
}