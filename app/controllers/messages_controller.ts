import { Server as IOServer, Socket } from "socket.io"
import MessagesService from "#services/messages_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"
import { extractMentions } from "#services/regex_helper"

export default class MessagesController {

    /** Emit message to channel */
    private broadcastToChannel(io: IOServer, channelId: number, event: string, payload: any): void {
        io.to(`channel:${channelId}`).emit(event, payload)
    }

    private broadcastToUser(io: IOServer, userId: number, event: string, payload: any): void {
        io.to(`user:${userId}`).emit(event, payload)
    }

    // ────────────────────────────────────────────────────────────────
    // LIST MESSAGES (Paginated batch)
    // ────────────────────────────────────────────────────────────────
    public async list(socket: Socket, data: { channelId: number, offset: number }): Promise<void> {
        try {
            const channel = await ChannelResolver.byId(data.channelId)
            const member = await MemberResolver.curr(socket, data.channelId)

            const result = await MessagesService.getMessages(channel, member, data.offset)

            socket.emit("msg:list", {
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
            const member = await MemberResolver.curr(socket, data.channelId)

            const result = await MessagesService.sendMessage(
                channel,
                member!,
                user,
                data.content,
                data.files || []
            )
            const mentionedMemberIds = extractMentions(result.message.content);

            const mentionsOnlyMembers = await MemberResolver.mentionsOnly(data.channelId);

            const mentionedMembers = mentionsOnlyMembers
                .filter(member => mentionedMemberIds.includes(member.id));

            const mentionedUsers = mentionedMembers.map(member => member.user);

            for(const user of mentionedUsers) {
                this.broadcastToUser(io, user.id, "message:new", {
                    channelId: channel.id,
                    message: result.emit,
                    memberId: member?.id,
                })            
            }

            this.broadcastToChannel(io, channel.id, "message:new", {
                channelId: channel.id,
                message: result.emit,
                memberId: member?.id,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }
}
