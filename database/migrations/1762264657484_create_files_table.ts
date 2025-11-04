import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()

      // Foreign Key (message_id is NOT NULL (NN))
      table.integer('message_id').unsigned().references('id').inTable('messages').onDelete('CASCADE').notNullable()

      // Columns from the schema
      table.text('content').notNullable() // Assuming this is the file data/path/hash
      table.string('name').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}