export interface FileMetaData {
    size: number
    mime_type: string
    name: string
    path: string
}

import type { ReadStream } from 'node:fs'

export interface UploadedFile {
  clientName: string
  size: number
  extname: string
  mime_type: string
  isValid: boolean
  stream: ReadStream
}