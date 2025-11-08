import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import Channel from './channel.js'
import Message from './message.js'
import Member from './member.js'
import Invite from './invite.js'
import type { HasMany } from '@adonisjs/lucid/types/relations'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email'],
  passwordColumnName: 'passwdHash',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare firstName: string

  @column()
  declare lastName: string

  @column()
  declare email: string

  @column()
  declare nick: string

  @column()
  declare passwdHash: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships (for completeness)
  @hasMany(() => Channel, { foreignKey: 'ownerId' })
  declare ownedChannel: HasMany<typeof Channel>

  @hasMany(() => Message)
  declare message: HasMany<typeof Message>

  @hasMany(() => Member)
  declare member: HasMany<typeof Member>
  
  @hasMany(() => Invite)
  declare invite: HasMany<typeof Invite>
}