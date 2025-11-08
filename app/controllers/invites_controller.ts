import User from '#models/user'
import Invite from '#models/invite'
import Member from '#models/member'
import KickVote from '#models/kick_vote'
import { DateTime } from 'luxon'
import { KICK_VOTE_CONSTANTS } from '#constants/constants.js'
import type { HttpContext } from '@adonisjs/core/http'
import { InviteRequiredException, MembershipRequiredException, OwnershipRequiredException, UserNotFoundException } from '#exceptions/exceptions'

/**
 * Controller class
 */
export default class ChannelsController {
    /**
     * Get pending channel invites
     */
    public async index(ctx: HttpContext) {
        const user = ctx.auth.user!

        const invites = await Invite.query().where('user_id', user.id)

        return ctx.response.ok(invites)
    }

    /**
     * Invite a user to the channel
     */
    public async create(ctx: HttpContext) {
        const channel = ctx.channel!
        const user_member = ctx.user_member

        // Check whether or not the user is a member of the channel
        if (!user_member) throw new MembershipRequiredException("invite a new member")

        // Check whether or not the server is private
        if (channel.isPrivate && !user_member.isOwner) throw new OwnershipRequiredException("invite a new member to a private channel")

        // Check whether or not the member has been kicked
        const kick_votes = await KickVote.query()
            .where('kicked_member_id', user_member.id)

        // Compute derived values from that one array
        const total = kick_votes.length
        const kicked_by_owner = kick_votes.some(vote => vote.kickedByOwner)
        const is_kicked = (total >= KICK_VOTE_CONSTANTS.KICK_TRESHHOLD || kicked_by_owner)

        if (is_kicked && !user_member.isOwner) throw new OwnershipRequiredException("invite a member who has been kicked")

        // Find the invited user
        const { nickname } = ctx.params
        const userToInvite = await User.findBy('nick', nickname)

        // Check whether user exists
        if (!userToInvite) throw new UserNotFoundException()
        

        // Check whether or not the user has already been invited
        const invited_member = await userToInvite.related('member').query().first()
        if (invited_member) return ctx.response.forbidden({ error: 'Cannot invite user who has already been invited' })

        // If the inviter user is owner, delete all kick_vote entries upon invite
        if (!user_member.isOwner) await Promise.all(kick_votes.map(vote => vote.delete()))

        // Create invitation
        await userToInvite.related('invite').create({
            channelId: channel.id,
        })

        return ctx.response.ok({ message: `User ${nickname} invited` })
    }

    /**
     * Accept an invite to a channel
     */
    public async accept(ctx: HttpContext) {
        const { auth, params, response } = ctx
        const user = auth.user!
        const channelId = params.channel_id

        // Find the invite
        const invite = await Invite.query()
            .where('channel_id', channelId)
            .where('user_id', user.id)
            .first()

        // Check if the invite exists
        if (!invite) throw new InviteRequiredException('accept an invite to a channel')

        // Check if the user is already a member (just in case)
        const existingMember = await Member.query()
            .where('channel_id', channelId)
            .where('user_id', user.id)
            .first()

        if (existingMember) {
            // Delete stale invite if it exists
            await invite.delete()

            return response.conflict({
                message: 'You are already a member of this channel',
            })
        }

        // Add the user as a member
        await Member.create({
            channelId: channelId,
            userId: user.id,
            isOwner: false,
            joinedAt: DateTime.now(),
            kick_votes: KICK_VOTE_CONSTANTS.KICK_VOTES_START,
        })

        // Delete the invite after accepting
        await invite.delete()

        // Return success
        return response.ok({
            message: 'Invite accepted successfully',
            channel_id: channelId,
        })
    }
}