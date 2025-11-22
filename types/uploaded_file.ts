import type { Readable } from "stream"

export interface UploadedFile {
    stream: Readable 
    extname: string
    size: number
    mime_type: string
    clientName: string
    isValid: boolean
}