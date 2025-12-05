import Channel from '#models/channel'
import User from '#models/user'
import Invite from '#models/invite'
import Member from '#models/member'
import KickVote from '#models/kick_vote'
import File from '#models/file'
import { DateTime } from 'luxon'
import { schema, rules } from '@adonisjs/validator'
import { CHANNEL_CONSTANTS, KICK_VOTE_CONSTANTS } from '#constants/constants'
import { ChannelNotFoundException, InviteRequiredException, MembershipProhibitedException, MembershipRequiredException, OwnershipRequiredException, ProhibitedKickVoteException } from '#exceptions/exceptions'
import Drive from '@adonisjs/drive/services/main'
import { validator } from '@adonisjs/validator'
import type { NotifStatus } from 'types/string_literals.js'
import { CancelChannel_Response, CastKickVote_Response, CreateChannel_Response, GetFile_Response, JoinChannel_Response } from 'types/service_return_types.js'

/**
 * Helper — creates a new channel
 */
export default class ChannelsService {
    
    static channelSchema = schema.create({
        name: schema.string({}, [
        rules.maxLength(CHANNEL_CONSTANTS.NAME_MAX_LENGTH),
        rules.minLength(CHANNEL_CONSTANTS.NAME_MIN_LENGTH),
        ]),
        isPrivate: schema.boolean.optional(),
    })


    /**
     * Helper - creates new channel
     */
    static async createChannel(user: User, data: any) : Promise<CreateChannel_Response> {
        const validated = await validator.validate({
            schema: this.channelSchema,
            data
        })

        const channel = await Channel.create({
            name: validated.name,
            isPrivate: validated.isPrivate,
            ownerId: user.id,
        })

        // Automatically add creator as member 
        const member = await this.createMember(channel, user!.id, true)

        return { channel, member }
    }

    /**
     * Helper - creates new member
     */
    static async createMember(channel: Channel, user_id: number, is_owned: boolean) : Promise<Member> {
        return await channel.related('members').create({
            userId: user_id,
            channelId: channel.id,
            isOwner: is_owned,
            joinedAt: DateTime.now(),
            kickVotes: KICK_VOTE_CONSTANTS.KICK_VOTES_START,
        })
    }




    /**
     * Return all channels the user owns or joined
     */
    static async getChannelsByUserId(userId: number) : Promise<Channel[]> {
        return Channel.query().whereHas('members', (memberQuery) => {
            memberQuery.where('user_id', userId)
        })
    }


    /**
     * Join an existing channel or create one if it doesn’t exist
     */
    static async joinChannel(user: User, channelName: string) : Promise<JoinChannel_Response> {
        let channel = await Channel.findBy('name', channelName)

        // Create channel if not exists
        if (!channel) {
            const results : CreateChannel_Response = await this.createChannel(user, { name: channelName })
            return { channel: results.channel, created: true, joined: true, member: results.member }
        }

        // Check if already member
        const existing = await Member.query()
            .where({ userId: user.id, channelId: channel.id })
            .first()

        if (existing) throw new MembershipProhibitedException("join a channel")  
        

        // Private channel, must have invite
        if (channel.isPrivate) {
            const invited = await Invite.query()
            .where({ channelId: channel.id, userId: user.id })
            .first()

            if (!invited) throw new InviteRequiredException("join a private channel")  
        }

        // Add membership
        const member = await this.createMember(channel, user.id, false)

        return { channel, created: false, joined: true, member }
    }

    /**
     * List all members in a channel
     */
    static async getMembersByChannelId(channel: Channel) : Promise<Member[]> {

        return await channel
            .related('members')
            .query()
            .select(['id', 'user_id', 'channel_id', 'is_owner', 'joined_at', 'kick_votes'])
            .preload('user', (userQuery) => {
                userQuery.select(['nick', 'status'])
            })
    }

    /**
     * List all invited users (not yet joined)
     */
    static async getInvitedMembers(channel: Channel) : Promise<Invite[]> {
        return await channel
            .related('invite')
            .query()
            .preload('user', (userQuery) => {
                userQuery.select(['nick'])
            })
    }

