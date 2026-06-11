// Punto de entrada del servidor Banco UP
const express = require('express')
const dotenv = require('dotenv')
const cors = require('cors')
const path = require('path')

dotenv.config()

const app = express()

app.use(cors())

// Middleware para parsear JSON
app.use(express.json())

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')))

// Importar rutas
const authRoutes = require('./routes/auth')
const transferenciaRoutes = require('./routes/transferencias')
const adminRoutes = require('./routes/admin')

// Rutas
app.use('/api/auth', authRoutes)
console.log('Rutas auth registradas')
app.use('/api/transferencias', transferenciaRoutes)
app.use('/api/admin', adminRoutes)

// Iniciar servidor
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`)
})

module.exports = app