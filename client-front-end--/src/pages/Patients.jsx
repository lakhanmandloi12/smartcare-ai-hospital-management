import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Patients() {

    const patients = [
        {
            id: "P001",
            name: "Aman Verma",
            age: 24,
            gender: "Male",
            phone: "9876543210",
            status: "Active"
        },
        {
            id: "P002",
            name: "Priya Singh",
            age: 31,
            gender: "Female",
            phone: "9123456780",
            status: "Active"
        },
        {
            id: "P003",
            name: "Rohit Jain",
            age: 42,
            gender: "Male",
            phone: "9988776655",
            status: "Inactive"
        },
        {
            id: "P004",
            name: "Neha Sharma",
            age: 28,
            gender: "Female",
            phone: "9876123456",
            status: "Active"
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
                                Patients
                            </h2>

                            <p className="text-muted">
                                Manage and view all registered patients.
                            </p>
                        </div>

                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg me-2"></i>
                            Add Patient
                        </button>

                    </div>


                    <div className="dashboard-card">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <div>
                                <h5 className="fw-bold mb-1">
                                    Patient List
                                </h5>

                                <small className="text-muted">
                                    {patients.length} registered patients
                                </small>
                            </div>

                            <div className="input-group search-box">

                                <span className="input-group-text bg-white">
                                    <i className="bi bi-search"></i>
                                </span>

                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Search patient..."
                                />

                            </div>

                        </div>


                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>

                                    <tr>
                                        <th>Patient ID</th>
                                        <th>Patient</th>
                                        <th>Age</th>
                                        <th>Gender</th>
                                        <th>Phone</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>

                                </thead>


                                <tbody>

                                    {patients.map((patient) => (

                                        <tr key={patient.id}>

                                            <td>
                                                <strong>{patient.id}</strong>
                                            </td>

                                            <td>
                                                <div className="d-flex align-items-center gap-3">

                                                    <div className="table-avatar">
                                                        {patient.name.charAt(0)}
                                                    </div>

                                                    <strong>
                                                        {patient.name}
                                                    </strong>

                                                </div>
                                            </td>

                                            <td>{patient.age}</td>

                                            <td>{patient.gender}</td>

                                            <td>{patient.phone}</td>

                                            <td>
                                                <span
                                                    className={
                                                        patient.status === "Active"
                                                            ? "status-badge active-status"
                                                            : "status-badge inactive-status"
                                                    }
                                                >
                                                    {patient.status}
                                                </span>
                                            </td>

                                            <td>

                                                <button className="btn btn-sm btn-light">
                                                    <i className="bi bi-eye"></i>
                                                </button>

                                                <button className="btn btn-sm btn-light ms-2">
                                                    <i className="bi bi-pencil"></i>
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

export default Patients;