import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

const getToken = () =>
  localStorage.getItem("token") ||
  localStorage.getItem("authToken") ||
  sessionStorage.getItem("token") ||
  sessionStorage.getItem("authToken") ||
  "";

const getUser = () => {
  try {
    const value =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const Assignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [baseFilter, setBaseFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] =
    useState("");

  const [form, setForm] = useState({
    baseId: "",
    equipmentTypeId: "",
    quantity: "",
    assignedTo: "",
  });

  const user = getUser();

  const canCreate =
    user?.role === "ADMIN" ||
    user?.role === "LOGISTICS_OFFICER";


  const fetchAssignments = async (
    baseId = baseFilter,
    equipmentTypeId = equipmentFilter
  ) => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login again.");
      }

      const params = new URLSearchParams();

      if (baseId) {
        params.append("baseId", baseId);
      }

      if (equipmentTypeId) {
        params.append(
          "equipmentTypeId",
          equipmentTypeId
        );
      }

      const query = params.toString();

      const response = await fetch(
        `${API}/assignments${
          query ? `?${query}` : ""
        }`,
        {
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
            "Failed to load assignments."
        );
      }

      setAssignments(data.assignments || []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchAssignments("", "");
  }, []);


  const bases = useMemo(() => {
    const map = new Map();

    assignments.forEach((item) => {
      if (item.baseId) {
        map.set(
          String(item.baseId),
          item.baseName
        );
      }
    });

    return [...map.entries()].map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [assignments]);


  const equipmentTypes = useMemo(() => {
    const map = new Map();

    assignments.forEach((item) => {
      if (item.equipmentTypeId) {
        map.set(
          String(item.equipmentTypeId),
          item.equipmentName
        );
      }
    });

    return [...map.entries()].map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [assignments]);


  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      const quantity = Number(form.quantity);

      if (
        !form.baseId ||
        !form.equipmentTypeId ||
        !form.quantity ||
        !form.assignedTo
      ) {
        throw new Error(
          "All fields are required."
        );
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          "Quantity must be a positive integer."
        );
      }

      const response = await fetch(
        `${API}/assignments`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            baseId: Number(form.baseId),
            equipmentTypeId: Number(
              form.equipmentTypeId
            ),
            quantity,
            assignedTo: form.assignedTo,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create assignment."
        );
      }

      setSuccess(
        "Assignment created successfully."
      );

      setForm({
        baseId: "",
        equipmentTypeId: "",
        quantity: "",
        assignedTo: "",
      });

      setShowForm(false);

      await fetchAssignments(
        baseFilter,
        equipmentFilter
      );
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };


  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };


  return (
    <div className="assignments-page">

      <div className="assignments-header">

        <div>
          <p className="assignments-eyebrow">
            ASSET MANAGEMENT
          </p>

          <h1>Assignments</h1>

          <p className="assignments-description">
            Track equipment assigned to personnel
            across military bases.
          </p>
        </div>

        <div className="assignments-header-actions">

          <button
            className="assignments-refresh"
            onClick={() =>
              fetchAssignments(
                baseFilter,
                equipmentFilter
              )
            }
            disabled={loading}
          >
            ↻ {loading ? "Refreshing..." : "Refresh"}
          </button>

          {canCreate && (
            <button
              className="assignments-add"
              onClick={() => {
                setShowForm(!showForm);
                setError("");
                setSuccess("");
              }}
            >
              {showForm
                ? "✕ Close"
                : "+ Create Assignment"}
            </button>
          )}

        </div>
      </div>


      {success && (
        <div className="assignments-success">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="assignments-error">
          {error}
        </div>
      )}


      {showForm && canCreate && (
        <section className="assignment-form-card">

          <div className="assignment-form-title">
            <h2>Create Assignment</h2>
            <p>
              Assign equipment to personnel.
            </p>
          </div>

          <form
            className="assignment-form"
            onSubmit={handleSubmit}
          >

            <div className="assignment-field">
              <label>Base *</label>

              <select
                name="baseId"
                value={form.baseId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Base
                </option>

                {bases.map((base) => (
                  <option
                    key={base.id}
                    value={base.id}
                  >
                    {base.name}
                  </option>
                ))}
              </select>
            </div>


            <div className="assignment-field">
              <label>Equipment *</label>

              <select
                name="equipmentTypeId"
                value={form.equipmentTypeId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select Equipment
                </option>

                {equipmentTypes.map(
                  (equipment) => (
                    <option
                      key={equipment.id}
                      value={equipment.id}
                    >
                      {equipment.name}
                    </option>
                  )
                )}
              </select>
            </div>


            <div className="assignment-field">
              <label>Quantity *</label>

              <input
                type="number"
                name="quantity"
                min="1"
                step="1"
                placeholder="Enter quantity"
                value={form.quantity}
                onChange={handleChange}
                required
              />
            </div>


            <div className="assignment-field">
              <label>Assigned To *</label>

              <input
                type="text"
                name="assignedTo"
                placeholder="Personnel name / ID"
                value={form.assignedTo}
                onChange={handleChange}
                required
              />
            </div>


            <div className="assignment-form-actions">

              <button
                type="button"
                className="assignment-cancel"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="assignment-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Assignment"}
              </button>

            </div>

          </form>
        </section>
      )}


      <section className="assignments-filter-card">

        <div className="assignments-filter">

          <div className="assignments-field">
            <label>Base</label>

            <select
              value={baseFilter}
              onChange={(e) =>
                setBaseFilter(e.target.value)
              }
            >
              <option value="">
                All Bases
              </option>

              {bases.map((base) => (
                <option
                  key={base.id}
                  value={base.id}
                >
                  {base.name}
                </option>
              ))}
            </select>
          </div>


          <div className="assignments-field">
            <label>Equipment</label>

            <select
              value={equipmentFilter}
              onChange={(e) =>
                setEquipmentFilter(
                  e.target.value
                )
              }
            >
              <option value="">
                All Equipment
              </option>

              {equipmentTypes.map(
                (equipment) => (
                  <option
                    key={equipment.id}
                    value={equipment.id}
                  >
                    {equipment.name}
                  </option>
                )
              )}
            </select>
          </div>


          <div className="assignments-filter-actions">

            <button
              className="assignments-apply"
              onClick={() =>
                fetchAssignments(
                  baseFilter,
                  equipmentFilter
                )
              }
            >
              Apply Filters
            </button>

            <button
              className="assignments-clear"
              onClick={() => {
                setBaseFilter("");
                setEquipmentFilter("");
                fetchAssignments("", "");
              }}
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      <section className="assignments-table-card">

        <div className="assignments-table-header">

          <div>
            <h2>Assignment History</h2>

            <p>
              {loading
                ? "Loading..."
                : `${assignments.length} assignment${
                    assignments.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>
          </div>

        </div>


        {loading ? (
          <div className="assignments-state">
            <div className="assignments-spinner" />
            <p>Loading assignments...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="assignments-state">
            <div className="assignments-empty-icon">
              👤
            </div>

            <strong>
              No assignments found.
            </strong>

            <p>
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="assignments-table-wrapper">

            <table className="assignments-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Base</th>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Assigned To</th>
                </tr>
              </thead>

              <tbody>

                {assignments.map((item) => (
                  <tr key={item.id}>

                    <td>
                      {formatDate(
                        item.assignedAt
                      )}
                    </td>

                    <td>
                      <strong>
                        {item.baseName}
                      </strong>

                      <small>
                        Base #{item.baseId}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {item.equipmentName}
                      </strong>
                    </td>

                    <td>
                      <span className="assignment-category">
                        {item.category}
                      </span>
                    </td>

                    <td>
                      <span className="assignment-quantity">
                        {item.quantity}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {item.assignedTo}
                      </strong>
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

export default Assignments;