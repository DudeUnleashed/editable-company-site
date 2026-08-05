import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { CacheProvider } from "./contexts/CacheContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ErrorBoundary from "./components/ErrorBoundary";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import DocumentHead from "./components/DocumentHead";
import Home from "./pages/Home";
import RequestService from "./pages/RequestService";
import About from "./pages/About";
import ServicesPage from "./pages/Services";
import Login from "./pages/Login";
import AdminDashboard from "./pages/admin/Admin";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminQuotes from "./pages/admin/AdminQuotes";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminCustomerDetail from "./pages/admin/AdminCustomerDetail";
import AdminCMS from "./pages/admin/AdminCMS";
import GoogleCalendarCallback from "./pages/admin/GoogleCalendarCallback";

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <CacheProvider>
          <DocumentHead />
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <Navbar />
          <main id="main-content">
          <Routes>
            <Route path="/" element={<ErrorBoundary><Home /></ErrorBoundary>} />
            <Route path="/services" element={<ErrorBoundary><ServicesPage /></ErrorBoundary>} />
            <Route path="/service" element={<ErrorBoundary><RequestService /></ErrorBoundary>} />
            <Route path="/about" element={<ErrorBoundary><About /></ErrorBoundary>} />
            <Route path="/login" element={<ErrorBoundary><Login /></ErrorBoundary>} />

            {/* Protected Admin routes - require authentication and admin role */}
            <Route
              path="/admin"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/calendar"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminCalendar />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/quotes"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminQuotes />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/google-callback"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <GoogleCalendarCallback />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/customers"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminCustomers />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/customers/:id"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminCustomerDetail />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
            <Route
              path="/admin/cms"
              element={
                <ErrorBoundary>
                  <ProtectedRoute requireAdmin={true}>
                    <AdminCMS />
                  </ProtectedRoute>
                </ErrorBoundary>
              }
            />
          </Routes>
          </main>
          <Footer />
          </CacheProvider>
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
