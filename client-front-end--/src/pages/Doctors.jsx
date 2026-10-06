import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Doctors() {

    const doctors = [
        {
            id: "D001",
            name: "Dr. Rahul Sharma",
            department: "Cardiology",
            experience: "12 Years",
            patients: 245,
            status: "Available"
        },
        {
            id: "D002",
            name: "Dr. Sneha Patel",
            department: "Neurology",
            experience: "8 Years",
            patients: 189,
            status: "Available"
        },
        {
            id: "D003",
            name: "Dr. Amit Kumar",
            department: "Orthopedic",
            experience: "10 Years",
            patients: 210,
            status: "Busy"
        },
        {
            id: "D004",
            name: "Dr. Priya Mehta",
            department: "Dermatology",
            experience: "6 Years",
            patients: 156,
            status: "Available"
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
                                Doctors
                            </h2>

                            <p className="text-muted">
                                Manage hospital doctors and departments.
                            </p>
                        </div>

                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg me-2"></i>
                            Add Doctor
                        </button>

                    </div>


                    <div className="row g-4">

                        {doctors.map((doctor) => (

                            <div
                                className="col-xl-3 col-lg-4 col-md-6"
                                key={doctor.id}
                            >

                                <div className="doctor-card">

                                    <div className="doctor-card-top">

                                        <div className="large-avatar">
                                            {doctor.name
                                                .replace("Dr. ", "")
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .slice(0, 2)}
                                        </div>

                                        <span className="status-badge active-status">
                                            {doctor.status}
                                        </span>

                                    </div>


                                    <h5 className="fw-bold mt-3 mb-1">
                                        {doctor.name}
                                    </h5>

                                    <p className="text-primary mb-3">
                                        {doctor.department}
                                    </p>


                                    <div className="doctor-info">

                                        <div>
                                            <small>Experience</small>
                                            <strong>{doctor.experience}</strong>
                                        </div>

                                        <div>
                                            <small>Patients</small>
                                            <strong>{doctor.patients}</strong>
                                        </div>

                                    </div>


                                    <button className="btn btn-outline-primary w-100 mt-3">
                                        View Profile
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                </main>

            </div>

        </div>
    );
}

export default Doctors;