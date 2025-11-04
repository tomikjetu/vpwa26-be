import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Message from './message.js'

import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class File extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare messageId: number // Foreign Key to Messages

  @column()
  declare content: string // Maps to 'text' in DB

  @column()
  declare name: string

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>
}