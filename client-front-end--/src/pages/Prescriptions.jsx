import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Prescriptions() {

    const prescriptions = [
        {
            id: "RX001",
            patient: "Aman Verma",
            doctor: "Dr. Rahul Sharma",
            medicines: 3,
            date: "06 Oct 2026",
            status: "Active"
        },
        {
            id: "RX002",
            patient: "Priya Singh",
            doctor: "Dr. Sneha Patel",
            medicines: 2,
            date: "05 Oct 2026",
            status: "Active"
        },
        {
            id: "RX003",
            patient: "Rohit Jain",
            doctor: "Dr. Amit Kumar",
            medicines: 4,
            date: "02 Oct 2026",
            status: "Completed"
        }
    ];

    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Topbar />

                <main className="dashboard-content">

                    <div className="page-header">

                        <div>
                            <h2 className="fw-bold mb-1">
                                Prescriptions
                            </h2>

                            <p className="text-muted">
                                Manage patient prescriptions and medicines.
                            </p>
                        </div>

                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg me-2"></i>
                            Create Prescription
                        </button>

                    </div>


                    <div className="row g-4">

                        {prescriptions.map((prescription) => (

                            <div
                                className="col-lg-4"
                                key={prescription.id}
                            >

                                <div className="dashboard-card prescription-card">

                                    <div className="d-flex justify-content-between">

                                        <div className="prescription-icon">
                                            <i className="bi bi-capsule"></i>
                                        </div>

                                        <span className="status-badge active-status">
                                            {prescription.status}
                                        </span>

                                    </div>


                                    <h5 className="fw-bold mt-3">
                                        {prescription.patient}
                                    </h5>

                                    <p className="text-muted mb-2">
                                        {prescription.doctor}
                                    </p>

                                    <p className="small text-muted">
                                        Prescription ID: {prescription.id}
                                    </p>


                                    <div className="prescription-footer">

                                        <span>
                                            <i className="bi bi-capsule me-1"></i>
                                            {prescription.medicines} Medicines
                                        </span>

                                        <span>
                                            {prescription.date}
                                        </span>

                                    </div>

                                </div>

                            </div>

                        ))}

                    </div>

                </main>

            </div>

        </div>
    );
}

export default Prescriptions;