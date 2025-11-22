import { Server as IOServer, Socket } from "socket.io"
import InvitesService from "#services/invites_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"

export default class InvitesController {

    /** Emit channel updates */
    private broadcastToChannel(io: IOServer, channelId: number, payload: any): void {
        io.to(`channel:${channelId}`).emit("channel:event", payload)
    }

    private broadcastToUser(io: IOServer, userId: number, payload: any): void {
        io.to(`user:${userId}`).emit("user:event", payload)
    }

    // ────────────────────────────────────────────────────────────────
    // LIST INVITES (For a user)
    // ────────────────────────────────────────────────────────────────
    public async list(socket: Socket): Promise<void> {
        try {
            const user = await UserResolver.curr(socket)

            const invites = await InvitesService.getInvites(user.id)

            socket.emit("channel:event", {
                type: "invites_list",
                invites,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }

    // ────────────────────────────────────────────────────────────────
    // CREATE INVITE
    // ────────────────────────────────────────────────────────────────
    public async create(socket: Socket, io: IOServer, data: { channelId: number; userId: number }): Promise<void> {
        try {
            const channel = await ChannelResolver.byId(data.channelId)

            const actingMember = await MemberResolver.byUser(socket, data.channelId)
            const invitedUser = await UserResolver.byId(data.userId)

            const result = await new InvitesService().createInvite(channel, actingMember!, invitedUser)

            this.broadcastToChannel(io, channel.id, {
                type: "invite_created",
                channelId: channel.id,
                user: invitedUser,
            })

            this.broadcastToUser(io, invitedUser.id, {
                type: "is_invited",
                channelId: channel.id,
                user: actingMember,
            })

            socket.emit("channel:event", {
                type: "invite_create_success",
                result,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }

    // ────────────────────────────────────────────────────────────────
    // ACCEPT INVITE
    // ────────────────────────────────────────────────────────────────
    public async accept(socket: Socket, io: IOServer, data: { channelId: number }): Promise<void> {
        try {
            const user = await UserResolver.curr(socket)

            const channelId = await InvitesService.acceptInvite(data.channelId, user.id)

            // join rooms AFTER membership is created
            socket.join(`channel:${channelId}`)

            this.broadcastToChannel(io, channelId, {
                type: "invite_accepted",
                channelId,
                user: { id: user.id, nick: user.nick },
            })

            socket.emit("channel:event", {
                type: "invite_accept_success",
                channelId,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }

}