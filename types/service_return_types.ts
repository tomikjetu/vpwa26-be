import Channel from "#models/channel"
import Stream from "stream"
import Member from "#models/member"
import { DateTime } from "luxon"

export interface CreateChannel_Response {
    channel: Channel,
    member: Member,
}

export interface JoinChannel_Response { 
    channel: Channel, 
    created: boolean, 
    joined: boolean,
    member: Member,
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
    invitedAt: DateTime,
    channelName: string,
    inviteId: number
}

export interface AcceptInvite_Response {
    channelId: number, 
    member: Member
}