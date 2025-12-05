import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import Message from './message.js'
import Channel from './channel.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class File extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare messageId: number // Foreign Key to Messages

  @column()
  declare path: string // Maps to 'text' in DB

  @column()
  declare name: string

  @column()
  declare size: number

  @column()
  declare mime_type: string

  @column()
  declare channelId: number // Foreign key for channel

  @belongsTo(() => Message)
  declare message: BelongsTo<typeof Message>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>
}