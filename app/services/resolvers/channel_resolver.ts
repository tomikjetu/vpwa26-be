import { ChannelNotFoundException } from '#exceptions/exceptions'
import Channel from '#models/channel'
import User from '#models/user'

export default class ChannelResolver {
    
  static async byId(channel_id: number) {

    // Try to find the channel
    const channel = await Channel.find(channel_id)

    // If not found, return 404 response
    if (!channel) throw new ChannelNotFoundException()
    
    // Return
    return channel
  }

  static async addMembers(channelId: number) {

    const channel = await Channel.query()
      .where('id', channelId)
      .preload('members', (memberQuery) => {
        memberQuery.preload('receivedKickVotes') 
      })
      .firstOrFail()

    const json = channel.toJSON()

    const membersMap: Record<number, any> = {}

    for (const member of json.members) {
      const user = await User.query()
        .where('id', member.userId)
        .select(['id', 'status', 'nick'])
        .firstOrFail()

      const kickVotes: number[] = (member.receivedKickVotes || []).map(
        (kv: any) => kv.actingMemberId
      )

      membersMap[member.id] = {
        ...member,
        status: user.status,
        nickname: user.nick,
        receivedKickVotes: kickVotes,
      }
    }

    json.members = membersMap
    return json
  }
}