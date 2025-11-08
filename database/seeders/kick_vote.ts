import KickVote from '#models/kick_vote'
import Member from '#models/member'
import User from '#models/user'
import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class KickVoteSeeder extends BaseSeeder {
  public async run() {
    const johnDoe = await User.findBy('nick', 'jd_admin')
    const tomWilson = await User.findBy('nick', 'twil')
    const generalChannel = await Channel.findBy('name', 'general')

    if (!johnDoe || !tomWilson || !generalChannel) {
      console.error('Dependency data missing. Run UserSeeder and ChannelSeeder first.')
      return
    }

    // Find the Member record for Tom in the general channel
    const tomMember = await Member.query()
      .where('userId', tomWilson.id)
      .andWhere('channelId', generalChannel.id)
      .first()

    if (!tomMember) {
      console.error('Tom is not a member of the general channel. Run MemberSeeder first.')
      return
    }

    // Since this is a log of votes, we simply create new records
    await KickVote.createMany([
      {
        votedUserId: tomMember.id, // The member being voted on (Tom)
        voterUserId: johnDoe.id, // The user who cast the vote (John)
        kickedByOwner: true, // Assuming John is the owner and this was his final vote/action
        createdAt: DateTime.now().minus({ hours: 1 }),
      },
    ])
  }
}