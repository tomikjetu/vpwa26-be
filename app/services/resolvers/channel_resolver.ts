import { ChannelNotFoundException } from '#exceptions/exceptions'
import Channel from '#models/channel'

export default class ChannelResolver {
    
  static async byId(channel_id: number) {

    // Try to find the channel
    const channel = await Channel.find(channel_id)

    // If not found, return 404 response
    if (!channel) throw new ChannelNotFoundException()
    
    // Return
    return channel
  }
}