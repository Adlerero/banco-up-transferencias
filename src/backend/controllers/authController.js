const logger = require('../utils/logger')
const pool = require('../db')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

// POST /api/auth/login
const login = async (req, res) => {
  const { numero_cuenta, contrasena } = req.body

  try {
    logger.debug(`Intento de login para cuenta: ${numero_cuenta}`)

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

    if (result.rows.length === 0) {
      logger.warn(`Cuenta no encontrada: ${numero_cuenta}`)
      return res.status(401).json({ error: 'Número de cuenta o contraseña incorrectos.' })
    }

    const usuario = result.rows[0]

    if (usuario.bloqueado) {
      logger.warn(`Intento de acceso a cuenta bloqueada: ${numero_cuenta}`)
      return res.status(403).json({ error: 'Cuenta bloqueada. Contacta a un administrador.' })
    }

    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash)

    if (!contrasenaValida) {
      const intentos = usuario.intentos_fallidos + 1
      const bloqueado = intentos >= 4

      await pool.query(
        `UPDATE usuario SET intentos_fallidos = $1, bloqueado = $2 WHERE id = $3`,
        [intentos, bloqueado, usuario.id]
      )

      if (bloqueado) {
        logger.warn(`Cuenta bloqueada por intentos fallidos: ${numero_cuenta}`)
        return res.status(403).json({ error: 'Cuenta bloqueada por múltiples intentos fallidos. Contacta a un administrador.' })
      }

      logger.warn(`Contraseña incorrecta para cuenta: ${numero_cuenta}. Intento ${intentos}/4`)
      return res.status(401).json({ 
        error: `Contraseña incorrecta. Intentos fallidos: ${intentos}/4` 
      })
    }

    await pool.query(
      `UPDATE usuario SET intentos_fallidos = 0 WHERE id = $1`,
      [usuario.id]
    )

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

    logger.info(`Login exitoso para cuenta: ${numero_cuenta} | Rol: ${usuario.rol}`)

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
    logger.error(`Error en login: ${err.message}`)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// POST /api/auth/logout
const logout = async (req, res) => {
  logger.info(`Logout de usuario: ${req.usuario.numero_cuenta}`)
  res.json({ mensaje: 'Sesión cerrada correctamente.' })
}

module.exports = { login, logout }