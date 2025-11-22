import { Server as IOServer, Socket } from "socket.io"
import MessagesService from "#services/messages_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"

export default class MessagesController {

    /** Emit message to channel */
    private broadcastToChannel(io: IOServer, channelId: number, payload: any): void {
        io.to(`channel:${channelId}`).emit("channel:event", payload)
    }

    // ────────────────────────────────────────────────────────────────
    // LIST MESSAGES (Paginated batch)
    // ────────────────────────────────────────────────────────────────
    public async list(socket: Socket, data: { channelId: number }): Promise<void> {
        try {
            const channel = await ChannelResolver.byId(data.channelId)

            const result = await MessagesService.getMessages(channel)

            socket.emit("channel:event", {
                type: "messages_list",
                channelId: channel.id,
                ...result,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }

  // ────────────────────────────────────────────────────────────────
  // SEND MESSAGE (Optionally with files)
  // ────────────────────────────────────────────────────────────────
  public async send(
    socket: Socket,
    io: IOServer,
    data: { channelId: number; content?: string; files?: any[] }
  ): Promise<void> {
        try {
            const user = await UserResolver.curr(socket)
            const channel = await ChannelResolver.byId(data.channelId)
            const member = await MemberResolver.byUser(socket, data.channelId)

            const result = await MessagesService.sendMessage(
                channel,
                member!,
                user,
                data.content,
                data.files || []
            )

            this.broadcastToChannel(io, channel.id, {
                type: "message_created",
                channelId: channel.id,
                message: result,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }
}
