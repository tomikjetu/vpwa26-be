import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    // First update existing values to new enum values
    await this.db.rawQuery(`UPDATE users SET status = 'active' WHERE status IN ('online', 'offline')`)
    
    // Drop the old column and create new one with updated enum
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
    })

    this.schema.alterTable(this.tableName, (table) => {
      // New enum: only 'active' and 'dnd' - offline is socket state, not user status
      table.enu('status', ['active', 'dnd']).notNullable().defaultTo('active')
      // Connection state: whether user's socket is currently connected
      table.boolean('is_connected').notNullable().defaultTo(false)
    })
  }

  async down() {
    // Revert to old enum
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('status')
      table.dropColumn('is_connected')
    })

    this.schema.alterTable(this.tableName, (table) => {
      table.enu('status', ['online', 'dnd', 'offline']).notNullable().defaultTo('offline')
    })
  }
}
