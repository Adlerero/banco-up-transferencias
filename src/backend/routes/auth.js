const express = require('express')
const router = express.Router()
const { login, logout } = require('../controllers/authController')
const { verificarToken } = require('../middlewares/auth')

// SBBU-5 - Autenticar usuarios
router.post('/login', login)

// SBBU-8 - Cerrar sesión
router.post('/logout', verificarToken, logout)

// GET /api/auth/saldo
router.get('/saldo', verificarToken, async (req, res) => {
  try {
    const pool = require('../db')
    const result = await pool.query('SELECT saldo FROM cuenta WHERE id = $1', [req.usuario.cuenta_id])
    res.json({ saldo: result.rows[0].saldo })
  } catch (err) {
    res.status(500).json({ error: 'Error obteniendo saldo.' })
  }
})

module.exports = router