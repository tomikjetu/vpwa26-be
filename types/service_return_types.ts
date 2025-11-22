import Channel from "#models/channel"
import Stream from "stream"
import User from '#models/user'

export interface JoinChannel_Response { 
    channel: Channel, 
    created: boolean, 
    joined: boolean
}

export interface CancelChannel_Response {
    message: string,
    deleted: boolean
}

export interface CastKickVote_Response {
    kicked: boolean,
    votes: number | null,
    reason: string
}

export interface GetFile_Response {
    stream: Stream.Readable,
    mime: string,
    name: string,
    path: string,
    channelId: number,
}

export interface CreateInvite_Response {
    invited: boolean,
    user: User,
    channelId: number,
}