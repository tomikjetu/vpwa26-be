import Member from '#models/member'
import File from '#models/file'
import Channel from '#models/channel'
import User from '#models/user'
import { IncorrectMessageFormatException, MembershipRequiredException } from '#exceptions/exceptions'
import Message from '#models/message'
import { DateTime } from 'luxon'
import { MESSAGE_CONSTANTS } from '#constants/constants'
import { FileMetaData } from 'types/message_types.js'

/**
 * Controller class
 */
export default class MessagesService {

    /**
     * Get a list of messages in the channel, the files for each message, and information about members needed for the messages (nicknames, id)
     */
    static async getMessages(channel: Channel, member: Member | null, offset: number) {

        if (!member) throw new MembershipRequiredException("fetch messages from the channel")

        // Fetch messages with files
        const messages = await channel
            .related('messages')
            .query()
            .preload('files', (fileQuery) => {
            fileQuery.select(['name', 'id', 'mime_type', 'size', 'path'])
            })
            .orderBy('created_at', 'desc')
            .offset(offset)
            .limit(MESSAGE_CONSTANTS.BATCH_SIZE)

        return {
            messages: messages,
        }
    }


    /**
     * Send a message (optionally with file)
     */
    static async sendMessage(
        channel: Channel,
        member: Member,
        user: User,
        files?: FileMetaData[],
        content?: string,
    ) {

        // Check exceptions
        if (!member) throw new MembershipRequiredException("send messages in a channel")
        
        if ((!content || content.trim().length === 0) && files && files.length === 0) 
            throw new IncorrectMessageFormatException("message must contain either text or at least one file")
        
        if (content && content.length > MESSAGE_CONSTANTS.MAX_LENGTH) 
            throw new IncorrectMessageFormatException(`messsage must be less than ${MESSAGE_CONSTANTS.MAX_LENGTH} characters long`)
        
        if (files && files.length > MESSAGE_CONSTANTS.MAX_FILE_COUNT) 
            throw new IncorrectMessageFormatException(`messsage can contain at most ${MESSAGE_CONSTANTS.MAX_FILE_COUNT} files`)
        

        // Create message
        const message = await Message.create({
            memberId: member.id,
            channelId: channel.id,
            content: content || "",
            createdAt: DateTime.now(),
        })

        return { 
            emit: {
                id: message.id,
                content: message.content,
                createdAt: message.createdAt,
                channelId: channel.id,
                user: {
                    id: user.id,
                    nick: user.nick
                } 
            },
            message: message
        }
    }
}