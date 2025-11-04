import { defineConfig } from '@adonisjs/lucid'
import env from '#start/env'

const DEFAULT_PORT = 5432

const dbConfig = defineConfig({
  connection: env.get('DB_CONNECTION') || 'pg',
  connections: {
    pg: {
      client: 'pg',
      connection: {
        host: env.get('DB_HOST') || '127.0.0.1',
        port: Number(env.get('DB_PORT') || DEFAULT_PORT),
        user: env.get('DB_USER') || 'postgres',
        password: env.get('DB_PASSWORD') || '',
        database: env.get('DB_NAME') || 'adonis',
  },
      migrations: {
        naturalSort: true,
        paths: ['database/migrations'],
      },
    }
  },
})

export default dbConfig