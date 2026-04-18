import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function checkDatabase() {
  let connection;
  
  try {
    // Connect to MySQL (without specifying database first)
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });

    console.log('✅ Connected to MySQL server\n');

    // Check if database exists
    const [databases] = await connection.query(
      "SHOW DATABASES LIKE 'mypetcare_db'"
    );

    if (databases.length === 0) {
      console.log('❌ Database "mypetcare_db" does NOT exist');
      console.log('\n💡 Action Required:');
      console.log('   1. Run the schema.sql file to create the database');
      console.log('   2. Command: mysql -u root -p < ../database/schema.sql');
      console.log('   3. Or use MySQL Workbench/phpMyAdmin to import schema.sql\n');
      await connection.end();
      process.exit(1);
    }

    console.log('✅ Database "mypetcare_db" exists\n');

    // Connect to the database
    await connection.query('USE mypetcare_db');

    // Count tables
    const [tableCount] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'mypetcare_db'"
    );

    const count = tableCount[0].count;
    console.log(`📊 Found ${count} tables in database\n`);

    if (count === 0) {
      console.log('❌ Database exists but has NO tables');
      console.log('\n💡 Action Required:');
      console.log('   Import the schema.sql file to create all tables');
      console.log('   Command: mysql -u root -p < ../database/schema.sql\n');
      await connection.end();
      process.exit(1);
    }

    if (count < 30) {
      console.log(`⚠️  Warning: Expected 30 tables, but found only ${count}`);
      console.log('\n💡 Action Required:');
      console.log('   Re-import schema.sql to create all tables\n');
      
      // List existing tables
      const [tables] = await connection.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'mypetcare_db' ORDER BY table_name"
      );
      console.log('📋 Existing tables:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
      
      await connection.end();
      process.exit(1);
    }

    // List all tables
    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'mypetcare_db' ORDER BY table_name"
    );

    console.log('✅ All 30 tables found!\n');
    console.log('📋 Tables in database:');
    tables.forEach((table, index) => {
      // Handle both possible result structures
      const tableName = table.table_name || table.TABLE_NAME || Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    // Verify key tables exist
    const requiredTables = [
      'users', 'customers', 'doctors', 'staff', 'pets', 'products',
      'orders', 'appointments', 'health_records', 'chat_rooms',
      'notifications', 'feedback', 'offers', 'reminders'
    ];

    console.log('\n🔍 Verifying key tables...');
    const existingTableNames = tables.map(t => t.table_name || t.TABLE_NAME || Object.values(t)[0]);
    let allKeyTablesExist = true;

    for (const table of requiredTables) {
      if (existingTableNames.includes(table)) {
        console.log(`   ✅ ${table}`);
      } else {
        console.log(`   ❌ ${table} - MISSING!`);
        allKeyTablesExist = false;
      }
    }

    if (allKeyTablesExist) {
      console.log('\n🎉 STEP 1 COMPLETE!');
      console.log('   ✅ Database exists');
      console.log('   ✅ All 30 tables created');
      console.log('   ✅ Key tables verified');
      console.log('\n✅ You can proceed to Step 2: Install Backend Dependencies\n');
    } else {
      console.log('\n❌ Some key tables are missing. Please re-import schema.sql\n');
      await connection.end();
      process.exit(1);
    }

    await connection.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Database check failed!\n');
    console.error('Error:', error.message);
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Check DB_USER and DB_PASSWORD in backend/.env');
      console.log('   2. Verify MySQL root password is correct');
      console.log('   3. Make sure MySQL server is running\n');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Make sure MySQL server is running');
      console.log('   2. Check DB_HOST and DB_PORT in backend/.env');
      console.log('   3. Start MySQL service if needed\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Database does not exist');
      console.log('   2. Run: mysql -u root -p < ../database/schema.sql\n');
    } else {
      console.log('\n💡 Check your .env file configuration\n');
    }
    
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

checkDatabase();

