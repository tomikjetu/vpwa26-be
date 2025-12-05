import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'members'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.enu('notif_status', ['all', 'mentions', 'none']).notNullable().defaultTo('all')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('notif_status')
    })
  }
}