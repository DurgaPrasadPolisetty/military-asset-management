-- =========================================================
-- MILITARY ASSET MANAGEMENT SYSTEM
-- Database Seed Data
-- PostgreSQL
-- =========================================================

-- =========================================================
-- ENABLE PASSWORD HASHING
-- =========================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- =========================================================
-- 1. BASES
-- =========================================================

INSERT INTO bases
    (name, location)
VALUES
    ('Alpha Military Base', 'Hyderabad'),
    ('Bravo Military Base', 'Visakhapatnam'),
    ('Charlie Military Base', 'Bengaluru');


-- =========================================================
-- 2. EQUIPMENT TYPES
-- =========================================================

INSERT INTO equipment_types
    (name, category)
VALUES
    ('Assault Rifle', 'WEAPON'),
    ('Armored Vehicle', 'VEHICLE'),
    ('5.56mm Ammunition', 'AMMUNITION'),
    ('Sniper Rifle', 'WEAPON'),
    ('Military Truck', 'VEHICLE');


-- =========================================================
-- 3. USERS
-- =========================================================
--
-- Demo credentials:
--
-- admin_user
-- Password: AdminPass123!
--
-- commander_alpha
-- Password: CommandPass123!
--
-- logistics_officer
-- Password: LogisticsPass123!
--
-- Passwords are stored as bcrypt hashes using pgcrypto.
-- =========================================================

INSERT INTO users
    (
        username,
        password_hash,
        role,
        base_id
    )
VALUES
    (
        'admin_user',
        crypt('AdminPass123!', gen_salt('bf')),
        'ADMIN',
        NULL
    ),
    (
        'commander_alpha',
        crypt('CommandPass123!', gen_salt('bf')),
        'BASE_COMMANDER',
        (SELECT id FROM bases WHERE name = 'Alpha Military Base')
    ),
    (
        'logistics_officer',
        crypt('LogisticsPass123!', gen_salt('bf')),
        'LOGISTICS_OFFICER',
        NULL
    );


-- =========================================================
-- 4. ASSETS
-- =========================================================

INSERT INTO assets
    (
        base_id,
        equipment_type_id,
        serial_number,
        status
    )
VALUES
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        'AR-ALPHA-001',
        'AVAILABLE'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        'AR-ALPHA-002',
        'AVAILABLE'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Armored Vehicle'),
        'AV-ALPHA-001',
        'AVAILABLE'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        'AR-BRAVO-001',
        'AVAILABLE'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Military Truck'),
        'MT-BRAVO-001',
        'AVAILABLE'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Charlie Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Sniper Rifle'),
        'SR-CHARLIE-001',
        'AVAILABLE'
    );


-- =========================================================
-- 5. PURCHASES
-- =========================================================

INSERT INTO purchases
    (
        base_id,
        equipment_type_id,
        quantity,
        purchase_date,
        created_by
    )
VALUES
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        100,
        CURRENT_TIMESTAMP - INTERVAL '10 days',
        (SELECT id FROM users WHERE username = 'admin_user')
    ),
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = '5.56mm Ammunition'),
        1000,
        CURRENT_TIMESTAMP - INTERVAL '9 days',
        (SELECT id FROM users WHERE username = 'admin_user')
    ),
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Armored Vehicle'),
        10,
        CURRENT_TIMESTAMP - INTERVAL '8 days',
        (SELECT id FROM users WHERE username = 'logistics_officer')
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        60,
        CURRENT_TIMESTAMP - INTERVAL '7 days',
        (SELECT id FROM users WHERE username = 'admin_user')
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = '5.56mm Ammunition'),
        600,
        CURRENT_TIMESTAMP - INTERVAL '6 days',
        (SELECT id FROM users WHERE username = 'logistics_officer')
    ),
    (
        (SELECT id FROM bases WHERE name = 'Charlie Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Sniper Rifle'),
        20,
        CURRENT_TIMESTAMP - INTERVAL '5 days',
        (SELECT id FROM users WHERE username = 'admin_user')
    );


-- =========================================================
-- 6. TRANSFERS
-- =========================================================

INSERT INTO transfers
    (
        source_base_id,
        destination_base_id,
        equipment_type_id,
        quantity,
        status,
        initiated_by,
        timestamp
    )
VALUES
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        20,
        'COMPLETED',
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM bases WHERE name = 'Charlie Military Base'),
        (SELECT id FROM equipment_types WHERE name = '5.56mm Ammunition'),
        200,
        'COMPLETED',
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM bases WHERE name = 'Charlie Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        5,
        'COMPLETED',
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    );


-- =========================================================
-- 7. ASSIGNMENTS
-- =========================================================

INSERT INTO assignments
    (
        base_id,
        equipment_type_id,
        personnel_name,
        quantity,
        assigned_by,
        assigned_at
    )
VALUES
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        'Alpha Security Unit',
        10,
        (SELECT id FROM users WHERE username = 'commander_alpha'),
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Assault Rifle'),
        'Bravo Rapid Response Unit',
        5,
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Charlie Military Base'),
        (SELECT id FROM equipment_types WHERE name = 'Sniper Rifle'),
        'Charlie Special Operations Unit',
        4,
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    );


-- =========================================================
-- 8. EXPENDITURES
-- =========================================================

INSERT INTO expenditures
    (
        base_id,
        equipment_type_id,
        quantity,
        reason,
        recorded_by,
        expended_at
    )
VALUES
    (
        (SELECT id FROM bases WHERE name = 'Alpha Military Base'),
        (SELECT id FROM equipment_types WHERE name = '5.56mm Ammunition'),
        100,
        'Training exercise consumption',
        (SELECT id FROM users WHERE username = 'commander_alpha'),
        CURRENT_TIMESTAMP - INTERVAL '2 days'
    ),
    (
        (SELECT id FROM bases WHERE name = 'Bravo Military Base'),
        (SELECT id FROM equipment_types WHERE name = '5.56mm Ammunition'),
        50,
        'Operational training',
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    );


-- =========================================================
-- 9. AUDIT LOGS
-- =========================================================

INSERT INTO audit_logs
    (
        user_id,
        action,
        details
    )
VALUES
    (
        (SELECT id FROM users WHERE username = 'admin_user'),
        'LOGIN',
        'Admin user logged into the system'
    ),
    (
        (SELECT id FROM users WHERE username = 'commander_alpha'),
        'LOGIN',
        'Base Commander logged into the system'
    ),
    (
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        'LOGIN',
        'Logistics Officer logged into the system'
    ),
    (
        (SELECT id FROM users WHERE username = 'admin_user'),
        'PURCHASE',
        'Initial asset purchases recorded for military bases'
    ),
    (
        (SELECT id FROM users WHERE username = 'logistics_officer'),
        'TRANSFER',
        'Assets transferred between military bases'
    ),
    (
        (SELECT id FROM users WHERE username = 'commander_alpha'),
        'ASSIGNMENT',
        'Assets assigned to Alpha Security Unit'
    ),
    (
        (SELECT id FROM users WHERE username = 'commander_alpha'),
        'EXPENDITURE',
        'Ammunition expended during training exercise'
    );


-- =========================================================
-- SEED COMPLETE
-- =========================================================

SELECT 'Seed data inserted successfully.' AS message;