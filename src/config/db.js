const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const DB_CONFIG = {
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '12345678',
  database: process.env.DB_NAME     || 'exeldb',
};

let pool;

async function initDB(retries = 15, delay = 4000) {
  for (let i = 0; i < retries; i++) {
    try {
      const bootstrap = await mysql.createConnection({
        host: DB_CONFIG.host, user: DB_CONFIG.user, password: DB_CONFIG.password,
      });
      await bootstrap.execute(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\``);
      await bootstrap.end();

      pool = mysql.createPool({ ...DB_CONFIG, waitForConnections: true, connectionLimit: 10 });

      // Users
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id INT PRIMARY KEY AUTO_INCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          nombre VARCHAR(100) NOT NULL,
          apellido VARCHAR(100) NOT NULL,
          correo VARCHAR(150) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          telefono VARCHAR(20),
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      try { await pool.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'user'"); } catch (e) {}

      // Products (herramientas disponibles)
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS products (
          id INT PRIMARY KEY AUTO_INCREMENT,
          name VARCHAR(100) NOT NULL,
          slug VARCHAR(50) UNIQUE NOT NULL,
          description VARCHAR(255),
          active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Per-user licenses
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS user_licenses (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          expiration_date BIGINT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_product (user_id, product_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);

      // Tool Requests
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS tool_requests (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          product_id INT NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `);

      // Check if admin exists before inserting default admin
      const [userCountRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
      if (userCountRows[0].count === 0) {
        const panamaPass = await bcrypt.hash('Panama26', 10);
        await pool.execute(
          "INSERT INTO users (username, nombre, apellido, correo, password, role) VALUES ('administrador', 'Administrador', 'Sistema', 'admin@sistema.local', ?, 'admin')",
          [panamaPass]
        );
        console.log('✅ Default admin user created');
      }

      console.log(`✅ Database "${DB_CONFIG.database}" ready on ${DB_CONFIG.host}`);
      return;
    } catch (err) {
      console.log(`⏳ DB attempt ${i + 1}/${retries} failed: ${err.message}`);
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error(`❌ Could not connect to MySQL at ${DB_CONFIG.host} after ${retries} retries`);
}

function getPool() {
  if (!pool) {
    throw new Error('El pool de la base de datos no ha sido inicializado.');
  }
  return pool;
}

module.exports = {
  initDB,
  getPool
};
