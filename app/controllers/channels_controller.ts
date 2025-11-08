import Channel from '#models/channel'
import User from '#models/user'
import Invite from '#models/invite'
import { DateTime } from 'luxon'
import { schema, rules } from '@adonisjs/validator'
import { CHANNEL_CONSTANTS, KICK_VOTE_CONSTANTS } from '#constants/constants.js'
import type { HttpContext } from '@adonisjs/core/http'
import { InviteRequiredException, MembershipRequiredException, OwnershipRequiredException } from '#exceptions/exceptions'


/**
 * Helper — creates a new channel
 */
async function createChannel(ctx: HttpContext) {
  const { request, auth, response } = ctx

  const channelSchema = schema.create({
    name: schema.string({}, [
      rules.maxLength(CHANNEL_CONSTANTS.NAME_MAX_LENGTH),
      rules.minLength(CHANNEL_CONSTANTS.NAME_MIN_LENGTH),
    ]),
    isPrivate: schema.boolean.optional(),
  })

  const data = await request.validate({ schema: channelSchema })

  const channel = await Channel.create({
    name: data.name,
    isPrivate: data.isPrivate ?? false,
    ownerId: auth.user!.id,
  })

  // Automatically add creator as member
  await createMember(channel, auth.user!.id, true)

  return response.created({ message: 'Channel created', channel })
}

/**
 * Helper - creates new member
 */
async function createMember(channel: Channel, user_id: number, is_owned: boolean) {
    await channel.related('member').create({
        channelId: user_id,
        isOwner: is_owned,
        joinedAt: DateTime.now(),
        kick_votes: KICK_VOTE_CONSTANTS.KICK_VOTES_START,
    })
}


/**
 * Controller class
 */
export default class ChannelsController {
  /**
   * Return all channels the user owns or joined
   */
  public async index(ctx: HttpContext) {
    const user = ctx.auth.user!

    const channels = await Channel.query().whereHas('member', (memberQuery) => {
      memberQuery.where('user_id', user.id)
    })

    return ctx.response.ok(channels)
  }

  /**
   * Join an existing channel or create one if it doesn’t exist
   */
  public async join(ctx: HttpContext) {
    const name = ctx.params.name
    const user = ctx.auth.user!

    let channel = await Channel.findBy('name', name)

    if (!channel) return createChannel(ctx)
    
    if (ctx.user_member) return ctx.response.ok({ message: 'Already joined', channel })

    // If channel is private
    if (channel.isPrivate) {
        // Check for invites
        const is_invited = await Invite.query()
            .where('channel_id', channel.id)
            .where('user_id', user.id)
            .first()

        if (!is_invited) throw new InviteRequiredException()
    }

    await createMember(channel, user.id, false)

    return ctx.response.ok({ message: 'Joined channel', channel })
  }

  /**
   * Invite a user to the channel
   */
  public async invite(ctx: HttpContext) {
    const channel = ctx.channel!
    
    if (!ctx.user_member) throw new MembershipRequiredException("invite a new member")

    if (channel.isPrivate && !ctx.user_member.isOwner) throw new OwnershipRequiredException("invite a new member to a private channel")

    const { nickname } = ctx.params
    const userToInvite = await User.findBy('nick', nickname)

    if (!userToInvite) {
      return ctx.response.notFound({ error: 'User not found' })
    }

    // Create invitation
    await userToInvite.related('invite').create({
        channelId: channel.id,
    })

    return ctx.response.ok({ message: `User ${nickname} invited` })
  }

  /**
   * List all members in a channel
   */
  public async listMembers(ctx: HttpContext) {
    const channel = ctx.channel!

    const members = await channel
        .related('member')
        .query()
        .preload('user', (userQuery) => {
            userQuery.select(['nick', 'status'])
        })

    return ctx.response.ok(members)
  }

  /**
   * List all invited users (not yet joined)
   */
  public async listInvited(ctx: HttpContext) {
    const channel = ctx.channel
    if(!channel) return

    const invites = await channel
        .related('invite')
        .query()
        .preload('user', (userQuery) => {
            userQuery.select(['nick'])
        })

    return ctx.response.ok(invites)
  }

  /**
   * Cancel (owner deletes, member leaves)
   */
  public async cancel(ctx: HttpContext) {
    const channel = ctx.channel!

    if (ctx.user_member!.isOwner) {
      await channel.delete()
      return ctx.response.ok({ message: 'Channel deleted by owner' })
    } else {
      await ctx.user_member!.delete()
      return ctx.response.ok({ message: 'You left the channel' })
    }
  }

  /**
   * Quit — only owner can permanently delete
   */
  public async quit(ctx: HttpContext) {
    const channel = ctx.channel!

    if (ctx.user_member!.isOwner) throw new OwnershipRequiredException('delete channel')

    await channel.delete()

    return ctx.response.ok({ message: 'Channel deleted permanently' })
  }
  
  /**
   * Revoke a member (temporarily remove)
   */
  public async revokeMember(ctx: HttpContext) {
    if (ctx.user_member!.isOwner) throw new OwnershipRequiredException('revoke member')

    await ctx.member!.delete()

    return ctx.response.ok({ message: 'Member revoked' })
  }

  /**
   * Kick a member — either immediate (owner) or via vote
   */
  public async kickMember(ctx: HttpContext) {
    const kicker_member = ctx.user_member!
    const kicked_member = ctx.member!
    const user = ctx.auth.user!

    if (!kicker_member) throw new MembershipRequiredException('kick members')
    // If the kicker is owner, remove immediately
    if (kicked_member.isOwner) {
      return ctx.response.forbidden({ error: 'Cannot kick the owner' })
    }

    await kicked_member.related('kickVote').create({
      voterUserId: user.id,
      kickedByOwner: kicker_member.isOwner,
      createdAt: DateTime.now(),
    })

    const votes_count_obj = await kicked_member.related('kickVote').query().count('* as total')
    const votes_count = Number(votes_count_obj[0].$extras.total) // extras is where the aggregate columns are saved to

    if (kicker_member.isOwner || votes_count >= KICK_VOTE_CONSTANTS.KICK_TRESHHOLD) {
      await kicked_member.delete()
      return ctx.response.ok({ message: `Member kicked (${kicked_member.isOwner ? 'owner kick' : 'enough votes'})` })
    }

    return ctx.response.ok({ message: 'Kick vote added' })
  }
}