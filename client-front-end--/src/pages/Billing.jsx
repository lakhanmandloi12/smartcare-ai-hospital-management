import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function Billing() {

    const bills = [
        {
            id: "INV001",
            patient: "Aman Verma",
            service: "Consultation + Tests",
            amount: "₹4,500",
            date: "06 Oct 2026",
            status: "Paid"
        },
        {
            id: "INV002",
            patient: "Priya Singh",
            service: "Neurology Consultation",
            amount: "₹2,000",
            date: "06 Oct 2026",
            status: "Pending"
        },
        {
            id: "INV003",
            patient: "Rohit Jain",
            service: "Orthopedic Treatment",
            amount: "₹6,800",
            date: "05 Oct 2026",
            status: "Paid"
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
                                Billing
                            </h2>

                            <p className="text-muted">
                                Manage invoices and hospital payments.
                            </p>
                        </div>

                        <button className="btn btn-primary">
                            <i className="bi bi-plus-lg me-2"></i>
                            Create Invoice
                        </button>

                    </div>


                    <div className="row g-4 mb-4">

                        <div className="col-md-4">
                            <div className="stat-card">
                                <p className="stat-title">
                                    Total Revenue
                                </p>

                                <h3 className="stat-value">
                                    ₹24,850
                                </h3>

                                <small className="stat-change">
                                    <i className="bi bi-arrow-up"></i>
                                    15% this month
                                </small>
                            </div>
                        </div>


                        <div className="col-md-4">
                            <div className="stat-card">
                                <p className="stat-title">
                                    Paid Bills
                                </p>

                                <h3 className="stat-value">
                                    186
                                </h3>

                                <small className="stat-change">
                                    Successfully paid
                                </small>
                            </div>
                        </div>


                        <div className="col-md-4">
                            <div className="stat-card">
                                <p className="stat-title">
                                    Pending
                                </p>

                                <h3 className="stat-value">
                                    14
                                </h3>

                                <small className="text-warning">
                                    Payment pending
                                </small>
                            </div>
                        </div>

                    </div>


                    <div className="dashboard-card">

                        <div className="table-responsive">

                            <table className="table align-middle">

                                <thead>
                                    <tr>
                                        <th>Invoice</th>
                                        <th>Patient</th>
                                        <th>Service</th>
                                        <th>Amount</th>
                                        <th>Date</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>

                                <tbody>

                                    {bills.map((bill) => (

                                        <tr key={bill.id}>

                                            <td>
                                                <strong>{bill.id}</strong>
                                            </td>

                                            <td>{bill.patient}</td>

                                            <td>{bill.service}</td>

                                            <td>
                                                <strong>{bill.amount}</strong>
                                            </td>

                                            <td>{bill.date}</td>

                                            <td>

                                                <span
                                                    className={
                                                        bill.status === "Paid"
                                                            ? "status-badge active-status"
                                                            : "status-badge pending-status"
                                                    }
                                                >
                                                    {bill.status}
                                                </span>

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

export default Billing;