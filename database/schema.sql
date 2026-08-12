-- =========================================================
-- MILITARY ASSET MANAGEMENT SYSTEM
-- Database Schema
-- PostgreSQL
-- =========================================================


-- =========================================================
-- 1. BASES
-- =========================================================

CREATE TABLE bases (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    location VARCHAR(150) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 2. USERS
-- =========================================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,

    username VARCHAR(50) NOT NULL UNIQUE,

    password_hash VARCHAR(255) NOT NULL,

    role VARCHAR(30) NOT NULL
        CHECK (
            role IN (
                'ADMIN',
                'BASE_COMMANDER',
                'LOGISTICS_OFFICER'
            )
        ),

    base_id INT REFERENCES bases(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 3. EQUIPMENT TYPES
-- =========================================================

CREATE TABLE equipment_types (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL UNIQUE,

    category VARCHAR(50) NOT NULL
        CHECK (
            category IN (
                'WEAPON',
                'VEHICLE',
                'AMMUNITION'
            )
        ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 4. ASSETS
-- =========================================================

CREATE TABLE assets (
    id SERIAL PRIMARY KEY,

    base_id INT NOT NULL
        REFERENCES bases(id)
        ON DELETE CASCADE,

    equipment_type_id INT NOT NULL
        REFERENCES equipment_types(id)
        ON DELETE RESTRICT,

    serial_number VARCHAR(100) UNIQUE,

    status VARCHAR(30) DEFAULT 'AVAILABLE'
        CHECK (
            status IN (
                'AVAILABLE',
                'ASSIGNED',
                'EXPENDED',
                'IN_TRANSIT'
            )
        ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 5. PURCHASES
-- =========================================================

CREATE TABLE purchases (
    id SERIAL PRIMARY KEY,

    base_id INT NOT NULL
        REFERENCES bases(id)
        ON DELETE RESTRICT,

    equipment_type_id INT NOT NULL
        REFERENCES equipment_types(id)
        ON DELETE RESTRICT,

    quantity INT NOT NULL
        CHECK (quantity > 0),

    purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    created_by INT
        REFERENCES users(id)
        ON DELETE SET NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 6. TRANSFERS
-- =========================================================

CREATE TABLE transfers (
    id SERIAL PRIMARY KEY,

    source_base_id INT NOT NULL
        REFERENCES bases(id)
        ON DELETE RESTRICT,

    destination_base_id INT NOT NULL
        REFERENCES bases(id)
        ON DELETE RESTRICT,

    equipment_type_id INT NOT NULL
        REFERENCES equipment_types(id)
        ON DELETE RESTRICT,

    quantity INT NOT NULL
        CHECK (quantity > 0),

    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED'
        CHECK (
            status IN (
                'PENDING',
                'IN_TRANSIT',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    initiated_by INT
        REFERENCES users(id)
        ON DELETE SET NULL,

    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT different_transfer_bases
        CHECK (source_base_id <> destination_base_id)
);


-- =========================================================
-- 7. ASSIGNMENTS
-- =========================================================

CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,

    base_id INT NOT NULL
        REFERENCES bases(id)
        ON DELETE RESTRICT,

    equipment_type_id INT NOT NULL
        REFERENCES equipment_types(id)
        ON DELETE RESTRICT,

    personnel_name VARCHAR(150) NOT NULL,

    quantity INT NOT NULL
        CHECK (quantity > 0),

    assigned_by INT
        REFERENCES users(id)
        ON DELETE SET NULL,

    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 8. EXPENDITURES
-- =========================================================

CREATE TABLE expenditures (
    id SERIAL PRIMARY KEY,

    base_id INT NOT NULL
        REFERENCES bases(id)
        ON DELETE RESTRICT,

    equipment_type_id INT NOT NULL
        REFERENCES equipment_types(id)
        ON DELETE RESTRICT,

    quantity INT NOT NULL
        CHECK (quantity > 0),

    reason VARCHAR(255),

    recorded_by INT
        REFERENCES users(id)
        ON DELETE SET NULL,

    expended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- 9. AUDIT LOGS
-- =========================================================

CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,

    user_id INT
        REFERENCES users(id)
        ON DELETE SET NULL,

    action VARCHAR(50) NOT NULL
        CHECK (
            action IN (
                'LOGIN',
                'PURCHASE',
                'TRANSFER',
                'ASSIGNMENT',
                'EXPENDITURE',
                'UPDATE',
                'DELETE'
            )
        ),

    details TEXT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =========================================================
-- INDEXES
-- =========================================================

CREATE INDEX idx_users_base_id
ON users(base_id);

CREATE INDEX idx_assets_base_id
ON assets(base_id);

CREATE INDEX idx_assets_equipment_type
ON assets(equipment_type_id);

CREATE INDEX idx_purchases_base_id
ON purchases(base_id);

CREATE INDEX idx_purchases_equipment_type
ON purchases(equipment_type_id);

CREATE INDEX idx_transfers_source_base
ON transfers(source_base_id);

CREATE INDEX idx_transfers_destination_base
ON transfers(destination_base_id);

CREATE INDEX idx_transfers_equipment_type
ON transfers(equipment_type_id);

CREATE INDEX idx_assignments_base_id
ON assignments(base_id);

CREATE INDEX idx_expenditures_base_id
ON expenditures(base_id);

CREATE INDEX idx_audit_logs_user_id
ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_created_at
ON audit_logs(created_at);