import { BaseModel, column, belongsTo} from '@adonisjs/lucid/orm'
import User from './user.js'
import Channel from './channel.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { DateTime } from 'luxon'

export default class Member extends BaseModel {
  public static table = 'invites'

  @column({ isPrimary: true })
  declare id: number

  @column({ columnName: 'user_id' })
  declare userId: number // Foreign Key to Users

  @column({ columnName: 'channel_id' })
  declare channelId: number // Foreign Key to Channels

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  // Relationships (for completeness)
  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>

  @belongsTo(() => Channel)
  declare channel: BelongsTo<typeof Channel>
}