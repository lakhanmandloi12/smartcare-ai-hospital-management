import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function MedicalRecords() {

    const records = [
        {
            id: "MR001",
            patient: "Aman Verma",
            doctor: "Dr. Rahul Sharma",
            diagnosis: "Hypertension",
            date: "06 Oct 2026"
        },
        {
            id: "MR002",
            patient: "Priya Singh",
            doctor: "Dr. Sneha Patel",
            diagnosis: "Migraine",
            date: "05 Oct 2026"
        },
        {
            id: "MR003",
            patient: "Rohit Jain",
            doctor: "Dr. Amit Kumar",
            diagnosis: "Back Pain",
            date: "04 Oct 2026"
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
                                Medical Records
                            </h2>

                            <p className="text-muted">
                                Patient medical history and clinical records.
                            </p>
                        </div>

                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg me-2"></i>
                            Add Record
                        </button>

                    </div>


                    <div className="dashboard-card">

                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>Record ID</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Diagnosis</th>
                                        <th>Date</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {records.map((record) => (

                                        <tr key={record.id}>

                                            <td>
                                                <strong>{record.id}</strong>
                                            </td>

                                            <td>{record.patient}</td>

                                            <td>{record.doctor}</td>

                                            <td>
                                                <span className="diagnosis-badge">
                                                    {record.diagnosis}
                                                </span>
                                            </td>

                                            <td>{record.date}</td>

                                            <td>

                                                <button className="btn btn-sm btn-outline-primary">
                                                    <i className="bi bi-eye me-1"></i>
                                                    View
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        </div>

                    </div>

                </main>

            </div>

        </div>
    );
}

export default MedicalRecords;