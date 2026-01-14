// Using MySQL database for persistent storage
const mysql = require('mysql2/promise');

// Database connection configuration - for cPanel deployment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'infinity_realms',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let pool;

// Initialize database connection pool
async function init() {
  try {
    // Clear any existing pool
    if (pool) {
      await pool.end();
    }

    pool = mysql.createPool(dbConfig);
    console.log('Connected to MySQL database');

    // Create tables if they don't exist
    await createTables();

    // Clear all data on every startup (for testing/development)
    await clearAllData();
    console.log('Database initialized and all data cleared');

  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
}

// Create necessary tables
async function createTables() {
  try {
    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Purchases table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS purchases (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        minecraft_username VARCHAR(255),
        items JSON NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        provider VARCHAR(50) NOT NULL,
        status ENUM('pending', 'completed', 'failed', 'verified') DEFAULT 'pending',
        verification_status ENUM('unverified', 'verified') DEFAULT 'unverified',
        ip VARCHAR(45),
        transaction_id VARCHAR(255),
        phone_number VARCHAR(20),
        currency VARCHAR(10) DEFAULT 'NPR',
        timestamp TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add missing columns if they don't exist
    try {
      await pool.execute('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255)');
      await pool.execute('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20)');
      await pool.execute('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT "NPR"');
      await pool.execute('ALTER TABLE purchases ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP NULL');
      // Drop foreign key constraint if it exists
      await pool.execute('ALTER TABLE purchases DROP FOREIGN KEY IF EXISTS purchases_ibfk_1');
    } catch (error) {
      console.log('Some columns may already exist or foreign key already dropped, continuing...');
    }

    console.log('Database tables created or verified');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
}

// Clear all data for testing (use with caution in production)
async function clearAllData() {
  try {
    await pool.execute('DELETE FROM purchases');
    await pool.execute('DELETE FROM users');
    console.log('All data cleared for testing');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

// Manual clear command for admin use
async function manualClearData() {
  try {
    await clearAllData();
    console.log('Database manually cleared by admin command');
  } catch (error) {
    console.error('Error in manual clear:', error);
  }
}

// Clear registered users data
async function clearRegisteredUsers() {
  try {
    await pool.execute('DELETE FROM users');
    console.log('All registered users cleared');
  } catch (error) {
    console.error('Error clearing users:', error);
  }
}

async function createPurchase(purchase) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO purchases (id, username, email, minecraft_username, items, amount, provider, status, verification_status, ip, transaction_id, phone_number, currency, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [purchase.id, purchase.username, purchase.email, purchase.minecraft_username, JSON.stringify(purchase.items), purchase.amount, purchase.provider, purchase.status || 'pending', 'unverified', purchase.ip, purchase.transaction_id || '', purchase.phone_number || '', purchase.currency || 'NPR', purchase.timestamp || new Date()]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
}

async function updatePurchaseStatus(id, status) {
  try {
    await pool.execute('UPDATE purchases SET status = ? WHERE id = ?', [status, id]);
  } catch (error) {
    console.error('Error updating purchase status:', error);
    throw error;
  }
}

async function updatePurchaseVerification(id, verificationStatus) {
  try {
    await pool.execute('UPDATE purchases SET verification_status = ? WHERE id = ?', [verificationStatus, id]);
  } catch (error) {
    console.error('Error updating purchase verification:', error);
    throw error;
  }
}

async function getPurchases() {
  try {
    const [rows] = await pool.execute('SELECT * FROM purchases ORDER BY created_at DESC');
    return rows.map(row => ({
      ...row,
      items: JSON.parse(row.items) // Parse JSON items back to objects
    }));
  } catch (error) {
    console.error('Error getting purchases:', error);
    throw error;
  }
}

async function createUser(user) {
  try {
    const [result] = await pool.execute(
      'INSERT INTO users (username, email) VALUES (?, ?)',
      [user.username, user.email]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

async function getUserByUsername(username) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

async function getUserByEmail(email) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
}

async function getUsers() {
  try {
    const [rows] = await pool.execute('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  } catch (error) {
    console.error('Error getting users:', error);
    throw error;
  }
}

module.exports = {
  init,
  createPurchase,
  updatePurchaseStatus,
  updatePurchaseVerification,
  getPurchases,
  createUser,
  getUserByUsername,
  getUserByEmail,
  getUsers,
  clearAllData,
  clearRegisteredUsers
};
