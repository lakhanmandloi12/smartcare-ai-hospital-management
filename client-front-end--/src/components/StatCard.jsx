function StatCard({ icon, title, value, change }) {
    return (
        <div className="col-xl-3 col-md-6">

            <div className="stat-card">

                <div className="d-flex justify-content-between">

                    <div>
                        <p className="stat-title">
                            {title}
                        </p>

                        <h3 className="stat-value">
                            {value}
                        </h3>

                        <small className="stat-change">
                            <i className="bi bi-arrow-up"></i>
                            {change} this month
                        </small>
                    </div>

                    <div className="stat-icon">
                        <i className={`bi ${icon}`}></i>
                    </div>

                </div>

            </div>

        </div>
    );
}

export default StatCard;