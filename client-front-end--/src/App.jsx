import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Billing from "./pages/Billing";
import AIAssistant from "./pages/AIAssistant";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Dashboard />} />

        <Route path="/patients" element={<Patients />} />

        <Route path="/doctors" element={<Doctors />} />

        <Route path="/appointments" element={<Appointments />} />

        <Route path="/medical-records" element={<MedicalRecords />} />

        <Route path="/prescriptions" element={<Prescriptions />} />

        <Route path="/billing" element={<Billing />} />

        <Route path="/ai-assistant" element={<AIAssistant />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;