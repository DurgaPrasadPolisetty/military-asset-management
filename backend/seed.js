import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import db from "./config/db.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // =====================================================
    // 1. BASES
    // =====================================================

    const bases = [
      ["Fort Alpha", "Northern Command"],
      ["Fort Bravo", "Western Command"],
      ["Fort Charlie", "Eastern Command"],
    ];

    for (const [name, location] of bases) {
      await db.query(
        `
        INSERT INTO bases (name, location)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        `,
        [name, location]
      );
    }

    console.log("✅ Bases seeded");


    // =====================================================
    // 2. EQUIPMENT TYPES
    // =====================================================

    const equipmentTypes = [
      ["M4 Carbine", "WEAPON"],
      ["Humvee", "VEHICLE"],
      ["5.56mm Ammunition", "AMMUNITION"],
    ];

    for (const [name, category] of equipmentTypes) {
      await db.query(
        `
        INSERT INTO equipment_types (name, category)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
        `,
        [name, category]
      );
    }

    console.log("✅ Equipment types seeded");


    // =====================================================
    // 3. GET BASE IDs
    // =====================================================

    const baseResult = await db.query(
      `
      SELECT id, name
      FROM bases
      ORDER BY id
      `
    );

    const basesMap = {};

    for (const base of baseResult.rows) {
      basesMap[base.name] = base.id;
    }


    // =====================================================
    // 4. GET EQUIPMENT IDs
    // =====================================================

    const equipmentResult = await db.query(
      `
      SELECT id, name
      FROM equipment_types
      ORDER BY id
      `
    );

    const equipmentMap = {};

    for (const equipment of equipmentResult.rows) {
      equipmentMap[equipment.name] = equipment.id;
    }


    // =====================================================
    // 5. HASH PASSWORDS
    // =====================================================

    const adminPassword = await bcrypt.hash(
      "AdminPass123!",
      10
    );

    const commanderPassword = await bcrypt.hash(
      "CommandPass123!",
      10
    );

    const logisticsPassword = await bcrypt.hash(
      "LogisticsPass123!",
      10
    );


    // =====================================================
    // 6. USERS
    // =====================================================

    await db.query(
      `
      INSERT INTO users
        (username, password_hash, role, base_id)
      VALUES
        ($1, $2, 'ADMIN', NULL)
      ON CONFLICT (username) DO NOTHING
      `,
      [
        "admin_user",
        adminPassword
      ]
    );


    await db.query(
      `
      INSERT INTO users
        (username, password_hash, role, base_id)
      VALUES
        ($1, $2, 'BASE_COMMANDER', $3)
      ON CONFLICT (username) DO NOTHING
      `,
      [
        "commander_alpha",
        commanderPassword,
        basesMap["Fort Alpha"]
      ]
    );


    await db.query(
      `
      INSERT INTO users
        (username, password_hash, role, base_id)
      VALUES
        ($1, $2, 'LOGISTICS_OFFICER', $3)
      ON CONFLICT (username) DO NOTHING
      `,
      [
        "logistics_officer",
        logisticsPassword,
        basesMap["Fort Alpha"]
      ]
    );

    console.log("✅ Users seeded");


    // =====================================================
    // 7. GET USER IDs
    // =====================================================

    const userResult = await db.query(
      `
      SELECT id, username
      FROM users
      WHERE username IN (
        'admin_user',
        'commander_alpha',
        'logistics_officer'
      )
      `
    );

    const usersMap = {};

    for (const user of userResult.rows) {
      usersMap[user.username] = user.id;
    }


    // =====================================================
    // 8. SAMPLE PURCHASES
    // =====================================================

    // Fort Alpha receives 20 M4 Carbines

    await db.query(
      `
      INSERT INTO purchases
        (base_id, equipment_type_id, quantity, created_by)
      SELECT $1, $2, 20, $3
      WHERE NOT EXISTS (
        SELECT 1
        FROM purchases
        WHERE base_id = $1
          AND equipment_type_id = $2
          AND quantity = 20
      )
      `,
      [
        basesMap["Fort Alpha"],
        equipmentMap["M4 Carbine"],
        usersMap["logistics_officer"]
      ]
    );


    // Fort Alpha receives 1000 rounds of ammunition

    await db.query(
      `
      INSERT INTO purchases
        (base_id, equipment_type_id, quantity, created_by)
      SELECT $1, $2, 1000, $3
      WHERE NOT EXISTS (
        SELECT 1
        FROM purchases
        WHERE base_id = $1
          AND equipment_type_id = $2
          AND quantity = 1000
      )
      `,
      [
        basesMap["Fort Alpha"],
        equipmentMap["5.56mm Ammunition"],
        usersMap["logistics_officer"]
      ]
    );


    // Fort Bravo receives 3 Humvees

    await db.query(
      `
      INSERT INTO purchases
        (base_id, equipment_type_id, quantity, created_by)
      SELECT $1, $2, 3, $3
      WHERE NOT EXISTS (
        SELECT 1
        FROM purchases
        WHERE base_id = $1
          AND equipment_type_id = $2
          AND quantity = 3
      )
      `,
      [
        basesMap["Fort Bravo"],
        equipmentMap["Humvee"],
        usersMap["logistics_officer"]
      ]
    );

    console.log("✅ Purchases seeded");


    // =====================================================
    // 9. SAMPLE TRANSFER
    // =====================================================

    // Transfer 5 M4 Carbines from Alpha → Bravo

    await db.query(
      `
      INSERT INTO transfers
        (
          source_base_id,
          destination_base_id,
          equipment_type_id,
          quantity,
          status,
          initiated_by
        )
      SELECT
        $1,
        $2,
        $3,
        5,
        'COMPLETED',
        $4
      WHERE NOT EXISTS (
        SELECT 1
        FROM transfers
        WHERE source_base_id = $1
          AND destination_base_id = $2
          AND equipment_type_id = $3
          AND quantity = 5
      )
      `,
      [
        basesMap["Fort Alpha"],
        basesMap["Fort Bravo"],
        equipmentMap["M4 Carbine"],
        usersMap["logistics_officer"]
      ]
    );

    console.log("✅ Transfer seeded");


    // =====================================================
    // 10. SAMPLE ASSIGNMENT
    // =====================================================

    await db.query(
      `
      INSERT INTO assignments
        (
          base_id,
          equipment_type_id,
          personnel_name,
          quantity,
          assigned_by
        )
      SELECT
        $1,
        $2,
        'Alpha Infantry Unit',
        3,
        $3
      WHERE NOT EXISTS (
        SELECT 1
        FROM assignments
        WHERE base_id = $1
          AND equipment_type_id = $2
          AND personnel_name = 'Alpha Infantry Unit'
          AND quantity = 3
      )
      `,
      [
        basesMap["Fort Alpha"],
        equipmentMap["M4 Carbine"],
        usersMap["commander_alpha"]
      ]
    );

    console.log("✅ Assignment seeded");


    // =====================================================
    // 11. SAMPLE EXPENDITURE
    // =====================================================

    await db.query(
      `
      INSERT INTO expenditures
        (
          base_id,
          equipment_type_id,
          quantity,
          reason,
          recorded_by
        )
      SELECT
        $1,
        $2,
        100,
        'Training exercise',
        $3
      WHERE NOT EXISTS (
        SELECT 1
        FROM expenditures
        WHERE base_id = $1
          AND equipment_type_id = $2
          AND quantity = 100
          AND reason = 'Training exercise'
      )
      `,
      [
        basesMap["Fort Alpha"],
        equipmentMap["5.56mm Ammunition"],
        usersMap["commander_alpha"]
      ]
    );

    console.log("✅ Expenditure seeded");


    // =====================================================
    // 12. AUDIT LOG
    // =====================================================

    await db.query(
      `
      INSERT INTO audit_logs
        (user_id, action, details)
      VALUES
        ($1, 'LOGIN', 'Initial system seed completed')
      `,
      [usersMap["admin_user"]]
    );

    console.log("✅ Audit log created");

    console.log("\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    console.log("==========================================");
    console.log("Admin:");
    console.log("  Username: admin_user");
    console.log("  Password: AdminPass123!");
    console.log("");
    console.log("Base Commander:");
    console.log("  Username: commander_alpha");
    console.log("  Password: CommandPass123!");
    console.log("");
    console.log("Logistics Officer:");
    console.log("  Username: logistics_officer");
    console.log("  Password: LogisticsPass123!");
    console.log("==========================================");

  } catch (error) {
    console.error("❌ Seeding failed:", error);
  } finally {
    await db.end();
  }
};

seedDatabase();