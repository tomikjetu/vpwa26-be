import { Server as IOServer, Socket } from "socket.io"
import MessagesService from "#services/messages_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"
import { extractMentions } from "#services/regex_helper"

export default class MessagesController {
    /**
     * Map to track typing users per channel
     * Structure: channelId -> Map(memberId -> { memberId, message })
     * Note: typing entries are only cleared when the client sends an empty message.
     * We send `memberId` (not nickname) in the broadcast so clients can resolve display names locally.
     */
    private typingMap: Map<number, Map<number, { memberId: number; message: string }>> = new Map()

    /** Emit message to channel */
    private broadcastToChannel(io: IOServer, channelId: number, event: string, payload: any): void {
        io.to(`channel:${channelId}`).emit(event, payload)
    }

    /** 
     * Emit message to channel, but exclude offline users
     * For messages, we don't want to send to offline users since they "disconnected"
     */
    private async broadcastMessageToChannel(io: IOServer, channelId: number, event: string, payload: any): Promise<void> {
        // Get all members of the channel
        const Member = (await import('#models/member')).default
        const members = await Member.query()
            .where('channel_id', channelId)
            .preload('user')
        
        for (const member of members) {
            if (member.user && member.user.status !== 'offline') {
                io.to(`user:${member.userId}`).emit(event, payload)
            }
        }
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
  // TYPING INDICATOR
  // ────────────────────────────────────────────────────────────────
  public async typing(
    socket: Socket,
    io: IOServer,
    data: { channelId: number; message: string }
  ): Promise<void> {
        try {
            const member = await MemberResolver.curr(socket, data.channelId)
            
            if (!member) {
                socket.emit("error", { error: "You are not a member of this channel" })
                return
            }

            // Initialize channel map if not exists
            if (!this.typingMap.has(data.channelId)) {
                this.typingMap.set(data.channelId, new Map())
            }

            const channelTyping = this.typingMap.get(data.channelId)!

            // If message is empty, member stopped typing (clients must emit empty message to clear)
            if (!data.message || data.message.trim() === '') {
                channelTyping.delete(member.id)

                // Broadcast updated typing list (send memberId instead of nickname)
                this.broadcastToChannel(io, data.channelId, "msg:typing", {
                    channelId: data.channelId,
                    typing: Array.from(channelTyping.values()).map(t => ({
                        memberId: t.memberId,
                        message: t.message
                    }))
                })
                return
            }

            // Update typing state (no auto-clear on server)
            channelTyping.set(member.id, {
                memberId: member.id,
                message: data.message
            })

            // Broadcast typing status to all users in the channel (send memberId instead of nickname)
            this.broadcastToChannel(io, data.channelId, "msg:typing", {
                channelId: data.channelId,
                typing: Array.from(channelTyping.values()).map(t => ({
                    memberId: t.memberId,
                    message: t.message
                }))
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
            
            // Check if user is offline - they cannot send messages
            if (user.status === 'offline') {
                socket.emit("error", { error: "You cannot send messages while offline. Change your status to send messages." })
                return
            }
            
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
                // Only notify if user is not offline
                if (user.status !== 'offline') {
                    this.broadcastToUser(io, user.id, "message:new", {
                        channelId: channel.id,
                        message: result.emit,
                        memberId: member?.id,
                    })
                }
            }

            // Broadcast to channel, excluding offline users
            await this.broadcastMessageToChannel(io, channel.id, "message:new", {
                channelId: channel.id,
                message: result.emit,
                memberId: member?.id,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }
}
