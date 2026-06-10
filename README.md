# Banco UP - Sistema de Transferencias

Sistema web de transferencias bancarias desarrollado para el proyecto final de la materia **Ingeniería de Software** (Universidad Panamericana, Aguascalientes).

## Equipo

- Adler Antonio Calvillo Arellano
- Jared López García
- Luis Miguel Portugal Kegel

**Profesor:** Luis Manuel Ortiz de la Torre

## Descripción

Banco UP permite a los clientes de un banco realizar transferencias monetarias entre cuentas de forma segura, consultar su saldo e historial de movimientos, y a los administradores gestionar el bloqueo/desbloqueo de cuentas de usuario.

## Funcionalidades

- **Autenticación:** login con número de cuenta y contraseña, JWT con expiración de 8 horas, bloqueo automático tras 4 intentos fallidos.
- **Transferencias:** validación de monto mínimo ($500 MXN), límite diario por cuenta ($7,000 MXN), tope máximo de saldo en cuenta destino ($50,000 MXN), validación de cuenta destino a 16 dígitos.
- **Historial:** listado paginado (5 registros por página) de transferencias enviadas y recibidas.
- **Panel de administrador:** listado de cuentas, bloqueo y desbloqueo manual de usuarios.
- **Seguridad:** contraseñas encriptadas con bcrypt, autenticación stateless con JWT.
- **Logging:** registro de eventos (debug, info, warning, error) con Winston.
- **Pruebas unitarias:** validaciones de autenticación y transferencias con Jest.

## Stack tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (ES6+) |
| Backend | Node.js 20 + Express 4 |
| Base de datos | PostgreSQL (Supabase) |
| Autenticación | JWT + bcrypt |
| Logging | Winston |
| Testing | Jest |

## Estructura del proyecto

```
/
├── docs/                 # Documentación del proyecto (SRS, diagramas)
│   ├── srs/
│   └── diagrams/
├── src/
│   ├── backend/          # API REST, lógica de negocio, conexión a BD
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── db/
│   │   ├── utils/
│   │   ├── logs/
│   │   ├── auth.test.js
│   │   ├── index.js
│   │   └── package.json
│   └── frontend/         # Interfaz de usuario
│       ├── index.html
│       ├── dashboard.html
│       ├── transferencia.html
│       ├── confirmacion.html
│       ├── admin.html
│       └── styles.css
├── tests/
└── README.md
```

## Instalación y configuración

### Requisitos previos

- [Node.js 20 LTS](https://nodejs.org/) o superior
- Cuenta de [Supabase](https://supabase.com) (la base de datos ya está provisionada para el proyecto)
- Git

### 1. Clonar el repositorio

```bash
git clone https://github.com/Adlerero/banco-up-transferencias.git
cd banco-up-transferencias
```

### 2. Configurar el backend

```bash
cd src/backend
npm install
```

Crea un archivo `.env` dentro de `src/backend` con el siguiente contenido:

```env
DATABASE_URL=postgresql://postgres.hmvmoquplzktcwmsvcfu:BoogieWoogie25@aws-0-us-east-1.pooler.supabase.com:6543/postgres
JWT_SECRET=bancoup_secret_2026
PORT=3000
```

> **Nota:** se utiliza el *Session Pooler* de Supabase (puerto 6543) en lugar de la conexión directa, ya que algunas redes (incluyendo redes universitarias) no soportan IPv6, requerido por la conexión directa.

### 3. Levantar el servidor backend

```bash
npm run dev
```

El servidor quedará disponible en `http://localhost:3000`. Si la conexión a Supabase es exitosa, se mostrará en consola:

```
Servidor corriendo en puerto 3000
Conectado a Supabase PostgreSQL
```

### 4. Abrir el frontend

Abre el archivo `src/frontend/index.html` directamente en el navegador (doble clic o arrastrarlo a una pestaña).

> El backend debe estar corriendo en `http://localhost:3000` para que el frontend pueda autenticarse y consultar datos.

## Usuarios de prueba

| Rol | Número de cuenta | Contraseña |
|---|---|---|
| Cliente (Adler) | `1234567890123456` | `pass123` |
| Cliente (Jared) | `9876543210987654` | `pass123` |
| Cliente (Luis Miguel) | `1111222233334444` | `pass123` |
| Administrador | `0000000000000001` | `pass123` |

## Ejecutar pruebas unitarias

```bash
cd src/backend
npm test
```

## Endpoints principales de la API

| Método | Endpoint | Descripción | Auth |
|---|---|---|---|
| POST | `/api/auth/login` | Iniciar sesión | No |
| POST | `/api/auth/logout` | Cerrar sesión | Sí |
| GET | `/api/auth/saldo` | Consultar saldo actual | Sí |
| POST | `/api/transferencias` | Realizar transferencia | Sí |
| GET | `/api/transferencias?page=N` | Historial paginado | Sí |
| GET | `/api/admin/usuarios` | Listar usuarios (admin) | Sí (admin) |
| PUT | `/api/admin/usuarios/:id/bloquear` | Bloquear cuenta (admin) | Sí (admin) |
| PUT | `/api/admin/usuarios/:id/desbloquear` | Desbloquear cuenta (admin) | Sí (admin) |

## Documentación adicional

- Documento SRS completo: `docs/srs/`
- Diagrama Entidad-Relación y Diagrama de Arquitectura: `docs/diagrams/` y [Wiki del proyecto](https://github.com/Adlerero/banco-up-transferencias/wiki)
- Tablero de Jira: requerimientos funcionales y no funcionales del proyecto (Sprints 1 y 2)
