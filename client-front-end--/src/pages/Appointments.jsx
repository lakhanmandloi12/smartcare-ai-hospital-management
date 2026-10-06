import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Appointments() {

    const appointments = [
        {
            id: "A001",
            patient: "Aman Verma",
            doctor: "Dr. Rahul Sharma",
            department: "Cardiology",
            date: "06 Oct 2026",
            time: "10:30 AM",
            status: "Confirmed"
        },
        {
            id: "A002",
            patient: "Priya Singh",
            doctor: "Dr. Sneha Patel",
            department: "Neurology",
            date: "06 Oct 2026",
            time: "11:30 AM",
            status: "Confirmed"
        },
        {
            id: "A003",
            patient: "Rohit Jain",
            doctor: "Dr. Amit Kumar",
            department: "Orthopedic",
            date: "06 Oct 2026",
            time: "01:00 PM",
            status: "Pending"
        },
        {
            id: "A004",
            patient: "Neha Sharma",
            doctor: "Dr. Priya Mehta",
            department: "Dermatology",
            date: "07 Oct 2026",
            time: "10:00 AM",
            status: "Confirmed"
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
                                Appointments
                            </h2>

                            <p className="text-muted">
                                Manage patient appointments and schedules.
                            </p>
                        </div>

                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg me-2"></i>
                            New Appointment
                        </button>

                    </div>


                    <div className="dashboard-card">

                        <div className="d-flex justify-content-between align-items-center mb-4">

                            <h5 className="fw-bold mb-0">
                                Appointment Schedule
                            </h5>

                            <select className="form-select appointment-filter">
                                <option>All Appointments</option>
                                <option>Today</option>
                                <option>Upcoming</option>
                                <option>Completed</option>
                            </select>

                        </div>


                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Patient</th>
                                        <th>Doctor</th>
                                        <th>Department</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>


                                <tbody>

                                    {appointments.map((appointment) => (

                                        <tr key={appointment.id}>

                                            <td>
                                                <strong>{appointment.id}</strong>
                                            </td>

                                            <td>
                                                {appointment.patient}
                                            </td>

                                            <td>
                                                {appointment.doctor}
                                            </td>

                                            <td>
                                                {appointment.department}
                                            </td>

                                            <td>
                                                {appointment.date}
                                            </td>

                                            <td>
                                                <strong>
                                                    {appointment.time}
                                                </strong>
                                            </td>

                                            <td>

                                                <span
                                                    className={
                                                        appointment.status === "Confirmed"
                                                            ? "status-badge active-status"
                                                            : "status-badge pending-status"
                                                    }
                                                >
                                                    {appointment.status}
                                                </span>

                                            </td>

                                            <td>

                                                <button className="btn btn-sm btn-light">
                                                    <i className="bi bi-three-dots"></i>
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

export default Appointments;