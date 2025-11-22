import { Server as IOServer, Socket } from "socket.io"
import UserResolver from "#services/resolvers/user_resolver"
import UsersService from "#services/users_service"
import { UserStatus } from "types/string_literals.js"

export default class UsersWsController {

  // Broadcast status change to people who care
  private broadcastStatus(io: IOServer, userId: number, status: UserStatus) : void {
    io.to(`user:${userId}`).emit("user:event", {
      type: "status_updated",
      userId,
      status
    })
  }

  // WebSocket method to update status
  public async updateStatus(socket: Socket, io: IOServer, data: { status: UserStatus }) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)

      await UsersService.updateUserStatus(user, data)

      // Notify user (and potentially others)
      this.broadcastStatus(io, user.id, data.status)

      socket.emit("user:event", {
        type: "status_update_success",
        status: data.status
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
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
          status: (user as any).status ?? null
        }
      })
      
    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }
}