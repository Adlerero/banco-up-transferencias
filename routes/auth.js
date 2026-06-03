const express = require('express')
const router = express.Router()
const { login, logout } = require('../controllers/authController')
const { verificarToken } = require('../middlewares/auth')

// SBBU-5 - Autenticar usuarios
router.post('/login', login)

// SBBU-8 - Cerrar sesión
router.post('/logout', verificarToken, logout)

module.exports = router