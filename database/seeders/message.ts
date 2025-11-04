import Channel from '#models/channel'
import Message from '#models/message'
import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class MessageSeeder extends BaseSeeder {
  public async run() {
    const johnDoe = await User.findBy('nick', 'jd_admin')
    const janeSmith = await User.findBy('nick', 'jane_s')
    const generalChannel = await Channel.findBy('name', 'general')

    if (!johnDoe || !janeSmith || !generalChannel) {
      console.error('Dependency data missing. Run UserSeeder and ChannelSeeder first.')
      return
    }

    await Message.createMany([
      {
        userId: johnDoe.id,
        channelId: generalChannel.id,
        content: 'Welcome everyone to the general chat! Happy coding!',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        userId: janeSmith.id,
        channelId: generalChannel.id,
        content: 'Thanks, John! Great to be here.',
        createdAt: DateTime.now().plus({ minutes: 5 }),
        updatedAt: DateTime.now().plus({ minutes: 5 }),
      },
      {
        userId: johnDoe.id,
        channelId: generalChannel.id,
        content: 'Remember to check the new dev channel for updates.',
        createdAt: DateTime.now().plus({ minutes: 10 }),
        updatedAt: DateTime.now().plus({ minutes: 10 }),
      },
    ])
  }
}