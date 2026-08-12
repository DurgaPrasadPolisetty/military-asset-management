import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";


const Sidebar = () => {

  const {
    user,
    logout,
  } = useAuth();


  const menuItems = [

    {
      label: "Dashboard",
      path: "/dashboard",
      icon: "▣",
    },

    {
      label: "Inventory",
      path: "/inventory",
      icon: "◫",
    },

    {
      label: "Purchases",
      path: "/purchases",
      icon: "＋",
    },

    {
      label: "Transfers",
      path: "/transfers",
      icon: "⇄",
    },

    {
      label: "Assignments",
      path: "/assignments",
      icon: "◉",
    },

    {
      label: "Expenditures",
      path: "/expenditures",
      icon: "−",
    },

    {
      label: "Audit Logs",
      path: "/audit-logs",
      icon: "≡",
    },

  ];


  return (

    <aside className="sidebar">

      {/* ==========================================
          BRAND
      ========================================== */}

      <div className="sidebar-brand">

        <div className="sidebar-logo">
          🛡️
        </div>

        <div className="sidebar-brand-text">

          <h2>
            MAM
          </h2>

          <span>
            Asset Management
          </span>

        </div>

      </div>


      {/* ==========================================
          NAVIGATION
      ========================================== */}

      <nav className="sidebar-nav">

        {menuItems.map((item) => (

          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `sidebar-link ${
                isActive ? "active" : ""
              }`
            }
          >

            <span className="sidebar-icon">
              {item.icon}
            </span>

            <span className="sidebar-link-text">
              {item.label}
            </span>

          </NavLink>

        ))}

      </nav>


      {/* ==========================================
          USER SECTION
      ========================================== */}

      <div className="sidebar-bottom">

        <div className="sidebar-user">

          <div className="user-avatar">

            {user?.username
              ?.charAt(0)
              .toUpperCase() || "U"}

          </div>


          <div className="user-info">

            <strong>
              {user?.username || "User"}
            </strong>

            <span>
              {user?.role || "USER"}
            </span>

          </div>

        </div>


        <button
          className="sidebar-logout"
          onClick={logout}
        >
          ⇥ Logout
        </button>

      </div>

    </aside>

  );
};


export default Sidebar;