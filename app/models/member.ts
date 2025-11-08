import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany} from '@adonisjs/lucid/orm'
import User from './user.js'
import Channel from './channel.js'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import KickVote from './kick_vote.js'

export default class Member extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare userId: number // Foreign Key to Users

  @column()
  declare channelId: number // Foreign Key to Channels

  @column()
  declare isOwner: boolean

  @column.dateTime()
  declare joinedAt: DateTime

  @column()
  declare lastReadMessageId: number | null // Could reference a message ID

  @column.dateTime()
  declare lastReadAt: DateTime | null

  @column()
  declare kick_votes: number

  @column()
  declare notif_status: 'all' | 'mentions' | 'none'

  // Relationships (for completeness)
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => KickVote)
  declare kickVote: HasMany<typeof KickVote>
}