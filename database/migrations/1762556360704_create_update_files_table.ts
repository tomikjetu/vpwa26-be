import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'files'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('path').notNullable()
      table.string('mime_type').nullable()
      table.integer('size').notNullable()
      table.dropColumn('content')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('path')
      table.dropColumn('mime_type')
      table.dropColumn('size')
      table.text('content').nullable()
    })
  }
}