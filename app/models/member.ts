import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo, hasMany} from '@adonisjs/lucid/orm'
import User from './user.js'
import Channel from './channel.js'
import type { HasMany, BelongsTo } from '@adonisjs/lucid/types/relations'
import KickVote from './kick_vote.js'
import type { NotifStatus } from 'types/string_literals.js'

export default class Member extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
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
  declare kickVotes: number

  @column()
  declare notif_status: NotifStatus

  // Relationships (for completeness)
  @belongsTo(() => User, {foreignKey: 'userId'})
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>

  @hasMany(() => KickVote, {
    foreignKey: 'targetMemberId',
  })
  declare receivedKickVotes: HasMany<typeof KickVote>

  @hasMany(() => KickVote, {
    foreignKey: 'actingMemberId',
  })
  declare castKickVotes: HasMany<typeof KickVote>
}