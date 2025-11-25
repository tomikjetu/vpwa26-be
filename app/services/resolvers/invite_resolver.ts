import Invite from '#models/invite'
import Channel from '#models/channel'

export default class InviteResolver {
  /**
   * Takes an invite and returns invite + channel name
   */
  static async enrich(invite: Invite) {
    // Load the channel associated with the invite
    const channel = await Channel.find(invite.channelId)

    const json = invite.toJSON()

    return {
            ...json,

            // rename createdAt → invitedAt
            invitedAt: json.createdAt,
            createdAt: undefined, // remove original key if desired

            // add channel name
            name: channel?.name ?? null,
        }
    }
}