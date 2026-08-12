import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  "";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);

  const [action, setAction] = useState("");
  const [userId, setUserId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLogs = async (filters = {}) => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login again.");
      }

      const params = new URLSearchParams();

      if (filters.action) {
        params.append("action", filters.action);
      }

      if (filters.userId) {
        params.append("userId", filters.userId);
      }

      if (filters.startDate) {
        params.append("startDate", filters.startDate);
      }

      if (filters.endDate) {
        params.append("endDate", filters.endDate);
      }

      const query = params.toString();

      const response = await fetch(
        `${API}/audit-logs${query ? `?${query}` : ""}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to load audit logs."
        );
      }

      setLogs(data.logs || []);

    } catch (err) {
      console.error("Audit logs error:", err);

      setLogs([]);
      setError(err.message);

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchLogs();
  }, []);


  const users = useMemo(() => {
    const map = new Map();

    logs.forEach((log) => {
      if (log.userId) {
        map.set(
          String(log.userId),
          log.username
        );
      }
    });

    return Array.from(map.entries()).map(
      ([id, username]) => ({
        id,
        username,
      })
    );
  }, [logs]);


  const handleApply = () => {
    fetchLogs({
      action,
      userId,
      startDate,
      endDate,
    });
  };


  const handleClear = () => {
    setAction("");
    setUserId("");
    setStartDate("");
    setEndDate("");

    fetchLogs();
  };


  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const getActionClass = (value) => {
    switch (value) {
      case "PURCHASE":
        return "audit-action purchase";

      case "TRANSFER":
        return "audit-action transfer";

      case "ASSIGNMENT":
        return "audit-action assignment";

      case "EXPENDITURE":
        return "audit-action expenditure";

      default:
        return "audit-action";
    }
  };


  return (
    <div className="audit-page">

      {/* HEADER */}

      <div className="audit-header">

        <div>

          <p className="audit-eyebrow">
            SECURITY & ACCOUNTABILITY
          </p>

          <h1>
            Audit Logs
          </h1>

          <p className="audit-description">
            Track system actions performed by
            authorized users.
          </p>

        </div>


        <button
          className="audit-refresh"
          onClick={() =>
            fetchLogs({
              action,
              userId,
              startDate,
              endDate,
            })
          }
          disabled={loading}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="audit-error">
          {error}
        </div>
      )}


      {/* FILTERS */}

      <section className="audit-filter-card">

        <div className="audit-filter">

          <div className="audit-field">

            <label>
              Action
            </label>

            <select
              value={action}
              onChange={(e) =>
                setAction(e.target.value)
              }
            >

              <option value="">
                All Actions
              </option>

              <option value="PURCHASE">
                Purchase
              </option>

              <option value="TRANSFER">
                Transfer
              </option>

              <option value="ASSIGNMENT">
                Assignment
              </option>

              <option value="EXPENDITURE">
                Expenditure
              </option>

            </select>

          </div>


          <div className="audit-field">

            <label>
              User
            </label>

            <select
              value={userId}
              onChange={(e) =>
                setUserId(e.target.value)
              }
            >

              <option value="">
                All Users
              </option>

              {users.map((user) => (
                <option
                  key={user.id}
                  value={user.id}
                >
                  {user.username}
                </option>
              ))}

            </select>

          </div>


          <div className="audit-field">

            <label>
              From
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />

          </div>


          <div className="audit-field">

            <label>
              To
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />

          </div>


          <div className="audit-filter-actions">

            <button
              className="audit-apply"
              onClick={handleApply}
              disabled={loading}
            >
              Apply
            </button>

            <button
              className="audit-clear"
              onClick={handleClear}
              disabled={loading}
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      {/* TABLE */}

      <section className="audit-table-card">

        <div className="audit-table-header">

          <div>

            <h2>
              Activity History
            </h2>

            <p>
              {loading
                ? "Loading audit logs..."
                : `${logs.length} log${
                    logs.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

        </div>


        {loading && (
          <div className="audit-state">

            <div className="audit-spinner" />

            <p>
              Loading audit history...
            </p>

          </div>
        )}


        {!loading &&
          logs.length === 0 &&
          !error && (

            <div className="audit-state">

              <div className="audit-empty-icon">
                ◷
              </div>

              <strong>
                No audit records found.
              </strong>

              <p>
                Try changing your filters.
              </p>

            </div>
          )}


        {!loading &&
          logs.length > 0 && (

            <div className="audit-table-wrapper">

              <table className="audit-table">

                <thead>

                  <tr>

                    <th>
                      Date & Time
                    </th>

                    <th>
                      User
                    </th>

                    <th>
                      Role
                    </th>

                    <th>
                      Base
                    </th>

                    <th>
                      Action
                    </th>

                    <th>
                      Details
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {logs.map((log) => (

                    <tr key={log.id}>

                      <td>
                        <span className="audit-date">
                          {formatDate(
                            log.createdAt
                          )}
                        </span>
                      </td>


                      <td>

                        <strong>
                          {log.username ||
                            "Unknown"}
                        </strong>

                        <small>
                          User #{log.userId}
                        </small>

                      </td>


                      <td>

                        <span className="audit-role">
                          {log.role}
                        </span>

                      </td>


                      <td>
                        {log.baseName || "Global"}
                      </td>


                      <td>

                        <span
                          className={getActionClass(
                            log.action
                          )}
                        >
                          {log.action}
                        </span>

                      </td>


                      <td>

                        <div className="audit-details">
                          {log.details}
                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

      </section>

    </div>
  );
};

export default AuditLogs;