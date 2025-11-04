import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import * as ChannelModel from './channel.js'
import * as MessageModel from './message.js'
import * as MemberModel from './member.js'
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
  declare passwdHash: string // Note: Consider a different name like 'password' and a mutator

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  // Relationships (for completeness)
  @hasMany(() => ChannelModel.default, { foreignKey: 'ownerId' })
  declare ownedChannels: HasMany<typeof ChannelModel.default>

  @hasMany(() => MessageModel.default)
  declare messages: HasMany<typeof MessageModel.default>

  @hasMany(() => MemberModel.default)
  declare members: HasMany<typeof MemberModel.default>
}