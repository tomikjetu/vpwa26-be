import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('channel_id').unsigned().references('id').inTable('channels').onDelete('CASCADE').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('channel_id')
    })
  }
}