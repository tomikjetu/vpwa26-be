import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'messages'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('user_id')
      table.integer('member_id').unsigned().references('id').inTable('members').onDelete('CASCADE').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('member_id')
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').nullable()
    })
  }
}