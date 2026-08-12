import { useEffect, useMemo, useState } from "react";

const API =
  "https://military-asset-management-api-fojk.onrender.com/api";

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

const Expenditures = () => {
  const [expenditures, setExpenditures] =
    useState([]);

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
    reason: "",
  });

  const user = getUser();

  const canCreate =
    user?.role === "ADMIN" ||
    user?.role === "LOGISTICS_OFFICER";


  const fetchExpenditures = async (
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
        `${API}/expenditures${
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
            "Failed to load expenditures."
        );
      }

      setExpenditures(
        data.expenditures || []
      );
    } catch (err) {
      console.error(err);
      setExpenditures([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchExpenditures("", "");
  }, []);


  const bases = useMemo(() => {
    const map = new Map();

    expenditures.forEach((item) => {
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
  }, [expenditures]);


  const equipmentTypes = useMemo(() => {
    const map = new Map();

    expenditures.forEach((item) => {
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
  }, [expenditures]);


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
        !form.reason
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
        `${API}/expenditures`,
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
            reason: form.reason,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to record expenditure."
        );
      }

      setSuccess(
        "Expenditure recorded successfully."
      );

      setForm({
        baseId: "",
        equipmentTypeId: "",
        quantity: "",
        reason: "",
      });

      setShowForm(false);

      await fetchExpenditures(
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
    <div className="expenditures-page">

      <div className="expenditures-header">

        <div>

          <p className="expenditures-eyebrow">
            ASSET MANAGEMENT
          </p>

          <h1>Expenditures</h1>

          <p className="expenditures-description">
            Record and review assets consumed,
            damaged or otherwise expended.
          </p>

        </div>


        <div className="expenditures-header-actions">

          <button
            className="expenditures-refresh"
            onClick={() =>
              fetchExpenditures(
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
              className="expenditures-add"
              onClick={() => {
                setShowForm(!showForm);
                setError("");
                setSuccess("");
              }}
            >
              {showForm
                ? "✕ Close"
                : "+ Record Expenditure"}
            </button>
          )}

        </div>

      </div>


      {success && (
        <div className="expenditures-success">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="expenditures-error">
          {error}
        </div>
      )}


      {showForm && canCreate && (
        <section className="expenditure-form-card">

          <div className="expenditure-form-title">
            <h2>Record Expenditure</h2>

            <p>
              Record equipment that has been
              consumed, damaged or lost.
            </p>
          </div>


          <form
            className="expenditure-form"
            onSubmit={handleSubmit}
          >

            <div className="expenditure-field">

              <label>
                Base *
              </label>

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


            <div className="expenditure-field">

              <label>
                Equipment *
              </label>

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


            <div className="expenditure-field">

              <label>
                Quantity *
              </label>

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


            <div className="expenditure-field">

              <label>
                Reason *
              </label>

              <input
                type="text"
                name="reason"
                placeholder="Consumed / Damaged / Lost"
                value={form.reason}
                onChange={handleChange}
                required
              />

            </div>


            <div className="expenditure-form-actions">

              <button
                type="button"
                className="expenditure-cancel"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                type="submit"
                className="expenditure-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Expenditure"}
              </button>

            </div>

          </form>

        </section>
      )}


      <section className="expenditures-filter-card">

        <div className="expenditures-filter">

          <div className="expenditures-field">

            <label>
              Base
            </label>

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


          <div className="expenditures-field">

            <label>
              Equipment
            </label>

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


          <div className="expenditures-filter-actions">

            <button
              className="expenditures-apply"
              onClick={() =>
                fetchExpenditures(
                  baseFilter,
                  equipmentFilter
                )
              }
            >
              Apply Filters
            </button>

            <button
              className="expenditures-clear"
              onClick={() => {
                setBaseFilter("");
                setEquipmentFilter("");
                fetchExpenditures("", "");
              }}
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      <section className="expenditures-table-card">

        <div className="expenditures-table-header">

          <div>

            <h2>
              Expenditure History
            </h2>

            <p>
              {loading
                ? "Loading..."
                : `${expenditures.length} expenditure${
                    expenditures.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

        </div>


        {loading ? (
          <div className="expenditures-state">

            <div className="expenditures-spinner" />

            <p>
              Loading expenditures...
            </p>

          </div>
        ) : expenditures.length === 0 ? (
          <div className="expenditures-state">

            <div className="expenditures-empty-icon">
              📉
            </div>

            <strong>
              No expenditures found.
            </strong>

            <p>
              Try changing your filters.
            </p>

          </div>
        ) : (
          <div className="expenditures-table-wrapper">

            <table className="expenditures-table">

              <thead>

                <tr>
                  <th>Date</th>
                  <th>Base</th>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Reason</th>
                </tr>

              </thead>

              <tbody>

                {expenditures.map(
                  (item) => (

                    <tr key={item.id}>

                      <td>
                        {formatDate(
                          item.expendedAt
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

                        <span className="expenditure-category">
                          {item.category}
                        </span>

                      </td>

                      <td>

                        <span className="expenditure-quantity">
                          -{item.quantity}
                        </span>

                      </td>

                      <td>
                        {item.reason}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </section>

    </div>
  );
};

export default Expenditures;