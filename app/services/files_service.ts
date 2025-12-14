import File from '#models/file'
import { FileMetaData, UploadedFile } from "types/message_types.js"
import Drive from '@adonisjs/drive/services/main'
import Stream from "stream"

export default class FilesService {

    static async postFile(channel_id: number, files: UploadedFile[]) : Promise<string[]> {
        const file_names = []
        // Post files
        for (const file of files) {
            if (!file.isValid) continue

            const name = `${crypto.randomUUID()}.${file.extname}`

            await Drive.use("fs").putStream(`uploads/${channel_id}/files/${name}`, file.stream)

            file_names.push(name)
        }
        return file_names
    }

    static async getFile(channel_id: number, file_UUID: string) : Promise<Stream> {
        console.log(file_UUID)
        return await Drive.use("fs").getStream(`uploads/${channel_id}/files/${file_UUID}`)
    }

    static async createDatabaseEntry(message_id: number, channel_id: number, file: FileMetaData) : Promise<void> {
        await File.create({
            messageId: message_id,
            channelId: channel_id,
            path: file.path,
            name: file.name,
            size: file.size,
            mime_type: file.mime_type,
        })
    }
}