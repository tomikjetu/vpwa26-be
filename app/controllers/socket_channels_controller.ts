import Channel from '#models/channel'
import Member from '#models/member'
import { DateTime } from 'luxon'
import { CHANNEL_CONSTANTS, KICK_VOTE_CONSTANTS } from '../constants/constants.js'
import type { Socket, Server as IOServer } from 'socket.io'

/**
 * Socket controller for handling channel-related events
 */
export default class SocketChannelsController {
  /**
   * Get user from socket handshake or attached data
   * In production, validate socket authentication token here
   */
  private getUserFromSocket(socket: Socket): any {
    // Assuming user is attached during socket authentication middleware
    return (socket as any).user
  }

  /**
   * Broadcast channel update to all members of a channel
   */
  private broadcastToChannelMembers(io: IOServer, channelId: number, event: string, data: any) {
    io.to(`channel:${channelId}`).emit(event, data)
  }

  /**
   * Send all available channels to a socket
   */
  public async sendAllChannels(socket: Socket, io: IOServer) {
    try {
      const user = this.getUserFromSocket(socket)
      if (!user) {
        socket.emit('channels:error', { error: 'Not authenticated' })
        return
      }

      // Get all channels the user is a member of
      const channels = await Channel.query()
        .whereHas('member', (memberQuery) => {
          memberQuery.where('user_id', user.id)
        })
        .preload('member', (memberQuery) => {
          memberQuery.preload('user', (userQuery) => {
            userQuery.select(['id', 'nick',])
          })
        })


      socket.emit('channels:list', { channels })
    } catch (error) {
      console.error('Error fetching channels:', error)
      socket.emit('channels:error', { error: 'Failed to fetch channels' })
    }
  }

  /**
   * Create a new channel and broadcast to all connected clients
   */
  public async createChannel(socket: Socket, io: IOServer, data: { name: string; isPrivate?: boolean }) {
    try {
      const user = this.getUserFromSocket(socket)
      
      if (!user) {
        socket.emit('channel:create:error', { error: 'Not authenticated' })
        return
      }

      const { name, isPrivate } = data

      // Validate name length
      if (!name || name.length < CHANNEL_CONSTANTS.NAME_MIN_LENGTH || name.length > CHANNEL_CONSTANTS.NAME_MAX_LENGTH) {
        socket.emit('channel:create:error', { 
          error: `Channel name must be between ${CHANNEL_CONSTANTS.NAME_MIN_LENGTH} and ${CHANNEL_CONSTANTS.NAME_MAX_LENGTH} characters` 
        })
        return
      }

      // Create the channel
      const channel = await Channel.create({
        name: name.trim(),
        isPrivate: isPrivate ?? false,
        ownerId: user.id,
      })

      // Add creator as member (owner)
      const member = await Member.create({
        userId: user.id,
        channelId: channel.id,
        isOwner: true,
        joinedAt: DateTime.now(),
        kick_votes: KICK_VOTE_CONSTANTS.KICK_VOTES_START,
      })

      // Join the channel room
      socket.join(`channel:${channel.id}`)

      // Load relationships for response
      await channel.load('member', (memberQuery) => {
        memberQuery.preload('user', (userQuery) => {
          userQuery.select(['id', 'nick'])
        })
      })

      // Only broadcast to the creator since they're the only member
      // When other users join this channel, they'll receive it via channels:list
      socket.emit('channel:created', {
        channel: channel.serialize(),
        createdBy: {
          id: user.id,
          nick: user.nick
        }
      })

      // Send success response to the creator
      socket.emit('channel:create:success', {
        message: 'Channel created successfully',
        channel: channel.serialize()
      })

    } catch (error) {
      console.error('Error creating channel:', error)
      socket.emit('channel:create:error', { 
        error: 'Failed to create channel',
        details: error.message 
      })
    }
  }
}
