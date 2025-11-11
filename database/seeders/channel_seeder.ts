import User from '#models/user'
import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class ChannelSeeder extends BaseSeeder {
  public async run() {
    const uniqueKey = 'name'

    // Fetch a user to be the owner (e.g., the first user created)
    const johnDoe = await User.findBy('email', 'john.doe@example.com')
    const janeSmith = await User.findBy('email', 'jane.smith@example.com')

    if (!johnDoe || !janeSmith) {
      console.error('User data missing. Please run UserSeeder first.')
      return
    }

    await Channel.updateOrCreateMany(uniqueKey, [
      {
        ownerId: johnDoe.id,
        name: 'general',
        isPrivate: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        ownerId: johnDoe.id,
        name: 'development',
        isPrivate: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        ownerId: janeSmith.id,
        name: 'private-chat',
        isPrivate: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ])
  }
}