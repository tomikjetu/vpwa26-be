import { MemberNotFoundException } from '#exceptions/exceptions'
import Member from '#models/member'
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
}