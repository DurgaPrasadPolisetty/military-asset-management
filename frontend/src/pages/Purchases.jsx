import { useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  "https://military-asset-management-api-fojk.onrender.com/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
};

const getUser = () => {
  try {
    const stored =
      localStorage.getItem("user") ||
      sessionStorage.getItem("user");

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);

  const [baseId, setBaseId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    baseId: "",
    equipmentTypeId: "",
    quantity: "",
    purchaseDate: "",
  });

  const user = getUser();

  const canCreatePurchase =
    user?.role === "ADMIN" ||
    user?.role === "LOGISTICS_OFFICER";


  // =====================================================
  // GET PURCHASES
  // =====================================================

  const fetchPurchases = async (filters = {}) => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      const params = new URLSearchParams();

      if (filters.baseId) {
        params.append("baseId", filters.baseId);
      }

      if (filters.equipmentTypeId) {
        params.append(
          "equipmentTypeId",
          filters.equipmentTypeId
        );
      }

      const query = params.toString();

      const endpoint = query
        ? `${API_BASE_URL}/purchases?${query}`
        : `${API_BASE_URL}/purchases`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to retrieve purchases."
        );
      }

      setPurchases(data.purchases || []);

    } catch (err) {
      console.error("Purchases error:", err);

      setPurchases([]);

      setError(
        err.message ||
          "Unable to load purchases."
      );

    } finally {
      setLoading(false);
    }
  };


  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchPurchases();
  }, []);


  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const bases = useMemo(() => {
    const map = new Map();

    purchases.forEach((purchase) => {
      if (purchase.baseId) {
        map.set(
          String(purchase.baseId),
          purchase.baseName
        );
      }
    });

    return Array.from(map.entries()).map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [purchases]);


  const equipmentTypes = useMemo(() => {
    const map = new Map();

    purchases.forEach((purchase) => {
      if (purchase.equipmentTypeId) {
        map.set(
          String(purchase.equipmentTypeId),
          purchase.equipmentName
        );
      }
    });

    return Array.from(map.entries()).map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [purchases]);


  // =====================================================
  // APPLY FILTERS
  // =====================================================

  const handleApplyFilters = () => {
    fetchPurchases({
      baseId,
      equipmentTypeId,
    });
  };


  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const handleClearFilters = () => {
    setBaseId("");
    setEquipmentTypeId("");

    fetchPurchases();
  };


  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };


  // =====================================================
  // CREATE PURCHASE
  // =====================================================

  const handleCreatePurchase = async (e) => {
    e.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

      if (
        !form.baseId ||
        !form.equipmentTypeId ||
        !form.quantity
      ) {
        throw new Error(
          "Base, equipment type and quantity are required."
        );
      }

      const quantity = Number(form.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new Error(
          "Quantity must be a positive integer."
        );
      }

      const response = await fetch(
        `${API_BASE_URL}/purchases`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            baseId: Number(form.baseId),

            equipmentTypeId:
              Number(form.equipmentTypeId),

            quantity,

            purchaseDate:
              form.purchaseDate || null,
          }),
        }
      );

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("application/json")) {
        throw new Error(
          `Server returned ${response.status} instead of JSON.`
        );
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            data.error ||
            "Failed to create purchase."
        );
      }

      setSuccess(
        "Purchase recorded successfully."
      );

      setForm({
        baseId: "",
        equipmentTypeId: "",
        quantity: "",
        purchaseDate: "",
      });

      setShowForm(false);

      await fetchPurchases({
        baseId,
        equipmentTypeId,
      });

    } catch (err) {
      console.error(
        "Create purchase error:",
        err
      );

      setError(
        err.message ||
          "Failed to create purchase."
      );

    } finally {
      setSaving(false);
    }
  };


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };


  // =====================================================
  // FORMAT NUMBER
  // =====================================================

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString(
      "en-IN"
    );
  };


  return (
    <div className="purchases-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="purchases-header">

        <div>

          <p className="purchases-eyebrow">
            ASSET MANAGEMENT
          </p>

          <h1>
            Purchases
          </h1>

          <p className="purchases-description">
            Record and review equipment purchases
            across military bases.
          </p>

        </div>


        <div className="purchases-header-actions">

          <button
            className="purchases-refresh"
            onClick={() =>
              fetchPurchases({
                baseId,
                equipmentTypeId,
              })
            }
            disabled={loading}
          >
            ↻ {loading ? "Refreshing..." : "Refresh"}
          </button>


          {canCreatePurchase && (
            <button
              className="purchases-add"
              onClick={() => {
                setShowForm((previous) => !previous);
                setError("");
                setSuccess("");
              }}
            >
              {showForm
                ? "✕ Close"
                : "+ Record Purchase"}
            </button>
          )}

        </div>

      </div>


      {/* =================================================
          SUCCESS
      ================================================= */}

      {success && (
        <div className="purchases-success">
          ✓ {success}
        </div>
      )}


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="purchases-error">
          {error}
        </div>
      )}


      {/* =================================================
          CREATE FORM
      ================================================= */}

      {showForm && canCreatePurchase && (

        <section className="purchase-form-card">

          <div className="purchase-form-header">

            <div>
              <h2>
                Record Purchase
              </h2>

              <p>
                Add a new equipment purchase
                to the inventory.
              </p>
            </div>

          </div>


          <form
            className="purchase-form"
            onSubmit={handleCreatePurchase}
          >

            <div className="purchase-field">

              <label>
                Base *
              </label>

              <select
                name="baseId"
                value={form.baseId}
                onChange={handleFormChange}
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

                {/* Fallback seeded bases */}

                {bases.length === 0 && (
                  <>
                    <option value="1">
                      Fort Alpha
                    </option>

                    <option value="2">
                      Fort Bravo
                    </option>
                  </>
                )}

              </select>

            </div>


            <div className="purchase-field">

              <label>
                Equipment Type *
              </label>

              <select
                name="equipmentTypeId"
                value={form.equipmentTypeId}
                onChange={handleFormChange}
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

                {equipmentTypes.length === 0 && (
                  <>
                    <option value="1">
                      M4 Carbine
                    </option>

                    <option value="2">
                      5.56mm Ammunition
                    </option>

                    <option value="3">
                      Humvee
                    </option>
                  </>
                )}

              </select>

            </div>


            <div className="purchase-field">

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
                onChange={handleFormChange}
                required
              />

            </div>


            <div className="purchase-field">

              <label>
                Purchase Date
              </label>

              <input
                type="date"
                name="purchaseDate"
                value={form.purchaseDate}
                onChange={handleFormChange}
              />

            </div>


            <div className="purchase-form-actions">

              <button
                type="button"
                className="purchase-cancel"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
                disabled={saving}
              >
                Cancel
              </button>


              <button
                type="submit"
                className="purchase-submit"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : "Save Purchase"}
              </button>

            </div>

          </form>

        </section>

      )}


      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="purchases-filter-card">

        <div className="purchases-filter">

          <div className="purchases-field">

            <label>
              Base
            </label>

            <select
              value={baseId}
              onChange={(e) =>
                setBaseId(e.target.value)
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


          <div className="purchases-field">

            <label>
              Equipment
            </label>

            <select
              value={equipmentTypeId}
              onChange={(e) =>
                setEquipmentTypeId(
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


          <div className="purchases-filter-actions">

            <button
              className="purchases-apply"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              Apply Filters
            </button>

            <button
              className="purchases-clear"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      {/* =================================================
          PURCHASE TABLE
      ================================================= */}

      <section className="purchases-table-card">

        <div className="purchases-table-header">

          <div>

            <h2>
              Purchase History
            </h2>

            <p>
              {loading
                ? "Loading purchases..."
                : `${purchases.length} purchase${
                    purchases.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

        </div>


        {loading && (
          <div className="purchases-state">

            <div className="purchases-spinner"></div>

            <p>
              Loading purchase history...
            </p>

          </div>
        )}


        {!loading &&
          purchases.length === 0 &&
          !error && (

            <div className="purchases-state">

              <div className="purchases-empty-icon">
                🧾
              </div>

              <strong>
                No purchases found.
              </strong>

              <p>
                Try changing your filters.
              </p>

            </div>
          )}


        {!loading &&
          purchases.length > 0 && (

            <div className="purchases-table-wrapper">

              <table className="purchases-table">

                <thead>

                  <tr>

                    <th>
                      Date
                    </th>

                    <th>
                      Base
                    </th>

                    <th>
                      Equipment
                    </th>

                    <th>
                      Category
                    </th>

                    <th>
                      Quantity
                    </th>

                    <th>
                      Created By
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {purchases.map(
                    (purchase) => (

                      <tr
                        key={purchase.id}
                      >

                        <td>
                          <span className="purchase-date">
                            {formatDate(
                              purchase.purchaseDate
                            )}
                          </span>
                        </td>


                        <td>

                          <div className="purchase-base">
                            {purchase.baseName}
                          </div>

                          <small>
                            Base #{purchase.baseId}
                          </small>

                        </td>


                        <td>

                          <strong>
                            {purchase.equipmentName}
                          </strong>

                        </td>


                        <td>

                          <span className="purchase-category">
                            {purchase.category}
                          </span>

                        </td>


                        <td>

                          <span className="purchase-quantity">
                            +{formatNumber(
                              purchase.quantity
                            )}
                          </span>

                        </td>


                        <td>

                          <div className="purchase-user">
                            {purchase.createdByUsername ||
                              "—"}
                          </div>

                          {purchase.createdBy && (
                            <small>
                              User #{purchase.createdBy}
                            </small>
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


        {!loading &&
          purchases.length > 0 && (

            <div className="purchases-table-footer">
              All purchase records are retrieved
              directly from PostgreSQL.
            </div>

          )}

      </section>

    </div>
  );
};

export default Purchases;