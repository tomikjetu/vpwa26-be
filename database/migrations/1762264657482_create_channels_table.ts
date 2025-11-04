import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'channels'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign Key (owner_id references users.id)
      table.integer('owner_id').unsigned().references('id').inTable('users').onDelete('CASCADE').notNullable()

      // Columns from the schema
      table.string('name').notNullable()
      table.boolean('is_private').defaultTo(false).notNullable()

      // Timestamps
      table.timestamp('created_at', { useTz: true }).notNullable()
      table.timestamp('updated_at', { useTz: true }).notNullable()
      table.timestamp('deleted_at', { useTz: true }).nullable() // Soft delete
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}