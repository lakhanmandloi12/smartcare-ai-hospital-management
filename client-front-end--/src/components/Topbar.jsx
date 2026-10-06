function Topbar() {
    return (
        <header className="topbar">

            <div>
                <span className="text-muted">
                    Hospital Management
                </span>
            </div>

            <div className="topbar-right">

                <button className="notification-btn">
                    <i className="bi bi-bell"></i>
                    <span></span>
                </button>

                <div className="user-profile">

                    <div className="user-avatar">
                        L
                    </div>

                    <div>
                        <strong>Lakhan</strong>
                        <small>Administrator</small>
                    </div>

                    <i className="bi bi-chevron-down ms-2"></i>

                </div>

            </div>

        </header>
    );
}

export default Topbar;