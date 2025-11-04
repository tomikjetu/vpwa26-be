import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'kick_votes'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign Keys (All are NOT NULL (NN))
      table.integer('member_id').unsigned().references('id').inTable('members').onDelete('CASCADE').notNullable()
      table.integer('voter_user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()

      // Columns from the schema
      table.boolean('kicked_by_owner').defaultTo(false)

      // Timestamps (only created_at in the diagram)
      table.timestamp('created_at', { useTz: true }).notNullable()
      // Note: No updated_at in the diagram, so it's omitted here.
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}