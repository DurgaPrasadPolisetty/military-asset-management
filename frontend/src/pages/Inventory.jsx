import { useEffect, useMemo, useState } from "react";

const API_BASE_URL = "http://localhost:5000/api";

const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("authToken") ||
    sessionStorage.getItem("token") ||
    sessionStorage.getItem("authToken") ||
    ""
  );
};

const Inventory = () => {
  const [inventory, setInventory] = useState([]);

  const [baseId, setBaseId] = useState("");
  const [equipmentTypeId, setEquipmentTypeId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchInventory = async (filters = {}) => {
    setLoading(true);
    setError("");

    try {
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

      if (filters.startDate) {
        params.append(
          "startDate",
          filters.startDate
        );
      }

      if (filters.endDate) {
        params.append(
          "endDate",
          `${filters.endDate} 23:59:59`
        );
      }

      const query = params.toString();

      const endpoint = query
        ? `${API_BASE_URL}/assets/inventory?${query}`
        : `${API_BASE_URL}/assets/inventory`;

      const token = getToken();

      if (!token) {
        throw new Error(
          "Authentication token not found. Please login again."
        );
      }

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
            "Failed to load inventory."
        );
      }

      setInventory(data.inventory || []);

    } catch (err) {
      console.error("Inventory API error:", err);

      setInventory([]);

      setError(
        err.message ||
          "Unable to load inventory."
      );

    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchInventory();
  }, []);


  const bases = useMemo(() => {
    const map = new Map();

    inventory.forEach((item) => {
      if (item.baseId) {
        map.set(
          String(item.baseId),
          item.baseName
        );
      }
    });

    return Array.from(map.entries()).map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [inventory]);


  const equipmentTypes = useMemo(() => {
    const map = new Map();

    inventory.forEach((item) => {
      if (item.equipmentTypeId) {
        map.set(
          String(item.equipmentTypeId),
          item.equipmentName
        );
      }
    });

    return Array.from(map.entries()).map(
      ([id, name]) => ({
        id,
        name,
      })
    );
  }, [inventory]);


  const handleApplyFilters = () => {
    fetchInventory({
      baseId,
      equipmentTypeId,
      startDate,
      endDate,
    });
  };


  const handleClearFilters = () => {
    setBaseId("");
    setEquipmentTypeId("");
    setStartDate("");
    setEndDate("");

    fetchInventory();
  };


  const handleRefresh = () => {
    fetchInventory({
      baseId,
      equipmentTypeId,
      startDate,
      endDate,
    });
  };


  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };


  return (
    <div className="inventory-page">

      {/* HEADER */}

      <div className="inventory-header">

        <div>

          <p className="inventory-eyebrow">
            ASSET MANAGEMENT
          </p>

          <h1>
            Inventory
          </h1>

          <p className="inventory-description">
            View current asset balances across
            military bases.
          </p>

        </div>


        <button
          className="inventory-refresh"
          onClick={handleRefresh}
          disabled={loading}
        >
          ↻ {loading ? "Refreshing..." : "Refresh"}
        </button>

      </div>


      {/* FILTERS */}

      <section className="inventory-filter-card">

        <div className="inventory-filter">

          <div className="inventory-field">

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


          <div className="inventory-field">

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


          <div className="inventory-field">

            <label>
              From Date
            </label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
            />

          </div>


          <div className="inventory-field">

            <label>
              To Date
            </label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
            />

          </div>


          <div className="inventory-actions">

            <button
              className="inventory-apply"
              onClick={handleApplyFilters}
              disabled={loading}
            >
              Apply Filters
            </button>

            <button
              className="inventory-clear"
              onClick={handleClearFilters}
              disabled={loading}
            >
              Clear
            </button>

          </div>

        </div>

      </section>


      {/* ERROR */}

      {error && (
        <div className="inventory-error">
          {error}
        </div>
      )}


      {/* TABLE */}

      <section className="inventory-table-card">

        <div className="inventory-table-header">

          <div>

            <h2>
              Asset Inventory
            </h2>

            <p>
              {loading
                ? "Loading inventory..."
                : `${inventory.length} record${
                    inventory.length === 1
                      ? ""
                      : "s"
                  }`}
            </p>

          </div>

        </div>


        {/* LOADING */}

        {loading && (
          <div className="inventory-state">

            <div className="inventory-spinner"></div>

            <p>
              Loading inventory...
            </p>

          </div>
        )}


        {/* EMPTY */}

        {!loading &&
          inventory.length === 0 &&
          !error && (
            <div className="inventory-state">

              <div className="inventory-empty-icon">
                📦
              </div>

              <strong>
                No inventory records found.
              </strong>

              <p>
                Try changing your filters.
              </p>

            </div>
          )}


        {/* DATA */}

        {!loading &&
          inventory.length > 0 && (

            <div className="inventory-table-wrapper">

              <table className="inventory-table">

                <thead>

                  <tr>

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
                      Opening
                    </th>

                    <th>
                      Purchases
                    </th>

                    <th>
                      Transfers In
                    </th>

                    <th>
                      Transfers Out
                    </th>

                    <th>
                      Assigned
                    </th>

                    <th>
                      Expended
                    </th>

                    <th>
                      Closing Balance
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {inventory.map(
                    (item, index) => (

                      <tr
                        key={`${item.baseId}-${item.equipmentTypeId}-${index}`}
                      >

                        <td>

                          <div className="inventory-base-name">
                            {item.baseName}
                          </div>

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

                          <span className="inventory-category">
                            {item.category}
                          </span>

                        </td>


                        <td>
                          {formatNumber(
                            item.openingBalance
                          )}
                        </td>


                        <td className="inventory-positive">
                          +{formatNumber(
                            item.purchases
                          )}
                        </td>


                        <td className="inventory-positive">
                          +{formatNumber(
                            item.transfersIn
                          )}
                        </td>


                        <td className="inventory-negative">
                          -{formatNumber(
                            item.transfersOut
                          )}
                        </td>


                        <td>
                          {formatNumber(
                            item.assigned
                          )}
                        </td>


                        <td className="inventory-expended">
                          {formatNumber(
                            item.expended
                          )}
                        </td>


                        <td>

                          <span className="inventory-closing">
                            {formatNumber(
                              item.closingBalance
                            )}
                          </span>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}


        {!loading &&
          inventory.length > 0 && (

            <div className="inventory-table-footer">
              Inventory balances are calculated dynamically from
              purchases, transfers, assignments and expenditures.
            </div>

          )}

      </section>

    </div>
  );
};

export default Inventory;