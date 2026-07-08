const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const productRoutes = require('./routes/product.routes');
const licenseRoutes = require('./routes/license.routes');

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Rutas de la API
app.use('/api', authRoutes); // /api/login, /api/register
app.use('/api/admin', adminRoutes); // /api/admin/users...

// The frontend calls /api/products directly
app.get('/api/products', require('./controllers/product.controller').getPublicProducts);
// The frontend calls /api/my/licenses directly
app.get('/api/my/licenses', require('./middlewares/auth').requireAuth, require('./controllers/license.controller').getMyLicenses);

// Admin products and licenses routes
app.use('/api/admin/products', require('./routes/product.routes'));
app.use('/api/admin/licenses', require('./routes/license.routes'));

// Rutas genéricas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = app;
