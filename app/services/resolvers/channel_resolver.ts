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

  static async enrich(channelId: number) {

    const channel = await Channel.query()
      .where('id', channelId)
      .preload('members', (memberQuery) => {
        memberQuery.preload('receivedKickVotes') 
      })
      .firstOrFail()

    const json = channel.toJSON()

    const enrichedMembers: Record<number, any> = {}

    for (const member of json.members) {
      const user = await User.query()
        .where('id', member.userId)
        .select(['id', 'status', 'is_connected', 'nick'])
        .firstOrFail()

      const kickVotes: number[] = (member.receivedKickVotes || []).map(
        (kv: any) => kv.actingMemberId
      )

      enrichedMembers[member.id] = {
        ...member,
        status: user.status,
        isConnected: user.isConnected,
        nickname: user.nick,
        receivedKickVotes: kickVotes,
      }
    }

    json.members = enrichedMembers
    return json
  }
}