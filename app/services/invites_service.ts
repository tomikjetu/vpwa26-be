import User from '#models/user'
import Channel from '#models/channel'
import Invite from '#models/invite'
import Member from '#models/member'
import { DateTime } from 'luxon'
import { DuplicateInviteException, InviteRequiredException, MemberInvitedAgainException, MembershipProhibitedException, MembershipRequiredException, OwnershipRequiredException } from '#exceptions/exceptions'
import { AcceptInvite_Response, CreateInvite_Response } from 'types/service_return_types.js'
import { KICK_VOTE_CONSTANTS } from '#constants/constants'
import Blacklist from '#models/blacklist'

/**
 * Controller class
 */
export default class InvitesService {
    /**
     * Get pending channel invites
     */
    static async getInvites(userId: number) : Promise<Invite[]> {
        const invites = await Invite.query().where('user_id', userId)

        return invites 
    }

    /**
     * Invite a user to the channel
     */
    public async createInvite(channel: Channel, acting_member: Member, invited_user: User) : Promise<CreateInvite_Response> {

        // Check whether or not the user is a member of the channel
        if (!acting_member) throw new MembershipRequiredException("invite a new member")

        // Check whether or not the invite can happen based on private settings of the server
        if (channel.isPrivate && !acting_member.isOwner) throw new OwnershipRequiredException("invite a new member to a private channel")

        // Check whether or not the member has been kicked
        const blacklist_entry = await Blacklist.query()
            .where({ userId: invited_user.id, channelId: channel.id })
            .first()

        const is_kicked = !!blacklist_entry

        if (is_kicked && !acting_member.isOwner) throw new OwnershipRequiredException("invite a member who has been kicked")

        await blacklist_entry?.delete()

        // Check whether or not the user is already a member
        const existingMembership = await invited_user.related('member')
            .query()
            .where({channelId: channel.id})
            .first()

        if (existingMembership) throw new MemberInvitedAgainException()

        // Check whether or not the user has already been invited
        const existingInvite = await Invite.query()
            .where('user_id', invited_user.id)
            .where('channel_id', channel.id)
            .first()

        if (existingInvite) throw new DuplicateInviteException()

        // Create invitation
        const invite = await Invite.create({
            userId: invited_user.id,
            channelId: channel.id,
        })

        return {
            invitedAt: invite.createdAt,
            channelName: channel.name,
            inviteId: invite.id
        }
    }

    /**
     * Accept an invite to a channel
     */
    static async acceptInvite(channelId: number, userId: number) : Promise<AcceptInvite_Response> {
        // Check invite existence
        const invite = await Invite.query()
            .where('channel_id', channelId)
            .where('user_id', userId)
            .first()

        if (!invite) throw new InviteRequiredException("accept an invite to a channel")
        

        // Ensure user isn't already in channel
        const existingMember = await Member.query()
            .where({ channelId, userId })
            .first()

        if (existingMember) {
            // Clean up stale invite
            await invite.delete()

            throw new MembershipProhibitedException("accept an invite to a channel")
        }

        // Create membership
        const member = await Member.create({
            channelId,
            userId,
            isOwner: false,
            joinedAt: DateTime.now(),
            kickVotes: KICK_VOTE_CONSTANTS.KICK_VOTES_START,
        })

        // Remove invite
        await invite.delete()

        return { channelId, member }
    }

    static async declineInvite(channelId: number, userId: number) : Promise<number> {
        // Check invite existence
        const invite = await Invite.query()
            .where('channel_id', channelId)
            .where('user_id', userId)
            .first()

        if (!invite) throw new InviteRequiredException("decline an invite to a channel")
        
        // Ensure user isn't already in channel
        const existingMember = await Member.query()
            .where({ channelId, userId })
            .first()

        if (existingMember) {
            // Clean up stale invite
            await invite.delete()

            throw new MembershipProhibitedException("decline an invite to a channel")
        }

        // Remove invite
        await invite.delete()

        return channelId
    }
}