import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'members'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign Keys
      table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()
      table.integer('channel_id').unsigned().references('id').inTable('channels').onDelete('CASCADE').notNullable()

      // Ensure a user can only be a member of a channel once (Composite Unique Key)
      table.unique(['user_id', 'channel_id']) 

      // Columns from the schema
      table.boolean('is_owner').defaultTo(false).notNullable()
      table.timestamp('joined_at', { useTz: true }).notNullable()
      
      table.integer('last_read_message_id').unsigned().nullable() 

      table.timestamp('last_read_at', { useTz: true }).nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}