import { randomBytes } from 'node:crypto'
import { createServer } from 'node:http'
import { hashPassword } from './auth'
import { config } from './config'
import { Router } from './http'
import { newId } from './logic'
import { accountRoutes } from './routes/account'
import { adminRoutes } from './routes/admin'
import { publicRoutes } from './routes/public'
import { createJsonStore } from './store'

const db = createJsonStore(config.dataDir, config.seedDir)

// make sure an admin account exists
const admin = await db.customers.find((c) => c.role === 'admin')
if (!admin || config.adminPassword) {
  const password = config.adminPassword ?? randomBytes(6).toString('base64url')
  const passwordHash = await hashPassword(password)
  if (admin) await db.customers.update(admin.id, { email: config.adminEmail, passwordHash })
  else
    await db.customers.insert({
      id: newId('admin'), name: 'Quản trị JAMIR', email: config.adminEmail, provider: 'password', role: 'admin',
      addresses: [], createdAt: new Date().toISOString(), passwordHash,
    })
  if (!config.adminPassword) console.log(`[admin] created ${config.adminEmail} / ${password}  (set ADMIN_PASSWORD to choose it)`)
}

const router = new Router()
router.get('/health', () => ({ ok: true }))
publicRoutes(router, db)
accountRoutes(router, db)
adminRoutes(router, db)

const server = createServer((req, res) => router.handle(req, res))
server.listen(config.port, config.host, () => {
  console.log(`[jamir-api] http://${config.host}:${config.port}  data=${config.dataDir}`)
})

const shutdown = () => {
  db.flush()
  server.close(() => process.exit(0))
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
