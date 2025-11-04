import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import User from './user.js'
import Channel from './channel.js'
import File from './file.js'

import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number // Foreign Key to Users

  @column()
  declare channelId: number // Foreign Key to Channels

  @column()
  declare content: string // Type should map to 'text' in the DB (string in TS)

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships (for completeness)
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => File)
  declare files: HasMany<typeof File>
}