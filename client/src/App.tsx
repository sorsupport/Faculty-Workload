import { Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { ProtectedRoute } from "./auth/ProtectedRoute";
import { NavBar } from "./components/NavBar";
import { LoginPage } from "./pages/Login";
import { RegisterPage } from "./pages/Register";
import { AdminDashboardPage } from "./pages/AdminDashboard";
import { UserDashboardPage } from "./pages/UserDashboard";
import { FacultyPage } from "./pages/Faculty";
import { CoursesPage } from "./pages/Courses";
import { TermsPage } from "./pages/Terms";
import { SectionsPage } from "./pages/Sections";
import { AssignmentsPage } from "./pages/Assignments";

function RoleDashboard() {
  const { user } = useAuth();
  return user?.role === "admin" ? <AdminDashboardPage /> : <UserDashboardPage />;
}

function AppShell() {
  return (
    <div className="app-shell">
      <NavBar />
      <main className="content">
        <Routes>
          <Route path="/" element={<RoleDashboard />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/sections" element={<SectionsPage />} />
          <Route path="/assignments" element={<AssignmentsPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
