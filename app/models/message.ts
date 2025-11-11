import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany } from '@adonisjs/lucid/orm'
import Channel from './channel.js'
import File from './file.js'

import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import Member from './member.js'

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare memberId: number // Foreign Key to Users

  @column()
  declare channelId: number // Foreign Key to Channels

  @column()
  declare content: string // Type should map to 'text' in the DB (string in TS)

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships (for completeness)
  @belongsTo(() => Member)
  declare member: BelongsTo<typeof Member>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => File)
  declare files: HasMany<typeof File>
}