# 🪖 Military Asset Management System

A full-stack, role-based web application for managing and tracking military assets across multiple bases.

The system provides centralized visibility into asset inventory, purchases, transfers, assignments, expenditures, and audit activities while enforcing role-based and base-level access control.

---

## 📌 Project Overview

The **Military Asset Management System** is designed to maintain accurate, secure, and auditable records of military assets across multiple bases.

The application allows authorized personnel to:

- Monitor asset inventory
- Record asset purchases
- Transfer assets between bases
- Assign assets to personnel or units
- Record asset expenditures
- Track asset movement
- Maintain audit logs
- View inventory metrics through a dashboard
- Apply base and equipment filters
- Enforce role-based access control

The system follows a transaction-based inventory calculation model to maintain accurate asset balances.

### Inventory Calculation

```text
Closing Balance
=
Opening Balance
+ Purchases
+ Transfers In
- Transfers Out
- Assigned
- Expended
