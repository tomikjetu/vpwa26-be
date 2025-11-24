import { MemberNotFoundException } from '#exceptions/exceptions'
import Member from '#models/member'
import User from '#models/user'
import { Socket } from 'socket.io'

export default class MemberResolver {

  static async byId(member_id: number) {

    // Try to find the member
    const member = await Member.find(member_id)

    // If not found, return 404 response
    if (!member) throw new MemberNotFoundException()

    // Return
    return member
  }

  static async byUser(socket: Socket, channel_id: number) {

    // Get user
    const user = (socket as any).user
    
    // Try to find the member
    const member = await Member.query().where({'user_id': user!.id, 'channel_id': channel_id}).first()

    // Return
    return member
  }

  static async addExtras(memberId: number) {
    // Load the member + received kick votes
    const member = await Member.query()
      .where('id', memberId)
      .preload('receivedKickVotes')   // same as before
      .firstOrFail()

    const json = member.toJSON()

    // Load the linked user
    const user = await User.query()
      .where('id', json.userId)
      .select(['id', 'status', 'nick'])
      .firstOrFail()

    // Extract acting member IDs from kick votes
    const kickVotes: number[] = (json.receivedKickVotes || []).map(
      (kv: any) => kv.actingMemberId
    )

    // Build the final payload (same format as addMembers)
    const result = {
      ...json,
      status: user.status,
      nickname: user.nick,
      receivedKickVotes: kickVotes,
    }

    return result
  }
}