// Mock del logger para tests
jest.mock('./utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
}))

// Unit tests - Autenticación y Transferencias - SBBU-32
const pool = require('./db')

// ─── TESTS DE AUTENTICACIÓN ───────────────────

describe('Validaciones de autenticación', () => {

  test('debe rechazar login sin numero_cuenta', async () => {
    const req = { body: { numero_cuenta: '', contrasena: 'pass123' } }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const { login } = require('./controllers/authController')
    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
  })

  test('debe rechazar login con cuenta inexistente', async () => {
    const req = { body: { numero_cuenta: '0000000000000000', contrasena: 'pass123' } }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const { login } = require('./controllers/authController')
    await login(req, res)

    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.any(String) })
    )
  })

})

// ─── TESTS DE TRANSFERENCIAS ──────────────────

describe('Validaciones de transferencias', () => {

  test('debe rechazar transferencia con monto menor a 500', async () => {
    const req = {
      body: { cuenta_destino: '9876543210987654', monto: 100, concepto: 'Test' },
      usuario: { cuenta_id: 1 }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const { realizarTransferencia } = require('./controllers/transferenciaController')
    await realizarTransferencia(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('500') })
    )
  })

  test('debe rechazar transferencia con cuenta destino de menos de 16 digitos', async () => {
    const req = {
      body: { cuenta_destino: '12345', monto: 1000, concepto: 'Test' },
      usuario: { cuenta_id: 1 }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const { realizarTransferencia } = require('./controllers/transferenciaController')
    await realizarTransferencia(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('16 dígitos') })
    )
  })

  test('debe rechazar transferencia sin concepto', async () => {
    const req = {
      body: { cuenta_destino: '9876543210987654', monto: 1000, concepto: '' },
      usuario: { cuenta_id: 1 }
    }
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    }

    const { realizarTransferencia } = require('./controllers/transferenciaController')
    await realizarTransferencia(req, res)

    expect(res.status).toHaveBeenCalledWith(400)
  })

})

// Cerrar conexión BD al terminar
afterAll(async () => {
  await pool.end()
})