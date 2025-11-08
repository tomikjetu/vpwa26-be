import Message from '#models/message'
import File from '#models/file'
import Channel from '#models/channel'
import { BaseSeeder } from '@adonisjs/lucid/seeders'

export default class FileSeeder extends BaseSeeder {
  public async run() {
    // Get the most recently created message (or any message)
    const lastMessage = await Message.query().orderBy('id', 'desc').first()

    if (!lastMessage) {
      console.error('Message data missing. Run MessageSeeder first.')
      return
    }

    // Find the channel that this message belongs to
    const relatedChannel = await Channel.find(lastMessage.channelId)

    if (!relatedChannel) {
      console.error('Channel data missing. Run ChannelSeeder first.')
      return
    }

    // Create sample file entries linked to that message and channel
    await File.createMany([
      {
        messageId: lastMessage.id,
        channelId: relatedChannel.id,
        path: 'uploads/project_plan.txt',
        name: 'project_plan.txt',
        size: 15360, // bytes (≈15KB)
        mime_type: 'text/plain',
      },
      {
        messageId: lastMessage.id,
        channelId: relatedChannel.id,
        path: 'uploads/screenshot.png',
        name: 'screenshot.png',
        size: 102400, // bytes (≈100KB)
        mime_type: 'image/png',
      },
    ])
  }
}