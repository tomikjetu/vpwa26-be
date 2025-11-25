import { Server as IOServer, Socket } from "socket.io"
import InvitesService from "#services/invites_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"
import InviteResolver from "#services/resolvers/invite_resolver"
import Invite from '#models/invite'

export default class InvitesController {

    /** Emit channel updates */
    private broadcastToChannel(io: IOServer, channelId: number, event: string, payload: any): void {
        io.to(`channel:${channelId}`).emit(event, payload)
    }

    private broadcastToUser(io: IOServer, userId: number, event: string, payload: any): void {
        io.to(`user:${userId}`).emit(event, payload)
    }

    // ────────────────────────────────────────────────────────────────
    // LIST INVITES (For a user)
    // ────────────────────────────────────────────────────────────────
    public async list(socket: Socket): Promise<void> {
        try {
            const user = await UserResolver.curr(socket)

            const invites = await InvitesService.getInvites(user.id)

            const enriched_invites : any[] = []
            for (const invite of invites) {
                enriched_invites.push(await InviteResolver.enrich(invite))
            }

            socket.emit("invite:list", {
                invites: enriched_invites,
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }

    // ────────────────────────────────────────────────────────────────
    // CREATE INVITE
    // ────────────────────────────────────────────────────────────────
    public async create(socket: Socket, io: IOServer, data: { channelId: number; nickname: string }): Promise<void> {
        try {
            const channel = await ChannelResolver.byId(data.channelId)

            const actingMember = await MemberResolver.byUser(socket, data.channelId)
            const invitedUser = await UserResolver.byNick(data.nickname)

            const result = await new InvitesService().createInvite(channel, actingMember!, invitedUser)

            // this.broadcastToChannel(io, channel.id, "", {
            //     type: "invite_created",
            //     channelId: channel.id,
            //     user: invitedUser,
            // })

            this.broadcastToUser(io, invitedUser.id, "channel:invite:received", {
                ...result,
                channelId: channel.id
            })

            socket.emit("invite:sent", {
                ...result,
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

            const result = await InvitesService.acceptInvite(data.channelId, user.id)

            const channel = await ChannelResolver.byId(result.channelId)
            // join rooms AFTER membership is created
            socket.join(`channel:${result.channelId}`)

            this.broadcastToChannel(io, result.channelId, "member:joined", {
                channelId: result.channelId,
                member: result.member,
            })

            socket.emit("channel:invite:accepted", {
                channel,
                userId: user.id
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }

    public async decline(socket: Socket, data: {channelId: number}): Promise<void> {
        try {
            const user = await UserResolver.curr(socket)

            const channelId = await InvitesService.declineInvite(data.channelId, user.id)

            await ChannelResolver.byId(channelId)

            socket.emit("channel:invite:declined", {
                channelId,
                userId: user.id
            })

        } catch (err: any) {
            socket.emit("error", { error: err.message })
        }
    }
}