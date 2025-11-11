import Channel from '#models/channel'
import Invite from '#models/invite'
import Member from '#models/member'
import KickVote from '#models/kick_vote'
import File from '#models/file'
import { DateTime } from 'luxon'
import { schema, rules } from '@adonisjs/validator'
import { CHANNEL_CONSTANTS, KICK_VOTE_CONSTANTS } from '#constants/constants.js'
import type { HttpContext } from '@adonisjs/core/http'
import { ChannelNotFoundException, InviteRequiredException, MembershipRequiredException, OwnershipRequiredException } from '#exceptions/exceptions'
import Drive from '@adonisjs/drive/services/main'

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

// ------------------------------------------------------------------------------------------------------------------------

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
   * Creates a new channel
   */
  public async create(ctx: HttpContext) {
    return createChannel(ctx)
  }



  /**
   * Join an existing channel or create one if it doesn’t exist
   */
  public async join(ctx: HttpContext) {
    const name = ctx.params.name
    const user = ctx.auth.user!

    let channel = await Channel.findBy('name', name)

    if (!channel) return createChannel(ctx)
    
    const user_member = await Member.findBy('user_id', user.id)
    if (user_member) return ctx.response.ok({ message: 'Already joined', channel })

    // If channel is private
    if (channel.isPrivate) {
        // Check for invites
        const is_invited = await Invite.query()
            .where('channel_id', channel.id)
            .where('user_id', user.id)
            .first()

        if (!is_invited) throw new InviteRequiredException('join a private channel')
    }

    await createMember(channel, user.id, false)

    return ctx.response.ok({ message: 'Joined channel', channel })
  }

  /**
   * List all members in a channel
   */
  public async listMembers(ctx: HttpContext) {
    const channel = ctx.channel!

    const members = await channel
        .related('member')
        .query()
        .select(['id', 'user_id', 'channel_id', 'is_owner', 'joined_at', 'kick_votes']) // omit notif_status
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
   * Update notif_status
   */
  public async updateNotifStatus(ctx: HttpContext) {
    const { request, response } = ctx
    const user_member = ctx.user_member

    if (!user_member) throw new MembershipRequiredException('change notification status')

    const notifSchema = schema.create({
      notif_status: schema.enum(['all', 'mentions', 'none'] as const),
    })

    const payload = await request.validate({ schema: notifSchema })

    // Update notif_status in database
    user_member.notif_status = payload.notif_status
    await user_member.save()

    return response.ok({
      message: 'Notification status updated successfully',
      data: {
        notif_status: user_member.notif_status,
      },
    })
  }

  /**
   * Kick a member — either immediate (owner) or via vote
   */
  public async kickMember(ctx: HttpContext) {
    const kicker_member = ctx.user_member!
    const kicked_member = ctx.member!

    if (!kicker_member) throw new MembershipRequiredException('kick members')
    
    // If the kicker is owner, remove immediately
    if (kicked_member.isOwner) {
      return ctx.response.forbidden({ error: 'Cannot kick the owner' })
    }

    // Check for duplicate vote
    const duplicate_vote = await KickVote
      .query()
      .where('voter_member_id', kicker_member.id)
      .where('voted_member_id', kicked_member.id)

    if (duplicate_vote) {
      return ctx.response.forbidden({ error: 'Cannot kick the same member twice' })
    }

    await KickVote.create({
      votedMemberId: kicked_member.id,
      voterMemberId: kicker_member.id,
      kickedByOwner: kicker_member.isOwner,
      createdAt: DateTime.now(),
    })

    const votes_count_obj = await KickVote
        .query()
        .where('voted_member_id', kicked_member.id)
        .count('* as total')

    const votes_count = Number(votes_count_obj[0].$extras.total) // extras is where the aggregate columns are saved to

    if (kicker_member.isOwner || votes_count >= KICK_VOTE_CONSTANTS.KICK_TRESHHOLD) {
      await kicked_member.delete()
      return ctx.response.ok({ message: `Member kicked (${kicked_member.isOwner ? 'owner kick' : 'enough votes'})` })
    }

    return ctx.response.ok({ message: 'Kick vote added' })
  }

  /**
   * Get a file
   */
  public async getFile({ params, auth, response }: HttpContext) {
    const user = auth.user!

    // Find the file
    const file = await File.find(params.file_id)
    if (!file) {
      return response.notFound({ error: 'File not found' })
    }

    // Find the related channel
    const channel = await Channel.find(file.channelId)

    if (!channel) throw new ChannelNotFoundException()

    // Check if user is a member of that channel
    const isMember = await channel.related('member').query().where('user_id', user.id).first()
    
    if (!isMember) throw new MembershipRequiredException('accessing files')

    // Stream the file
    const fileStream = await Drive.use('fs').getStream(file.path)
    response.stream(fileStream)

    // Add headers for nicer downloads
    response.header('Content-Type', file.mime_type)
    response.header('Content-Disposition', `inline; filename="${file.name}"`)

    return response
  }
}