import { DateTime } from 'luxon'
import { BaseModel, column, belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Member from './member.js'

export default class KickVote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare votedMemberId: number // Foreign Key to Member being voted on

  @column()
  declare voterMemberId: number // Foreign Key to Member who voted

  @column()
  declare kickedByOwner: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  
  // Relationships (for completeness)
  @belongsTo(() => Member)
  declare voted_member: BelongsTo<typeof Member>

  @belongsTo(() => Member)
  declare voter_member: BelongsTo<typeof Member>
}