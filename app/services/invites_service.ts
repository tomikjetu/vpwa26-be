import User from '#models/user'
import Channel from '#models/channel'
import Invite from '#models/invite'
import Member from '#models/member'
import KickVote from '#models/kick_vote'
import { DateTime } from 'luxon'
import { KICK_VOTE_CONSTANTS } from '#constants/constants.js'
import type { HttpContext } from '@adonisjs/core/http'
import { DuplicateInviteException, InviteRequiredException, MemberInvitedAgainException, MembershipProhibitedException, MembershipRequiredException, OwnershipRequiredException } from '#exceptions/exceptions'
import { CreateInvite_Response } from 'types/service_return_types.js'

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
        const kick_votes = await KickVote.query()
            .where('voted_member_id', invited_user.id)
            .where('channel_id', channel.id)

        // Compute derived values from that one array
        const total = kick_votes.length
        const kicked_by_owner = kick_votes.some(vote => vote.kickedByOwner)
        const is_kicked = (total >= KICK_VOTE_CONSTANTS.KICK_TRESHHOLD || kicked_by_owner)

        if (is_kicked && !acting_member.isOwner) throw new OwnershipRequiredException("invite a member who has been kicked")


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

        // If the inviter user is owner, delete all kick_vote entries upon invite
        if (acting_member.isOwner) await Promise.all(kick_votes.map(vote => vote.delete()))

        // Create invitation
        await invited_user.related('invite').create({
            channelId: channel.id,
        })

        return {
            invited: true,
            user: invited_user,
            channelId: channel.id,
        }
    }

    /**
     * Accept an invite to a channel
     */
    static async acceptInvite(channelId: number, userId: number) : Promise<number> {

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
        await Member.create({
            channelId,
            userId,
            isOwner: false,
            joinedAt: DateTime.now(),
            kick_votes: KICK_VOTE_CONSTANTS.KICK_VOTES_START,
        })

        // Remove invite
        await invite.delete()

        return channelId
    }
}