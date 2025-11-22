import { Server as IOServer, Socket } from "socket.io"
import ChannelsService from "#services/channels_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"

export default class ChannelsController {

  /** Join socket to socket.io rooms */
  private async joinRooms(socket: Socket, channelId: number) : Promise<void> {
    socket.join(`channel:${channelId}`)
  }

  /** Emit channel update to all members */
  private broadcastToChannel(io: IOServer, channelId: number, payload: any) : void {
    io.to(`channel:${channelId}`).emit("channel:event", payload)
  }

  // ────────────────────────────────────────────────────────────────
  // GET JOINED CHANNELS
  // ────────────────────────────────────────────────────────────────
  public async listJoinedChannels(socket: Socket) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)

      const channels = await ChannelsService.getChannelsByUserId(user.id)

      socket.emit("channel:event", {
        type: "channels_list",
        channels
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // CREATE CHANNEL
  // ────────────────────────────────────────────────────────────────
  public async create(socket: Socket, data: { name: string; isPrivate?: boolean }) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)

      const channel = await ChannelsService.createChannel(user, data)

      await this.joinRooms(socket, channel.id)

      socket.emit("channel:event", {
        type: "channel_created",
        channel
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // JOIN CHANNEL
  // ────────────────────────────────────────────────────────────────
  public async join(socket: Socket, io: IOServer, data: { name: string }) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)

      const result = await ChannelsService.joinChannel(user, data.name)

      await this.joinRooms(socket, result.channel.id)

      this.broadcastToChannel(io, result.channel.id, {
        type: "member_joined",
        channelId: result.channel.id,
        user: { id: user.id, nick: user.nick }
      })

      socket.emit("channel:event", {
        type: "joined_success",
        channel: result.channel
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // LIST MEMBERS
  // ────────────────────────────────────────────────────────────────
  public async listMembers(socket: Socket, data: { channelId: number }) : Promise<void> {
    try {
      const channel = await ChannelResolver.byId(data.channelId)

      const members = await ChannelsService.getMembersByChannelId(channel)

      socket.emit("channel:event", {
        type: "members_list",
        channelId: channel.id,
        members
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // GET INVITED USERS
  // ────────────────────────────────────────────────────────────────
  public async listInvites(socket: Socket, data: { channelId: number }) : Promise<void> {
    try {
      const channel = await ChannelResolver.byId(data.channelId)

      const invited = await ChannelsService.getInvitedMembers(channel)

      socket.emit("channel:event", {
        type: "invites_list",
        channelId: channel.id,
        invited
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // CANCEL CHANNEL / LEAVE
  // ────────────────────────────────────────────────────────────────
  public async cancel(socket: Socket, io: IOServer, data: { channelId: number }) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)
      const channel = await ChannelResolver.byId(data.channelId)
      const member = await MemberResolver.byUser(socket, data.channelId)

      const result = await ChannelsService.cancelChannel(channel, member!)

      this.broadcastToChannel(io, channel.id, {
        type: result.deleted ? "channel_deleted" : "member_left",
        channelId: channel.id,
        userId: user.id
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // KICK MEMBER
  // ────────────────────────────────────────────────────────────────
  public async kick(socket: Socket, io: IOServer, data: { channelId: number; targetMemberId: number }) : Promise<void> {
    try {
      const channel = await ChannelResolver.byId(data.channelId)

      const kicker = await MemberResolver.byUser(socket, data.channelId)
      const target = await MemberResolver.byId(data.targetMemberId)

      const result = await ChannelsService.castKickVote(kicker!, target)

      this.broadcastToChannel(io, channel.id, {
        type: "kick_result",
        channelId: channel.id,
        result
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // UPDATE NOTIFICATION STATUS
  // ────────────────────────────────────────────────────────────────
  public async updateNotif(socket: Socket, io: IOServer, data: { channelId: number; status: string }) : Promise<void> {
    try {
      const member = await MemberResolver.byUser(socket, data.channelId)
      const notif_status = await ChannelsService.updateNotifStatus(member!, data.status as any)

      this.broadcastToChannel(io, data.channelId, {
        type: "notif_updated",
        channelId: data.channelId,
        status: notif_status,
        memberId: member!.id
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

}