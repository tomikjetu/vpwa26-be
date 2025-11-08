import Member from '#models/member'
import User from '#models/user'
import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

type MemberColumn = 'id' | 'userId' | 'channelId' | 'isOwner' | 'joinedAt' | 'lastReadMessageId' | 'lastReadAt' | 'kick_votes' | 'notif_status';
export default class MemberSeeder extends BaseSeeder {
  public async run() {
    const johnDoe = await User.findBy('nick', 'jd_admin')
    const janeSmith = await User.findBy('nick', 'jane_s')
    const tomWilson = await User.findBy('nick', 'twil')
    const generalChannel = await Channel.findBy('name', 'general')

    if (!johnDoe || !janeSmith || !tomWilson || !generalChannel) {
      console.error('Dependency data missing. Run User/Channel Seeders first.')
      return
    }

    const uniqueKeys = ['userId', 'channelId'] as MemberColumn[]

    await Member.updateOrCreateMany(uniqueKeys, [
      {
        userId: johnDoe.id,
        channelId: generalChannel.id,
        isOwner: true,
        joinedAt: DateTime.now().minus({ days: 7 }),
        lastReadMessageId: null,
        lastReadAt: null,
        kick_votes: 0,
        notif_status: 'all',
      },
      {
        userId: janeSmith.id,
        channelId: generalChannel.id,
        isOwner: false,
        joinedAt: DateTime.now().minus({ days: 6 }),
        lastReadMessageId: null,
        lastReadAt: null,
        kick_votes: 0,
        notif_status: 'mentions',
      },
      {
        userId: tomWilson.id,
        channelId: generalChannel.id,
        isOwner: false,
        joinedAt: DateTime.now().minus({ days: 3 }),
        lastReadMessageId: null, 
        lastReadAt: null,
        kick_votes: 1,
        notif_status: 'none',
      },
    ])
  }
}