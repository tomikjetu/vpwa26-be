import Message from "#models/message"
import File from "#models/file"
import { BaseSeeder } from "@adonisjs/lucid/seeders"

export default class FileSeeder extends BaseSeeder {
  public async run() {
    // Find a message to attach a file to (e.g., the last message)
    const lastMessage = await Message.query().orderBy('id', 'desc').first()

    if (!lastMessage) {
      console.error('Message data missing. Run MessageSeeder first.')
      return
    }

    // Since 'id' is the primary key and we don't have a natural unique key for files, 
    // we use createMany for simplicity, assuming this seeder won't be run often.
    await File.createMany([
      {
        messageId: lastMessage.id,
        content: '/path/to/project_plan.txt', // Placeholder for file path/data
        name: 'project_plan.txt',
      },
      {
        messageId: lastMessage.id,
        content: '/path/to/screenshot.png',
        name: 'screenshot.png',
      },
    ])
  }
}