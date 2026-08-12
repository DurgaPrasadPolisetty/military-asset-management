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

export default function Transfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [baseFilter, setBaseFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    sourceBaseId: "",
    destinationBaseId: "",
    equipmentTypeId: "",
    quantity: "",
  });

  const user = getUser();

  const canCreate =
    user?.role === "ADMIN" ||
    user?.role === "LOGISTICS_OFFICER";

  // =========================================
  // GET TRANSFERS
  // =========================================

  const fetchTransfers = async (
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
        params.append("equipmentTypeId", equipmentTypeId);
      }

      const query = params.toString();

      const response = await fetch(
        `${API}/transfers${query ? `?${query}` : ""}`,
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
          data.message || "Failed to load transfers."
        );
      }

      setTransfers(data.transfers || []);
    } catch (err) {
      console.error(err);
      setTransfers([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers("", "");
  }, []);

  // =========================================
  // OPTIONS FROM EXISTING DATA
  // =========================================

  const bases = useMemo(() => {
    const map = new Map();

    transfers.forEach((item) => {
      map.set(
        String(item.sourceBaseId),
        item.sourceBaseName
      );

      map.set(
        String(item.destinationBaseId),
        item.destinationBaseName
      );
    });

    return [...map.entries()].map(([id, name]) => ({
      id,
      name,
    }));
  }, [transfers]);

  const equipmentTypes = useMemo(() => {
    const map = new Map();

    transfers.forEach((item) => {
      map.set(
        String(item.equipmentTypeId),
        item.equipmentName
      );
    });

    return [...map.entries()].map(([id, name]) => ({
      id,
      name,
    }));
  }, [transfers]);

  // =========================================
  // FORM CHANGE
  // =========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // =========================================
  // CREATE TRANSFER
  // =========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error("Please login again.");
      }

      const quantity = Number(form.quantity);

      if (
        !form.sourceBaseId ||
        !form.destinationBaseId ||
        !form.equipmentTypeId ||
        !quantity
      ) {
        throw new Error(
          "All fields are required."
        );
      }

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(
          "Quantity must be a positive integer."
        );
      }

      if (
        form.sourceBaseId ===
        form.destinationBaseId
      ) {
        throw new Error(
          "Source and destination must be different."
        );
      }

      const response = await fetch(
        `${API}/transfers`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            sourceBaseId: Number(
              form.sourceBaseId
            ),
            destinationBaseId: Number(
              form.destinationBaseId
            ),
            equipmentTypeId: Number(
              form.equipmentTypeId
            ),
            quantity,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Failed to create transfer."
        );
      }

      setSuccess(
        "Transfer completed successfully."
      );

      setForm({
        sourceBaseId: "",
        destinationBaseId: "",
        equipmentTypeId: "",
        quantity: "",
      });

      setShowForm(false);

      await fetchTransfers(
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

  // =========================================
  // DATE
  // =========================================

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
    <div className="transfers-page">

      {/* HEADER */}

      <div className="transfers-header">

        <div>
          <p className="transfers-eyebrow">
            ASSET MOVEMENT
          </p>

          <h1>Transfers</h1>

          <p className="transfers-description">
            Transfer equipment between military
            bases and review transfer history.
          </p>
        </div>

        <div className="transfers-header-actions">

          <button
            className="transfers-refresh"
            onClick={() =>
              fetchTransfers(
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
              className="transfers-add"
              onClick={() => {
                setShowForm(!showForm);
                setError("");
                setSuccess("");
              }}
            >
              {showForm
                ? "✕ Close"
                : "+ Create Transfer"}
            </button>
          )}

        </div>
      </div>

      {/* MESSAGES */}

      {success && (
        <div className="transfers-success">
          ✓ {success}
        </div>
      )}

      {error && (
        <div className="transfers-error">
          {error}
        </div>
      )}

      {/* CREATE FORM */}

      {showForm && canCreate && (
        <section className="transfer-form-card">

          <div className="transfer-form-title">
            <h2>Create Transfer</h2>
            <p>
              Move equipment from one base to
              another.
            </p>
          </div>

          <form
            className="transfer-form"
            onSubmit={handleSubmit}
          >

            <div className="transfer-field">
              <label>Source Base *</label>

              <select
                name="sourceBaseId"
                value={form.sourceBaseId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select source base
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

            <div className="transfer-field">
              <label>Destination Base *</label>

              <select
                name="destinationBaseId"
                value={form.destinationBaseId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select destination base
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

            <div className="transfer-field">
              <label>Equipment *</label>

              <select
                name="equipmentTypeId"
                value={form.equipmentTypeId}
                onChange={handleChange}
                required
              >
                <option value="">
                  Select equipment
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

            <div className="transfer-field">
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

            <div className="transfer-form-actions">

              <button
                type="button"
                className="transfer-cancel"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="transfer-submit"
                disabled={saving}
              >
                {saving
                  ? "Processing..."
                  : "Complete Transfer"}
              </button>

            </div>

          </form>
        </section>
      )}

      {/* FILTERS */}

      <section className="transfers-filter-card">

        <div className="transfers-filter">

          <div className="transfers-field">
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

          <div className="transfers-field">
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

          <div className="transfers-filter-actions">

            <button
              className="transfers-apply"
              onClick={() =>
                fetchTransfers(
                  baseFilter,
                  equipmentFilter
                )
              }
            >
              Apply Filters
            </button>

            <button
              className="transfers-clear"
              onClick={() => {
                setBaseFilter("");
                setEquipmentFilter("");
                fetchTransfers("", "");
              }}
            >
              Clear
            </button>

          </div>

        </div>

      </section>

      {/* TABLE */}

      <section className="transfers-table-card">

        <div className="transfers-table-header">

          <div>
            <h2>Transfer History</h2>

            <p>
              {loading
                ? "Loading transfers..."
                : `${transfers.length} transfer${
                    transfers.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>
          </div>

        </div>

        {loading ? (
          <div className="transfers-state">
            <div className="transfers-spinner" />
            <p>
              Loading transfer history...
            </p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="transfers-state">
            <div className="transfers-empty-icon">
              ⇄
            </div>

            <strong>
              No transfers found.
            </strong>

            <p>
              Try changing your filters.
            </p>
          </div>
        ) : (
          <div className="transfers-table-wrapper">

            <table className="transfers-table">

              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source Base</th>
                  <th>Destination Base</th>
                  <th>Equipment</th>
                  <th>Category</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Initiated By</th>
                </tr>
              </thead>

              <tbody>

                {transfers.map((transfer) => (
                  <tr key={transfer.id}>

                    <td>
                      {formatDate(
                        transfer.timestamp
                      )}
                    </td>

                    <td>
                      <strong>
                        {transfer.sourceBaseName}
                      </strong>

                      <small>
                        Base #
                        {transfer.sourceBaseId}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {
                          transfer.destinationBaseName
                        }
                      </strong>

                      <small>
                        Base #
                        {transfer.destinationBaseId}
                      </small>
                    </td>

                    <td>
                      <strong>
                        {transfer.equipmentName}
                      </strong>
                    </td>

                    <td>
                      <span className="transfer-category">
                        {transfer.category}
                      </span>
                    </td>

                    <td>
                      <span className="transfer-quantity">
                        {transfer.quantity}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`transfer-status ${
                          transfer.status ===
                          "COMPLETED"
                            ? "completed"
                            : ""
                        }`}
                      >
                        {transfer.status}
                      </span>
                    </td>

                    <td>
                      <strong>
                        {
                          transfer.initiatedByUsername
                        }
                      </strong>

                      <small>
                        User #
                        {transfer.initiatedBy}
                      </small>
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
}