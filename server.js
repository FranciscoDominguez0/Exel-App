// No dotenv needed for simple config
const { initDB } = require('./src/config/db');
const app = require('./src/app');

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    // Inicializamos la base de datos antes de arrancar el servidor web
    await initDB();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Error fatal al iniciar:', err.message);
    process.exit(1);
  }
}

startServer();
