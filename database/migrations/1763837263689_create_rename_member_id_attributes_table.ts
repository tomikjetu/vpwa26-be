import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kick_votes'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('voted_member_id')
      table.dropColumn('voter_member_id')

      table.integer('target_member_id').unsigned().references('id').inTable('members').onDelete('CASCADE').notNullable()
      table.integer('acting_member_id').unsigned().references('id').inTable('members').onDelete('CASCADE').notNullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('target_member_id')
      table.dropColumn('acting_member_id')

      table.integer('voted_member_id').unsigned().references('id').inTable('members').onDelete('CASCADE').notNullable()
      table.integer('voter_member_id').unsigned().references('id').inTable('members').onDelete('CASCADE').notNullable()
    })
  }
}