import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";

function AIAssistant() {

    return (
        <div className="app-layout">

            <Sidebar />

            <div className="main-content">

                <Topbar />

                <main className="dashboard-content">

                    <div className="page-header">

                        <div>
                            <h2 className="fw-bold mb-1">
                                SmartCare AI
                            </h2>

                            <p className="text-muted">
                                Intelligent assistance for healthcare workflows.
                            </p>
                        </div>

                    </div>


                    <div className="row g-4">

                        <div className="col-lg-8">

                            <div className="ai-chat-card">

                                <div className="ai-chat-header">

                                    <div className="d-flex align-items-center gap-3">

                                        <div className="ai-icon">
                                            <i className="bi bi-stars"></i>
                                        </div>

                                        <div>
                                            <h5 className="fw-bold mb-0">
                                                SmartCare AI Assistant
                                            </h5>

                                            <small>
                                                AI-powered healthcare assistance
                                            </small>
                                        </div>

                                    </div>

                                    <span className="ai-online">
                                        ● Online
                                    </span>

                                </div>


                                <div className="chat-body">

                                    <div className="ai-message">

                                        <div className="ai-message-icon">
                                            <i className="bi bi-stars"></i>
                                        </div>

                                        <div>
                                            <strong>SmartCare AI</strong>

                                            <p className="mb-0 mt-1">
                                                Hello! I can help with preliminary
                                                patient assistance, department suggestions
                                                and medical record summaries.
                                            </p>
                                        </div>

                                    </div>

                                </div>


                                <div className="chat-input">

                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Ask SmartCare AI..."
                                    />

                                    <button className="btn btn-primary">
                                        <i className="bi bi-send"></i>
                                    </button>

                                </div>

                            </div>

                        </div>


                        <div className="col-lg-4">

                            <div className="dashboard-card">

                                <h5 className="fw-bold">
                                    AI Features
                                </h5>

                                <p className="text-muted small">
                                    SmartCare AI modules
                                </p>


                                <div className="ai-feature">

                                    <i className="bi bi-chat-dots"></i>

                                    <div>
                                        <strong>AI Health Assistant</strong>
                                        <small>
                                            Preliminary patient assistance
                                        </small>
                                    </div>

                                </div>


                                <div className="ai-feature">

                                    <i className="bi bi-diagram-3"></i>

                                    <div>
                                        <strong>Department Suggestion</strong>
                                        <small>
                                            Suggest relevant department
                                        </small>
                                    </div>

                                </div>


                                <div className="ai-feature">

                                    <i className="bi bi-file-earmark-text"></i>

                                    <div>
                                        <strong>Medical Summary</strong>
                                        <small>
                                            Summarize medical records
                                        </small>
                                    </div>

                                </div>


                                <div className="ai-feature">

                                    <i className="bi bi-bar-chart"></i>

                                    <div>
                                        <strong>Hospital Insights</strong>
                                        <small>
                                            Operational data insights
                                        </small>
                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>


                    <div className="ai-disclaimer mt-4">

                        <i className="bi bi-shield-check me-2"></i>

                        SmartCare AI provides assistance for healthcare
                        workflows and does not replace qualified medical
                        professionals.

                    </div>

                </main>

            </div>

        </div>
    );
}

export default AIAssistant;