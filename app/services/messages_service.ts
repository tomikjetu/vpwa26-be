import Member from '#models/member'
import File from '#models/file'
import Channel from '#models/channel'
import User from '#models/user'
import { IncorrectMessageFormatException, MembershipRequiredException } from '#exceptions/exceptions'
import Message from '#models/message'
import { DateTime } from 'luxon'
import { MESSAGE_CONSTANTS } from '#constants/constants'
import Drive from '@adonisjs/drive/services/main'
import { UploadedFile } from 'types/message_types.js'

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
            fileQuery.select(['name', 'id', 'mime_type', 'size'])
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
        content?: string,
        files: UploadedFile[] = []
    ) {

        // Check exceptions
        if (!member) throw new MembershipRequiredException("send messages in a channel")
        
        if ((!content || content.trim().length === 0) && files.length === 0) throw new IncorrectMessageFormatException("message must contain either text or at least one file")
        
        if (content && content.length > MESSAGE_CONSTANTS.MAX_LENGTH) throw new IncorrectMessageFormatException(`messsage must be less than ${MESSAGE_CONSTANTS.MAX_LENGTH} characters long`)
        
        if (files.length > MESSAGE_CONSTANTS.MAX_FILE_COUNT) throw new IncorrectMessageFormatException(`messsage can contain at most ${MESSAGE_CONSTANTS.MAX_FILE_COUNT} files`)
        

        // Create message
        const message = await Message.create({
            memberId: member.id,
            channelId: channel.id,
            content: content || "",
            createdAt: DateTime.now(),
        })

        // Save files
        const savedFiles: File[] = []

        for (const file of files) {
            if (!file.isValid) continue

            const name = `${crypto.randomUUID()}.${file.extname}`

            await Drive.use("fs").putStream(`uploads/${name}`, file.stream)

            const saved = await File.create({
                messageId: message.id,
                channelId: channel.id,
                path: `/uploads/${name}`,
                name: file.clientName,
                size: file.size,
                mime_type: file.mime_type,
            })

            savedFiles.push(saved)
        }

        return {
            id: message.id,
            content: message.content,
            createdAt: message.createdAt,
            channelId: channel.id,
            files: savedFiles.map(f => ({
                name: f.name,
                mime: f.mime_type,
                size: f.size,
                id: f.id
            })),
            user: {
                id: user.id,
                nick: user.nick
            }
        }
    }
}