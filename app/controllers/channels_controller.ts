import { Server as IOServer, Socket } from "socket.io"
import ChannelsService from "#services/channels_service"

import ChannelResolver from "#services/resolvers/channel_resolver"
import MemberResolver from "#services/resolvers/member_resolver"
import UserResolver from "#services/resolvers/user_resolver"
import { NotifStatus } from "types/string_literals.js"

export default class ChannelsController {

  /** Join socket to socket.io rooms */
  private async joinRooms(socket: Socket, channelId: number) : Promise<void> {
    console.log("adding socket to room")
    socket.join(`channel:${channelId}`)
  }

  private async deleteRooms(socket: Socket, channelId: number) : Promise<void> {
    console.log("removing socket from room")
    socket.leave(`channel:${channelId}`)
  }

  /** Emit channel update to all members */
  private broadcastToChannel(io: IOServer, channelId: number, event: string, payload: any) : void {
    io.to(`channel:${channelId}`).emit(event, payload)
  }


  // ────────────────────────────────────────────────────────────────
  // GET JOINED CHANNELS
  // ────────────────────────────────────────────────────────────────
  public async listChannels(socket: Socket) : Promise<void> {
    try {
      const user = await UserResolver.curr(socket)
      const channels = await ChannelsService.getChannelsByUserId(user.id)
      
      const channels_with_members = []
      for (const channel of channels) channels_with_members.push(await ChannelResolver.enrich(channel.id))

      for (const channel of channels_with_members) {
        const member = await MemberResolver.curr(socket, channel.id);
        channel.notifStatus = member!.notif_status;
      }

      console.log(channels_with_members[0])

      socket.emit("channel:list", {
        channels: channels_with_members
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

      const result = await ChannelsService.createChannel(user, data)
      const channel = result.channel

      const channel_with_members = await ChannelResolver.enrich(channel.id)

      console.log(JSON.stringify(channel_with_members))

      await this.joinRooms(socket, channel.id)

      socket.emit("channel:created", {
        channel: channel_with_members
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

      const member_with_extras = await MemberResolver.enrich(result.member.id)

      this.broadcastToChannel(io, result.channel.id, "member:joined", {
        channelId: result.channel.id,
        member: member_with_extras
      })

      const channel_with_members = await ChannelResolver.enrich(result.channel.id)

      socket.emit("channel:joined", {
        userId: user.id,
        channel: channel_with_members
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

      socket.emit("channel:listMembers", {
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
      const channel = await ChannelResolver.byId(data.channelId)
      const member = await MemberResolver.curr(socket, data.channelId)

      const result = await ChannelsService.cancelChannel(channel, member!)
      
      this.broadcastToChannel(io, data.channelId, result.deleted ? "channel:deleted" : "member:left",
        {
        channelId: data.channelId,
        memberId: member!.id
      })

      if(result.deleted) {
        this.deleteRooms(socket, data.channelId)
      } else {
        socket.emit("channel:left", { channelId: data.channelId })
      }

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }


  public async quit(socket: Socket, io: IOServer, data: { channelId: number }) : Promise<void> {
    try {
      const channel = await ChannelResolver.byId(data.channelId)
      const member = await MemberResolver.curr(socket, data.channelId)

      await ChannelsService.quitChannel(channel, member!)

      this.broadcastToChannel(io, data.channelId, "channel:deleted", {
        channelId: data.channelId
      })

      this.deleteRooms(socket, data.channelId)

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
      const kicker = await MemberResolver.curr(socket, data.channelId)
      const target = await MemberResolver.byId(data.targetMemberId)

      const targetUserId = target.userId
      const result = await ChannelsService.castKickVote(kicker!, target)

      if (!result.kicked) {
        this.broadcastToChannel(io, channel.id, "member:kick-voted", {
          channelId: channel.id,
          targetMemberId: data.targetMemberId,
          voterId: kicker!.id,
          voteCount: target.kickVotes
        })
      } else {
        const payload = {
          channelId: channel.id,
          memberId: data.targetMemberId,
          userId: targetUserId,
          voteCount: target.kickVotes
        }
        this.broadcastToChannel(io, channel.id, "member:kicked", payload)
        socket.emit("member:kicked", payload)
      }
      console.log(result)
    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }

  // ────────────────────────────────────────────────────────────────
  // UPDATE NOTIFICATION STATUS
  // ────────────────────────────────────────────────────────────────
  public async updateNotif(socket: Socket, data: { channelId: number; status: NotifStatus }) : Promise<void> {
    try {
      console.log(data.status)
      const member = await MemberResolver.curr(socket, data.channelId)
      const notif_status = await ChannelsService.updateNotifStatus(member!, data.status)

      if (data.status == 'mentions') this.deleteRooms(socket, data.channelId)
      else if (data.status == 'all') this.joinRooms(socket, data.channelId)

      console.log("Notif status update")
      console.log(data.status)

      socket.emit("member:notif-status:updated", {
        channelId: data.channelId,
        notifStatus: notif_status,
      })

    } catch (err: any) {
      socket.emit("error", { error: err.message })
    }
  }
}