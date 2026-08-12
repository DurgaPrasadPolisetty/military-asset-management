import "./App.css";

import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  AuthProvider,
  useAuth,
} from "./context/AuthContext";

import { apiRequest } from "./services/api";

import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
import Inventory from "./pages/Inventory";
import Purchases from "./pages/Purchases";
import Transfers from "./pages/Transfers";
import AuditLogs from "./pages/AuditLogs";
import Assignments from "./pages/Assignments";
import Expenditures from "./pages/Expenditures";


// =====================================================
// PROTECTED ROUTE
// =====================================================

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


// =====================================================
// APPLICATION LAYOUT
// =====================================================

const AppLayout = ({ children }) => {
  return (
    <div className="app-layout">

      <Sidebar />

      <main className="app-main">
        {children}
      </main>

    </div>
  );
};


// =====================================================
// DASHBOARD
// =====================================================

const Dashboard = () => {
  const { user } = useAuth();

  const [metrics, setMetrics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [baseId, setBaseId] = useState("");


  // ---------------------------------------------------
  // LOAD DASHBOARD
  // ---------------------------------------------------

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const endpoint = baseId
        ? `/assets/dashboard?baseId=${baseId}`
        : "/assets/dashboard";

      const data = await apiRequest(endpoint);

      setMetrics(data.metrics);

    } catch (error) {
      console.error("Dashboard error:", error);

      setError(
        error.message || "Failed to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  };


  // ---------------------------------------------------
  // LOAD ON PAGE / FILTER CHANGE
  // ---------------------------------------------------

  useEffect(() => {
    loadDashboard();
  }, [baseId]);


  return (
    <div className="dashboard">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="dashboard-header">

        <div>

          <p className="dashboard-label">
            MILITARY ASSET MANAGEMENT
          </p>

          <h1>Dashboard</h1>

          <p>
            Welcome back{" "}
            <strong>{user?.username}</strong>
          </p>

        </div>

      </header>


      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="filters">

        <div>

          <label htmlFor="base">
            Base
          </label>

          <select
            id="base"
            value={baseId}
            onChange={(e) =>
              setBaseId(e.target.value)
            }
          >

            <option value="">
              All Bases
            </option>

            <option value="1">
              Fort Alpha
            </option>

            <option value="2">
              Fort Bravo
            </option>

          </select>

        </div>


        <button
          className="refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          ↻ {loading ? "Loading..." : "Refresh"}
        </button>

      </section>


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}


      {/* =================================================
          LOADING
      ================================================= */}

      {loading && (
        <div className="loading">
          Loading dashboard...
        </div>
      )}


      {/* =================================================
          METRICS
      ================================================= */}

      {!loading && metrics && (
        <>

          <section className="metrics-grid">

            {/* Opening Balance */}

            <div className="metric-card">

              <span>
                Opening Balance
              </span>

              <strong>
                {metrics.openingBalance ?? 0}
              </strong>

            </div>


            {/* Purchases */}

            <div className="metric-card">

              <span>
                Purchases
              </span>

              <strong>
                +{metrics.purchases ?? 0}
              </strong>

            </div>


            {/* Transfers In */}

            <div className="metric-card">

              <span>
                Transfers In
              </span>

              <strong>
                +{metrics.transfersIn ?? 0}
              </strong>

            </div>


            {/* Transfers Out */}

            <div className="metric-card">

              <span>
                Transfers Out
              </span>

              <strong>
                -{metrics.transfersOut ?? 0}
              </strong>

            </div>


            {/* Net Movement */}

            <div className="metric-card">

              <span>
                Net Movement
              </span>

              <strong>
                {metrics.netMovement ?? 0}
              </strong>

            </div>


            {/* Assigned */}

            <div className="metric-card">

              <span>
                Assigned
              </span>

              <strong>
                {metrics.assigned ?? 0}
              </strong>

            </div>


            {/* Expended */}

            <div className="metric-card">

              <span>
                Expended
              </span>

              <strong>
                {metrics.expended ?? 0}
              </strong>

            </div>


            {/* Closing Balance */}

            <div className="metric-card closing-card">

              <span>
                Closing Balance
              </span>

              <strong>
                {metrics.closingBalance ?? 0}
              </strong>

            </div>

          </section>


          {/* =================================================
              INVENTORY MOVEMENT
          ================================================= */}

          <section className="movement-card">

            <div>

              <p>
                Inventory Movement
              </p>

              <h2>
                {metrics.netMovement ?? 0}
              </h2>

            </div>


            <div className="movement-breakdown">

              <div>

                <span>
                  Purchases
                </span>

                <strong>
                  +{metrics.purchases ?? 0}
                </strong>

              </div>


              <div>

                <span>
                  Transfers In
                </span>

                <strong>
                  +{metrics.transfersIn ?? 0}
                </strong>

              </div>


              <div>

                <span>
                  Transfers Out
                </span>

                <strong>
                  -{metrics.transfersOut ?? 0}
                </strong>

              </div>

            </div>

          </section>

        </>
      )}

    </div>
  );
};


// =====================================================
// TEMPORARY PAGE COMPONENT
// =====================================================
// These prevent blank pages when clicking sidebar links.
// We'll replace them with real pages one by one.
// =====================================================

const ComingSoon = ({ title }) => {

  return (
    <div className="placeholder-page">

      <div className="placeholder-card">

        <div className="placeholder-icon">
          🛡️
        </div>

        <h1>
          {title}
        </h1>

        <p>
          This module is being connected to the
          Military Asset Management system.
        </p>

      </div>

    </div>
  );
};


// =====================================================
// APP
// =====================================================

function App() {

  return (
    <AuthProvider>

      <BrowserRouter>

        <Routes>

          {/* ==========================================
              LOGIN
          ========================================== */}

          <Route
            path="/login"
            element={<Login />}
          />


          {/* ==========================================
              DASHBOARD
          ========================================== */}

          <Route
            path="/dashboard"
            element={

              <ProtectedRoute>

                <AppLayout>

                  <Dashboard />

                </AppLayout>

              </ProtectedRoute>

            }
          />


          {/* ==========================================
              INVENTORY
          ========================================== */}

          <Route
  path="/inventory"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Inventory />
      </AppLayout>
    </ProtectedRoute>
  }
/>


          {/* ==========================================
              PURCHASES
          ========================================== */}

          <Route
  path="/purchases"
  element={
    <ProtectedRoute>
      <AppLayout>
        <Purchases />
      </AppLayout>
    </ProtectedRoute>
  }
/>


          {/* ==========================================
              TRANSFERS
          ========================================== */}

          <Route
            path="/transfers"
            element={

              <ProtectedRoute>

                <AppLayout>

                  <Transfers />

                </AppLayout>

              </ProtectedRoute>

            }
          />


          {/* ==========================================
              ASSIGNMENTS
          ========================================== */}

          <Route
            path="/assignments"
            element={

              <ProtectedRoute>

                <AppLayout>

                  <Assignments/>

                </AppLayout>

              </ProtectedRoute>

            }
          />


          {/* ==========================================
              EXPENDITURES
          ========================================== */}

          <Route
            path="/expenditures"
            element={

              <ProtectedRoute>

                <AppLayout>

                  <Expenditures />

                </AppLayout>

              </ProtectedRoute>

            }
          />


          {/* ==========================================
              AUDIT LOGS
          ========================================== */}

          <Route
            path="/audit-logs"
            element={

              <ProtectedRoute>

                <AppLayout>

                  <AuditLogs />

                </AppLayout>

              </ProtectedRoute>

            }
          />


          {/* ==========================================
              DEFAULT
          ========================================== */}

          <Route
            path="/"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />


          {/* ==========================================
              UNKNOWN ROUTE
          ========================================== */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

        </Routes>

      </BrowserRouter>

    </AuthProvider>
  );
}


export default App;