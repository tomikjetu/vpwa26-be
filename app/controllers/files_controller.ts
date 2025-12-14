import type { HttpContext } from '@adonisjs/core/http'
import FileService from "#services/files_service"
import fs from 'fs'
import MemberResolver from '#services/resolvers/member_resolver'
import { ChannelNotFoundException, MemberNotFoundException, UserNotFoundException } from '#exceptions/exceptions'
import { UploadedFile } from 'types/message_types.js'
import ChannelResolver from '#services/resolvers/channel_resolver'

export default class FilesController {

  /**
   * Upload files to a message in a channel
   */
  public async uploadFiles(ctx: HttpContext) {
    const channel_id = ctx.request.param('channel_id')

    const user = (ctx as any).user
    if(!user) throw new UserNotFoundException()

    const member = await MemberResolver.byUserAndChannel(user.id, channel_id)
    if(!member) throw new MemberNotFoundException()
    
    try {
      // Grab uploaded files from the HTTP request
      const files = ctx.request.files('files', {
        size: '20mb', // optional size limit
      })

      // Map Adonis MultipartFile to your UploadedFile format
      const uploadedFiles : UploadedFile[] = files.map(file => ({
        clientName: file.clientName,
        size: file.size,
        extname: file.extname || '',
        mime_type: file.type || 'application/octet-stream', 
        isValid: file.isValid,
        stream: fs.createReadStream(file.tmpPath!), // convert temp file to stream
      }))

      // Call your existing service to store files
      const file_UUID = await FileService.postFile(channel_id, uploadedFiles)

      return ctx.response.status(200).json({ success: true, message: 'Files uploaded successfully', file_UUID: file_UUID})
    } catch (err) {
      return ctx.response.status(400).json({ error: err.message })
    }
  }

  /**
   * Download a file from a channel
   */
  public async downloadFile(ctx: HttpContext) {
    try {
      const user = (ctx as any).user
      const channel_id = ctx.request.param('channel_id')
      const file_UUID = ctx.request.param('file_UUID')

      console.log(channel_id)

      const channel = await ChannelResolver.byId(channel_id)
      if(!channel) throw new ChannelNotFoundException()
      
      const member = await MemberResolver.byUserAndChannel(user.id, channel.id)
      if(!member) throw new MemberNotFoundException()

      const stream = await FileService.getFile(channel_id, file_UUID)

      // Pipe the file stream to the response
      return ctx.response.stream(stream as any)
    } catch (err) {
      return ctx.response.status(404).json({ error: err.message })
    }
  }
}