    /**
     * Cancel (owner deletes, member leaves)
     */
    static async cancelChannel(channel: Channel, user_member: Member) : Promise<CancelChannel_Response> {

        if (!user_member) throw new MembershipRequiredException("cancel the channel")

        if (user_member.isOwner) {
            await channel.delete()

            return {
                message: 'Channel deleted by owner.',
                deleted: true
            }
        }

        await user_member.delete()

        return {
                message: 'You left the channel.',
                deleted: false
            }
        }

    /**
     * Quit — only owner can permanently delete
     */
    static async quitChannel(channel: Channel, member: Member) : Promise<void> {
        
        if (!member.isOwner) throw new OwnershipRequiredException('delete channel')

        await channel.delete()
    }
    
    /**
     * Revoke a member (temporarily remove)
     */
    static async revokeMember(actingMember: Member, targetMember: Member) : Promise<boolean> {
        
        if (actingMember.isOwner) throw new OwnershipRequiredException('revoke member')
        
        await targetMember.delete()

        return true
    }

    /**
     * Update notif_status
     */
    static async updateNotifStatus(user_member: Member, status: NotifStatus) : Promise<NotifStatus> {
       
        if (!user_member) throw new MembershipRequiredException('change notification status')
            
        
        if(user_member.notif_status != status) {
            user_member.notif_status = status
            await user_member.save()
        }

        return user_member.notif_status
    }

    /**
     * Kick a member — either immediate (owner) or via vote
     */
    static async castKickVote(acting_member: Member, target_member: Member) : Promise<CastKickVote_Response> {

        if (acting_member.id == target_member.id) throw new ProhibitedKickVoteException("yourself")

        if (target_member.isOwner) throw new ProhibitedKickVoteException("owner of the channel")

        if (!acting_member) throw new MembershipRequiredException('kick members')
        
        // If the kicker is owner, stop immediately
        if (target_member.isOwner) {
        return {
                kicked: false,
                votes: 0,
                reason: "Cannot kick the owner"
            }
        }

        // Check for duplicate vote
        const duplicate_vote = await KickVote
        .query()
        .where('acting_member_id', acting_member.id)
        .where('target_member_id', target_member.id)
        .first()

        if (duplicate_vote) throw new ProhibitedKickVoteException("the same member more than once")
        
        await KickVote.create({
            targetMemberId: target_member.id,
            actingMemberId: acting_member.id,
            kickedByOwner: acting_member.isOwner,
            createdAt: DateTime.now(),
        })

        const votes_count_obj = await KickVote
            .query()
            .where('target_member_id', target_member.id)
            .count('* as total')

        const votes_count = Number(votes_count_obj[0].$extras.total) // extras is where the aggregate columns are saved to

        if (acting_member.isOwner || votes_count >= KICK_VOTE_CONSTANTS.KICK_TRESHHOLD) {
            await target_member.delete()

            return {
                kicked: true,
                votes: votes_count,
                reason: acting_member.isOwner ? "owner kick" : "enough votes"
            }
        }

        target_member.kickVotes = votes_count
        await target_member.save()

        return {
            kicked: false,
            votes: votes_count,
            reason: "vote added"
        }
    }

    /**
     * Get a file
     */
    static async getFile(userId: number, fileId: number) : Promise<GetFile_Response> {
        const file = await File.find(fileId)
        if (!file) throw new Error("File not found")

        const channel = await Channel.find(file.channelId)
        if (!channel) throw new ChannelNotFoundException()

        const isMember = await channel
            .related("members")
            .query()
            .where("user_id", userId)
            .first()

        if (!isMember) throw new MembershipRequiredException("accessing files")

        const stream = await Drive.use("fs").getStream(file.path)

        return {
            stream,
            mime: file.mime_type,
            name: file.name,
            path: file.path,
            channelId: file.channelId,
        }
    }
}
