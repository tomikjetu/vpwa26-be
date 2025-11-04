import { DateTime } from 'luxon'
import { BaseModel, column, } from '@adonisjs/lucid/orm'

export default class KickVote extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare memberId: number // Foreign Key to Member being voted on

  @column()
  declare voterUserId: number // Foreign Key to User who voted

  @column()
  declare kickedByOwner: boolean

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime
  
}