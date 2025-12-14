import Blacklist from "#models/blacklist"

export default class BlacklistService {
    
    static async createEntry(userId: number, channel_id: number): Promise<void> {
        await Blacklist.create({
          userId: userId,
          channelId: channel_id,
        })
    }
}
