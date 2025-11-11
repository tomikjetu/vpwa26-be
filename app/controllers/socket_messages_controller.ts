import Member from '#models/member'
import Channel from '#models/channel'
import type { Socket } from 'socket.io'

/**
 * Socket controller for handling message-related events
 */
export default class SocketMessagesController {
  /**
   * Handle fetching messages for a channel
   */
  public async getChannelMessages(socket: Socket, data: { channelId: number | string }) {
    const { channelId } = data
    
    console.log(`Fetching messages for channel ${channelId}`)
    
    try {
      // Return dummy data for now
      const dummyMessages = [
        {
          id: 1,
          content: 'Hello, this is a dummy message!',
          createdAt: new Date().toISOString(),
          memberId: 1,
          channelId: channelId,
          files: []
        },
        {
          id: 2,
          content: 'This is another test message',
          createdAt: new Date(Date.now() - 60000).toISOString(),
          memberId: 2,
          channelId: channelId,
          files: [
            {
              id: 1,
              name: 'test-image.jpg',
              mime_type: 'image/jpeg',
              size: 12345
            }
          ]
        },
        {
          id: 3,
          content: 'Third dummy message here',
          createdAt: new Date(Date.now() - 120000).toISOString(),
          memberId: 1,
          channelId: channelId,
          files: []
        }
      ]

      const dummyMembers = [
        {
          id: 1,
          channelId: channelId,
          isOwner: true,
          user: {
            nick: 'Alice'
          }
        },
        {
          id: 2,
          channelId: channelId,
          isOwner: false,
          user: {
            nick: 'Bob'
          }
        }
      ]

      socket.emit('channel:messages:response', {
        messages: dummyMessages,
        members: dummyMembers
      })
    } catch (error) {
      console.error('Error fetching channel messages:', error)
      socket.emit('channel:messages:error', {
        error: 'Failed to fetch messages'
      })
    }
  }

  /**
   * Real implementation (commented out for reference)
   * Uncomment and use this when ready to connect to real data
   */
  // public async getChannelMessages(socket: Socket, data: { channelId: number | string }) {
  //   const { channelId } = data
  //   
  //   try {
  //     const channel = await Channel.find(channelId)
  //     
  //     if (!channel) {
  //       socket.emit('channel:messages:error', { error: 'Channel not found' })
  //       return
  //     }
  //
  //     const messages = await channel
  //       .related('messages')
  //       .query()
  //       .preload('files', (fileQuery) => {
  //         fileQuery.select(['name', 'id', 'mime_type', 'size'])
  //       })
  //       .orderBy('created_at', 'desc')
  //       .limit(50)
  //
  //     const members = await Member.query()
  //       .where('channel_id', channel.id)
  //       .select(['id', 'channel_id', 'is_owner'])
  //       .preload('user', (userQuery) => {
  //         userQuery.select(['nick'])
  //       })
  //
  //     socket.emit('channel:messages:response', { messages, members })
  //   } catch (error) {
  //     console.error('Error fetching channel messages:', error)
  //     socket.emit('channel:messages:error', {
  //       error: 'Failed to fetch messages'
  //     })
  //   }
  // }
}
