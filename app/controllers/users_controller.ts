import { Server as IOServer, Socket } from "socket.io"
import UserResolver from "#services/resolvers/user_resolver"
import { UserStatus } from "types/string_literals.js"
import Member from "#models/member"

export default class UsersWsController {

  // WebSocket method to update status (user manually changing their status)
  public async updateStatus(socket: Socket, io: IOServer, data: { status: UserStatus }) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)

      // Update user status in database
      user.status = data.status
      await user.save()

      // Broadcast status update to all users who share a channel with this user
      await this.broadcastStatusUpdate(io, user.id, data.status)

      socket.emit("user:event", {
        type: "status_update_success",
        status: data.status
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  /**
   * Broadcast status update to all users who share a channel with this user
   */
  public async broadcastStatusUpdate(io: IOServer, userId: number, status: UserStatus): Promise<void> {
    try {
      // Get all channels the user is in
      const members = await Member.query()
        .where('user_id', userId)
        .select('channel_id')
      
      const channelIds = members.map(m => m.channelId)
      
      if (channelIds.length === 0) return

      // Get all members who share these channels (excluding the user themselves)
      const sharedMembers = await Member.query()
        .whereIn('channel_id', channelIds)
        .whereNot('user_id', userId)
        .select('user_id')
        .groupBy('user_id')

      const notifiedUserIds = new Set<number>()

      // Broadcast to each unique user
      for (const member of sharedMembers) {
        if (!notifiedUserIds.has(member.userId)) {
          notifiedUserIds.add(member.userId)
          io.to(`user:${member.userId}`).emit("user:event", {
            type: "status_updated",
            userId,
            status
          })
        }
      }
    } catch (error) {
      console.error('Error broadcasting status:', error)
    }
  }

  // ────────────────────────────────────────────────────────────────
  // RETURN USER PROFILE
  // ────────────────────────────────────────────────────────────────
  public async me(socket: Socket) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)

      socket.emit("user:event", {
        type: "profile",
        user: {
          id: user.id,
          nick: user.nick,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          status: user.status
        }
      })
      
    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }
}