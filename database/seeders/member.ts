import Member from '#models/member'
import Message from '#models/message'
import User from '#models/user'
import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

type MemberColumn = 'id' | 'userId' | 'channelId' | 'isOwner' | 'joinedAt' | 'lastReadMessageId' | 'lastReadAt';
export default class MemberSeeder extends BaseSeeder {
  public async run() {
    const johnDoe = await User.findBy('nick', 'jd_admin')
    const janeSmith = await User.findBy('nick', 'jane_s')
    const tomWilson = await User.findBy('nick', 'twil')
    const generalChannel = await Channel.findBy('name', 'general')
    const lastMessage = await Message.query().orderBy('id', 'desc').first()

    if (!johnDoe || !janeSmith || !tomWilson || !generalChannel || !lastMessage) {
      console.error('Dependency data missing. Run User/Channel/Message Seeders first.')
      return
    }

    const uniqueKeys = ['userId', 'channelId'] as MemberColumn[]

    await Member.updateOrCreateMany(uniqueKeys, [
      {
        userId: johnDoe.id,
        channelId: generalChannel.id,
        isOwner: true,
        joinedAt: DateTime.now().minus({ days: 7 }),
        lastReadMessageId: lastMessage.id,
        lastReadAt: DateTime.now(),
      },
      {
        userId: janeSmith.id,
        channelId: generalChannel.id,
        isOwner: false,
        joinedAt: DateTime.now().minus({ days: 6 }),
        lastReadMessageId: lastMessage.id,
        lastReadAt: DateTime.now(),
      },
      {
        userId: tomWilson.id,
        channelId: generalChannel.id,
        isOwner: false,
        joinedAt: DateTime.now().minus({ days: 3 }),
        // Tom hasn't read the latest message yet
        lastReadMessageId: lastMessage.id - 1, 
        lastReadAt: DateTime.now().minus({ hours: 10 }),
      },
    ])
  }
}