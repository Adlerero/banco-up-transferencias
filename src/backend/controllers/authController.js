// Controlador de autenticación - SBBU-5
const pool = require('../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// POST /api/auth/login
const login = async (req, res) => {
  const { numero_cuenta, contrasena } = req.body

  try {
    // Buscar cuenta y usuario asociado
    const result = await pool.query(
      `SELECT u.id, u.nombre, u.apellido, u.contrasena_hash, 
              u.intentos_fallidos, u.bloqueado, u.rol_id,
              r.nombre as rol, c.numero_cuenta, c.saldo, c.id as cuenta_id
       FROM cuenta c
       JOIN usuario u ON c.usuario_id = u.id
       JOIN rol r ON u.rol_id = r.id
       WHERE c.numero_cuenta = $1`,
      [numero_cuenta]
    )

    // Verificar que existe la cuenta
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Número de cuenta o contraseña incorrectos.' })
    }

    const usuario = result.rows[0]

    // Verificar si está bloqueado
    if (usuario.bloqueado) {
      return res.status(403).json({ error: 'Cuenta bloqueada. Contacta a un administrador.' })
    }

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash)

    if (!contrasenaValida) {
      // Incrementar intentos fallidos
      const intentos = usuario.intentos_fallidos + 1
      const bloqueado = intentos >= 4

      await pool.query(
        `UPDATE usuario SET intentos_fallidos = $1, bloqueado = $2 WHERE id = $3`,
        [intentos, bloqueado, usuario.id]
      )

      if (bloqueado) {
        return res.status(403).json({ error: 'Cuenta bloqueada por múltiples intentos fallidos. Contacta a un administrador.' })
      }

      return res.status(401).json({ 
        error: `Contraseña incorrecta. Intentos fallidos: ${intentos}/4` 
      })
    }

    // Resetear intentos fallidos al login exitoso
    await pool.query(
      `UPDATE usuario SET intentos_fallidos = 0 WHERE id = $1`,
      [usuario.id]
    )

    // Generar JWT
    const token = jwt.sign(
      {
        id: usuario.id,
        cuenta_id: usuario.cuenta_id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        numero_cuenta: usuario.numero_cuenta
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: {
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        rol: usuario.rol,
        numero_cuenta: usuario.numero_cuenta,
        saldo: usuario.saldo
      }
    })

  } catch (err) {
    console.error('Error en login:', err.message)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  // Con JWT stateless el logout se maneja en el frontend eliminando el token
  res.json({ mensaje: 'Sesión cerrada correctamente.' })
}

module.exports = { login, logout }