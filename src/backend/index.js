// Punto de entrada del servidor Banco UP
const express = require('express')
const dotenv = require('dotenv')

dotenv.config()

const app = express()

const cors = require('cors')
app.use(cors())

// Middleware para parsear JSON
app.use(express.json())

// Importar rutas
const authRoutes = require('./routes/auth')
const transferenciaRoutes = require('./routes/transferencias')
const adminRoutes = require('./routes/admin')

// Rutas
app.use('/api/auth', authRoutes)
console.log('Rutas auth registradas')
app.use('/api/transferencias', transferenciaRoutes)
app.use('/api/admin', adminRoutes)

// Ruta base de verificación
app.get('/', (req, res) => {
  res.json({ mensaje: 'Banco UP API corriendo', version: '1.0.0' })
})

// Iniciar servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

module.exports = app