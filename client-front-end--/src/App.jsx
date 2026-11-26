import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import api from "./pages/services/api";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

import Settings from "./pages/Settings";
import Patients from "./pages/Patients";
import Doctors from "./pages/Doctors";
import Appointments from "./pages/Appointments";
import MedicalRecords from "./pages/MedicalRecords";
import Prescriptions from "./pages/Prescriptions";
import Billing from "./pages/Billing";
import AIAssistant from "./pages/AIAssistant";

// Patient portal (purani src/pages/PatientDashboard.jsx delete kar do)
import PatientLayout from "./pages/PatientLayout";
import PatientDashboard from "./pages/PatientDashboard";
import PatientAppointments from "./pages/PatientAppointments";
import PatientRecords from "./pages/PatientRecords";
import PatientProfile from "./pages/PatientProfile";
import PatientAI from "./pages/PatientAI";

import DoctorLayout from "./doctor/DoctorLayout";
import DoctorDashboard from "./doctor/DoctorDashboard";
import DoctorAppointments from "./doctor/DoctorAppointments";
import DoctorPatients from "./doctor/DoctorPatients";
import DoctorRecords from "./doctor/DoctorRecords";
import DoctorProfile from "./doctor/DoctorProfile";

const roleHome = {
  patient: "/patient",
  doctor: "/doctor",
  admin: "/",
};

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("smartcareUser")) || null;
  } catch {
    return null;
  }
}

function ProtectedRoute({ allowedRoles, children }) {
  const user = getUser();

  if (!user) return <Navigate to="/login" replace />;

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={roleHome[user.role] || "/login"} replace />;
  }

  return children;
}

function App() {
  const [ready, setReady] = useState(false);

  // App khulte hi backend se check karo ki cookie wala login sach mein valid hai ya nahi
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => {
        const u = data.user;
        localStorage.setItem(
          "smartcareUser",
          JSON.stringify({ name: u.name, email: u.email, role: u.role })
        );
      })
      .catch(() => {
        // Cookie nahi hai ya expire ho gayi: purana fake/stale login hata do
        localStorage.removeItem("smartcareUser");
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 text-muted">
        Loading...
      </div>
    );
  }

  const user = getUser();

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to={roleHome[user.role] || "/"} replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            user ? <Navigate to={roleHome[user.role] || "/"} replace /> : <Register />
          }
        />

        {/* ===== Patient portal (ek hi /patient route, layout ke andar 4 pages) ===== */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute allowedRoles={["patient"]}>

              <PatientLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<PatientDashboard />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="records" element={<PatientRecords />} />
          <Route path="profile" element={<PatientProfile />} />
          <Route path="ai" element={<PatientAI />} />
        </Route>

        {/* ===== Doctor ===== */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute allowedRoles={["doctor"]}>
              <DoctorLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="patients" element={<DoctorPatients />} />
          <Route path="records" element={<DoctorRecords />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>


        {/* ===== Admin ===== */}
        <Route
          path="/"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/patients" element={
          <ProtectedRoute allowedRoles={["admin"]}><Patients /></ProtectedRoute>
        } />

        <Route path="/doctors" element={
          <ProtectedRoute allowedRoles={["admin"]}><Doctors /></ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute allowedRoles={["admin"]}><Appointments /></ProtectedRoute>
        } />

        <Route path="/medical-records" element={
          <ProtectedRoute allowedRoles={["admin"]}><MedicalRecords /></ProtectedRoute>
        } />

        <Route path="/prescriptions" element={
          <ProtectedRoute allowedRoles={["admin"]}><Prescriptions /></ProtectedRoute>
        } />

        <Route path="/billing" element={
          <ProtectedRoute allowedRoles={["admin"]}><Billing /></ProtectedRoute>
        } />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/ai-assistant" element={
          <ProtectedRoute allowedRoles={["admin"]}><AIAssistant /></ProtectedRoute>
        } />

        {/* Koi bhi galat URL: login nahi hai to login page, hai to uska dashboard */}
        <Route
          path="*"
          element={<Navigate to={user ? roleHome[user.role] || "/" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;