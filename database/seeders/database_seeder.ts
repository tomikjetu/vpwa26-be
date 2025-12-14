import { BaseSeeder } from '@adonisjs/lucid/seeders'
import UserSeeder from './user_seeder.js'
import ChannelSeeder from './channel_seeder.js'
import MemberSeeder from './member_seeder.js'
import MessageSeeder from './message_seeder.js'
import KickVoteSeeder from './kick_vote_seeder.js'
import FileSeeder from './file_seeder.js'

export default class DatabaseSeeder extends BaseSeeder {
  public async run() {
    console.log('Starting seed process...')

    await new UserSeeder(this.client).run()
    await new ChannelSeeder(this.client).run()
    await new MemberSeeder(this.client).run()
    await new MessageSeeder(this.client).run()
    await new KickVoteSeeder(this.client).run()
    //await new FileSeeder(this.client).run()

    console.log('Seeding complete!')
  }
}