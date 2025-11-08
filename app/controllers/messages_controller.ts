import Member from '#models/member'
import File from '#models/file'
import type { HttpContext } from '@adonisjs/core/http'
import { MembershipRequiredException } from '#exceptions/exceptions'
import { schema, rules } from '@adonisjs/validator'
import { cuid } from '@adonisjs/core/helpers'
import Message from '#models/message'
import { DateTime } from 'luxon'
import type { MultipartFile } from '@adonisjs/core/bodyparser'
import { MESSAGE_CONSTANTS } from '#constants/constants.js'
import Drive from '@adonisjs/drive/services/main'
import type { Readable } from 'stream'

/**
 * Controller class
 */
export default class MessagesController {
 /**
   * Get a list of messages in the channel, the files for each message, and information about members needed for the messages (nicknames, id)
   */
  public async index(ctx: HttpContext) {
    const channel = ctx.channel!

    // Query messages
    const messages = await channel
        .related('messages')
        .query()
        .preload('files', (fileQuery) => {
            fileQuery.select(['name', 'id', 'mime_type', 'size'])
        })
        .orderBy('created_at', 'desc')
        .limit(MESSAGE_CONSTANTS.BATCH_SIZE)

    // Query members
    const members = await Member.query()
        .where('channel_id', channel.id)
        .select(['id', 'channel_id', 'is_owner'])
        .preload('user', (userQuery) => { // Add necessary user information to members
            userQuery.select(['nick'])
        })

    return ctx.response.ok({messages, members})
  }


    /**
     * Send a message (optionally with file)
     */
    public async store(ctx: HttpContext) {
        const { request, auth, response } = ctx
        const channel = ctx.channel!
        const user = auth.user!
        const user_member = ctx.user_member!

        if (!ctx.user_member) {
            throw new MembershipRequiredException('send messages in a channel')
        }

        // Validate text content only
        const messageSchema = schema.create({
            content: schema.string.optional({ trim: true }, [rules.maxLength(MESSAGE_CONSTANTS.MAX_LENGTH)]),
        })

        const { content } = await request.validate({ schema: messageSchema })

        // Handle file upload separately
        const files = request.files('file', {
            size: MESSAGE_CONSTANTS.MAX_FILE_SIZE,
            extnames: ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'txt'],
        }) as unknown as Array<MultipartFile & { stream: NodeJS.ReadableStream }>

        // Check at least one valid input
        if (!content && files.length === 0) {
            return response.badRequest({ error: 'Message must contain text or a file.' })
        }

        // Check too many files
        if (files.length > MESSAGE_CONSTANTS.MAX_FILE_COUNT) {
            return response.badRequest({ error: 'Message must contain at most 10 files.' })
        }

        // Create message
        const message = await Message.create({
            memberId: user_member.id,
            channelId: channel.id,
            content: content || '',
            createdAt: DateTime.now(),
        })

        // Save files (if any)
        const savedFiles: File[] = []

        for (const file of files) {
            if (!file.isValid) continue

            const fileName = `${cuid()}.${file.extname}`
            await Drive.use('fs').putStream(`uploads/${fileName}`, file.stream as unknown as Readable)

            const savedFile = await File.create({
                messageId: message.id,
                path: `/uploads/${fileName}`,
                name: file.clientName,
                size: file.size,
                mime_type: file.type || 'unknown',
                channelId: channel.id,
            })

            savedFiles.push(savedFile)
        }

        return response.created({
            message: 'Message sent successfully',
            data: {
                id: message.id,
                content: message.content,
                files: savedFiles.map((f) => ({
                    name: f.name,
                    mime_type: f.mime_type,
                    size: f.size,
                })),
                createdAt: message.createdAt,
                user: {
                    id: user.id,
                    nick: user.nick,
                },
            },
        })
    }
}