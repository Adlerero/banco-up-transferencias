const logger = require('../utils/logger')
const pool = require('../db')

// POST /api/transferencias
const realizarTransferencia = async (req, res) => {
  const { cuenta_destino, monto, concepto } = req.body
  const cuenta_origen_id = req.usuario.cuenta_id

  try {
    logger.debug(`Intento de transferencia desde cuenta_id: ${cuenta_origen_id}`)

    if (!cuenta_destino || !monto || !concepto) {
      logger.warn('Transferencia rechazada: campos obligatorios faltantes')
      return res.status(400).json({ error: 'Cuenta destino, monto y concepto son obligatorios.' })
    }

    if (!/^\d{16}$/.test(cuenta_destino)) {
      logger.warn(`Transferencia rechazada: formato de cuenta destino inválido: ${cuenta_destino}`)
      return res.status(400).json({ error: 'El número de cuenta destino debe tener exactamente 16 dígitos.' })
    }

    if (monto < 500) {
      logger.warn(`Transferencia rechazada: monto menor al mínimo: $${monto}`)
      return res.status(400).json({ error: 'El monto mínimo de transferencia es $500.00 MXN.' })
    }

    if (!/^\d+(\.\d{1,2})?$/.test(monto.toString())) {
      logger.warn(`Transferencia rechazada: más de 2 decimales en monto: ${monto}`)
      return res.status(400).json({ error: 'El monto no puede tener más de 2 decimales.' })
    }

    const origenResult = await pool.query(
      'SELECT * FROM cuenta WHERE id = $1',
      [cuenta_origen_id]
    )
    const cuentaOrigen = origenResult.rows[0]

    if (parseFloat(cuentaOrigen.saldo) < monto) {
      logger.warn(`Transferencia rechazada: saldo insuficiente en cuenta_id: ${cuenta_origen_id}`)
      return res.status(400).json({ error: 'Saldo insuficiente para realizar la transferencia.' })
    }

    const destinoResult = await pool.query(
      'SELECT * FROM cuenta WHERE numero_cuenta = $1',
      [cuenta_destino]
    )

    if (destinoResult.rows.length === 0) {
      logger.warn(`Transferencia rechazada: cuenta destino no existe: ${cuenta_destino}`)
      return res.status(404).json({ error: 'La cuenta destino no existe.' })
    }
    const cuentaDestino = destinoResult.rows[0]

    if (cuentaOrigen.id === cuentaDestino.id) {
      logger.warn(`Transferencia rechazada: mismo origen y destino: ${cuenta_destino}`)
      return res.status(400).json({ error: 'No puedes transferir a tu propia cuenta.' })
    }

    const hoy = new Date().toISOString().split('T')[0]
    const limiteResult = await pool.query(
      'SELECT monto_acumulado FROM limite_diario WHERE cuenta_id = $1 AND fecha = $2',
      [cuenta_origen_id, hoy]
    )
    const acumulado = limiteResult.rows.length > 0 ? parseFloat(limiteResult.rows[0].monto_acumulado) : 0

    if (acumulado + parseFloat(monto) > 7000) {
      logger.warn(`Transferencia rechazada: límite diario excedido. Acumulado: $${acumulado}`)
      return res.status(400).json({ 
        error: `Límite diario excedido. Llevas $${acumulado} transferidos hoy. Límite: $7,000 MXN.` 
      })
    }

    if (parseFloat(cuentaDestino.saldo) + parseFloat(monto) > 50000) {
      logger.warn(`Transferencia rechazada: cuenta destino superaría tope de $50,000`)
      return res.status(400).json({ error: 'La cuenta destino superaría el límite máximo de $50,000 MXN.' })
    }

    await pool.query('BEGIN')

    await pool.query(
      'UPDATE cuenta SET saldo = saldo - $1 WHERE id = $2',
      [monto, cuenta_origen_id]
    )

    await pool.query(
      'UPDATE cuenta SET saldo = saldo + $1 WHERE id = $2',
      [monto, cuentaDestino.id]
    )

    const transaccionResult = await pool.query(
      `INSERT INTO transaccion (cuenta_origen_id, cuenta_destino_id, monto, concepto, tipo)
       VALUES ($1, $2, $3, $4, 'transferencia') RETURNING *`,
      [cuenta_origen_id, cuentaDestino.id, monto, concepto]
    )

    await pool.query(
      `INSERT INTO limite_diario (cuenta_id, fecha, monto_acumulado)
       VALUES ($1, $2, $3)
       ON CONFLICT (cuenta_id, fecha) 
       DO UPDATE SET monto_acumulado = limite_diario.monto_acumulado + $3`,
      [cuenta_origen_id, hoy, monto]
    )

    await pool.query('COMMIT')

    logger.info(`Transferencia exitosa: $${monto} de cuenta_id ${cuenta_origen_id} a ${cuenta_destino}`)

    res.json({
      mensaje: 'Transferencia realizada exitosamente.',
      transaccion: transaccionResult.rows[0]
    })

  } catch (err) {
    await pool.query('ROLLBACK')
    logger.error(`Error en transferencia: ${err.message}`)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

// GET /api/transferencias
const obtenerTransferencias = async (req, res) => {
  const cuenta_id = req.usuario.cuenta_id
  const page = parseInt(req.query.page) || 1
  const limit = 5
  const offset = (page - 1) * limit

  try {
    logger.debug(`Obteniendo transferencias para cuenta_id: ${cuenta_id}, página: ${page}`)

    const result = await pool.query(
      `SELECT t.id, t.concepto, t.monto, t.tipo, t.fecha_hora,
              co.numero_cuenta as cuenta_origen,
              cd.numero_cuenta as cuenta_destino
       FROM transaccion t
       JOIN cuenta co ON t.cuenta_origen_id = co.id
       JOIN cuenta cd ON t.cuenta_destino_id = cd.id
       WHERE t.cuenta_origen_id = $1 OR t.cuenta_destino_id = $1
       ORDER BY t.fecha_hora DESC
       LIMIT $2 OFFSET $3`,
      [cuenta_id, limit, offset]
    )

    logger.info(`Historial obtenido: ${result.rows.length} registros para cuenta_id: ${cuenta_id}`)

    res.json({
      page,
      transferencias: result.rows
    })

  } catch (err) {
    logger.error(`Error obteniendo transferencias: ${err.message}`)
    res.status(500).json({ error: 'Error interno del servidor.' })
  }
}

module.exports = { realizarTransferencia, obtenerTransferencias }