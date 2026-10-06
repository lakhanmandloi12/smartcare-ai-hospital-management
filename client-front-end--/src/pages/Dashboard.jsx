import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import StatCard from '../components/StatCard';

function Dashboard() {
    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Topbar />

                <main className="dashboard-content">

                    <div className="mb-4">
                        <h2 className="fw-bold mb-1">
                            Good Morning, Lakhan 👋
                        </h2>

                        <p className="text-muted mb-0">
                            Here's what's happening in your hospital today.
                        </p>
                    </div>

                    <div className="row g-4 mb-4">

                        <StatCard
                            icon="bi-people"
                            title="Total Patients"
                            value="248"
                            change="+12%"
                        />

                        <StatCard
                            icon="bi-person-badge"
                            title="Doctors"
                            value="32"
                            change="+4%"
                        />

                        <StatCard
                            icon="bi-calendar-check"
                            title="Appointments"
                            value="18"
                            change="+8%"
                        />

                        <StatCard
                            icon="bi-cash-stack"
                            title="Revenue"
                            value="₹24,850"
                            change="+15%"
                        />

                    </div>

                    <div className="row g-4">

                        <div className="col-lg-8">

                            <div className="dashboard-card">

                                <div className="d-flex justify-content-between align-items-center mb-4">

                                    <div>
                                        <h5 className="fw-bold mb-1">
                                            Today's Appointments
                                        </h5>

                                        <p className="text-muted small mb-0">
                                            Upcoming patient appointments
                                        </p>
                                    </div>

                                    <button className="btn btn-sm btn-outline-primary">
                                        View All
                                    </button>

                                </div>

                                <div className="appointment-row">
                                    <div className="doctor-avatar">DR</div>

                                    <div className="flex-grow-1">
                                        <h6 className="mb-1 fw-semibold">
                                            Dr. Rahul Sharma
                                        </h6>

                                        <small className="text-muted">
                                            Cardiology • Patient: Aman Verma
                                        </small>
                                    </div>

                                    <span className="appointment-time">
                                        10:30 AM
                                    </span>
                                </div>

                                <div className="appointment-row">
                                    <div className="doctor-avatar">DS</div>

                                    <div className="flex-grow-1">
                                        <h6 className="mb-1 fw-semibold">
                                            Dr. Sneha Patel
                                        </h6>

                                        <small className="text-muted">
                                            Neurology • Patient: Priya Singh
                                        </small>
                                    </div>

                                    <span className="appointment-time">
                                        11:30 AM
                                    </span>
                                </div>

                                <div className="appointment-row">
                                    <div className="doctor-avatar">AK</div>

                                    <div className="flex-grow-1">
                                        <h6 className="mb-1 fw-semibold">
                                            Dr. Amit Kumar
                                        </h6>

                                        <small className="text-muted">
                                            Orthopedic • Patient: Rohit Jain
                                        </small>
                                    </div>

                                    <span className="appointment-time">
                                        01:00 PM
                                    </span>
                                </div>

                            </div>

                        </div>

                        <div className="col-lg-4">

                            <div className="ai-card">

                                <div className="ai-icon">
                                    <i className="bi bi-stars"></i>
                                </div>

                                <h4 className="fw-bold mt-3">
                                    SmartCare AI
                                </h4>

                                <p>
                                    Get intelligent assistance for patient queries,
                                    department suggestions and medical summaries.
                                </p>

                                <button className="btn ai-button">
                                    <i className="bi bi-chat-dots me-2"></i>
                                    Open AI Assistant
                                </button>

                            </div>

                        </div>

                    </div>

                </main>

            </div>

        </div>
    );
}

export default Dashboard;