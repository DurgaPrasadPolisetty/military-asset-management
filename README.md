# Military Asset Management System

A full-stack, role-based web application for managing and tracking military assets across multiple bases.

The system provides centralized visibility into asset inventory, purchases, transfers, assignments, expenditures, and audit activities while enforcing role-based and base-level access control.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Objectives](#objectives)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Design](#database-design)
- [Core Modules](#core-modules)
  - [Authentication](#authentication)
  - [Dashboard](#dashboard)
  - [Inventory Management](#inventory-management)
  - [Purchase Management](#purchase-management)
  - [Transfer Management](#transfer-management)
  - [Assignment Management](#assignment-management)
  - [Expenditure Management](#expenditure-management)
  - [Audit Logs](#audit-logs)
- [Inventory Calculation](#inventory-calculation)
- [Role-Based Access Control](#role-based-access-control)
- [API Documentation](#api-documentation)
- [Authentication Flow](#authentication-flow)
- [Database Setup](#database-setup)
- [Backend Setup](#backend-setup)
- [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Database Seeding](#database-seeding)
- [Demo Accounts](#demo-accounts)
- [Testing](#testing)
- [Security](#security)
- [GitHub Repository](#github-repository)
- [Deployment](#deployment)
- [Production Configuration](#production-configuration)
- [Project Workflow](#project-workflow)
- [Future Enhancements](#future-enhancements)
- [Submission Deliverables](#submission-deliverables)
- [Author](#author)
- [License](#license)
- [Project Status](#project-status)

---

# Project Overview

The **Military Asset Management System** is a full-stack web application developed to manage military assets across multiple bases.

The application provides a centralized system for recording and monitoring the complete lifecycle of assets, from procurement and transfer to assignment and expenditure.

The system is designed around three major principles:

1. **Visibility** – users can view asset movement and inventory information.
2. **Accountability** – asset-changing activities are recorded through audit logs.
3. **Access Control** – users can only perform operations allowed by their assigned role and base scope.

---

# Objectives

The main objectives of the project are:

- Maintain centralized records of military assets.
- Track assets across multiple military bases.
- Maintain accurate inventory balances.
- Record asset purchases.
- Track transfers between bases.
- Record asset assignments.
- Record asset expenditures.
- Provide role-based access control.
- Restrict Base Commander access to their assigned base.
- Maintain an audit trail of important asset operations.
- Provide dashboard-based inventory and movement metrics.
- Provide a responsive and user-friendly web interface.

---

# Key Features

## Authentication

- Login-based authentication.
- JWT token generation.
- Protected API routes.
- Role-based authorization.
- Token-based access to protected resources.
- Logout functionality.

## Asset Management

- Inventory monitoring.
- Purchase tracking.
- Transfer tracking.
- Assignment tracking.
- Expenditure tracking.
- Audit logging.

## Dashboard

- Opening balance.
- Purchases.
- Transfers in.
- Transfers out.
- Net movement.
- Assigned assets.
- Expended assets.
- Closing balance.
- Base filtering.
- Equipment filtering.
- Date filtering.

## Security

- JWT authentication.
- Role-based access control.
- Base-level access control.
- Helmet middleware.
- CORS configuration.
- Environment variables.
- PostgreSQL transactions.
- Audit logging.

---

# User Roles

The application currently supports three primary roles.

| Role | Description |
|---|---|
| `ADMIN` | Provides global access across the system |
| `BASE_COMMANDER` | Access is restricted to the assigned military base |
| `LOGISTICS_OFFICER` | Handles authorized logistics and asset transaction operations |

---

## ADMIN

The `ADMIN` role has global access.

An administrator can access information across multiple bases and perform authorized administrative operations.

---

## BASE_COMMANDER

The `BASE_COMMANDER` role is restricted to the base assigned to the user.

The backend determines the effective base using the authenticated user's `baseId`.

This prevents a Base Commander from accessing another base simply by changing a query parameter.

---

## LOGISTICS_OFFICER

The `LOGISTICS_OFFICER` role is intended for operational logistics activities.

The role can perform authorized asset-related operations such as:

- Purchases.
- Transfers.
- Other logistics transactions permitted by the RBAC middleware.

---

# System Architecture

```text
                         USER
                          |
                          v
                +-------------------+
                |   React Frontend  |
                |     Vite + CSS    |
                +---------+---------+
                          |
                          | HTTP / JSON
                          |
                          v
                +-------------------+
                |  Express Backend  |
                |     Node.js       |
                +---------+---------+
                          |
             +------------+------------+
             |                         |
             v                         v
     +---------------+        +----------------+
     | Authentication|        | RBAC Middleware|
     |     JWT       |        | Base Scoping  |
     +---------------+        +----------------+
             |                         |
             +------------+------------+
                          |
                          v
                +-------------------+
                |    Controllers    |
                +-------------------+
                          |
             +------------+------------+
             |            |            |
             v            v            v
       Purchases      Transfers    Assignments
             |            |            |
             +------------+------------+
                          |
                   +------+------+
                   |             |
                   v             v
             Expenditures    Audit Logs
                   |
                   +------+
                          |
                          v
                +-------------------+
                |    PostgreSQL     |
                |      Database     |
                +-------------------+
