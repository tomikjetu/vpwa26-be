import { FileMetaData } from './message_types.js'
import type { NotifStatus, UserStatus } from './string_literals.js'

// ────────────────────────────────────────────────────────────────
// CHANNEL DTOs
// ────────────────────────────────────────────────────────────────

export interface ChannelCreateDTO {
  name: string
  isPrivate?: boolean
}

export interface ChannelJoinDTO {
  name: string
}

export interface ChannelListMembersDTO {
  channelId: number
}

export interface ChannelListInvitesDTO {
  channelId: number
}

export interface ChannelCancelDTO {
  channelId: number
}

export interface ChannelQuitDTO {
  channelId: number
}

// ────────────────────────────────────────────────────────────────
// MEMBER DTOs
// ────────────────────────────────────────────────────────────────

export interface MemberKickVoteDTO {
  channelId: number
  targetMemberId: number
}

export interface MemberNotifStatusUpdateDTO {
  channelId: number
  status: NotifStatus
}

// ────────────────────────────────────────────────────────────────
// INVITE DTOs
// ────────────────────────────────────────────────────────────────

export interface InviteCreateDTO {
  channelId: number
  nickname: string
}

export interface InviteAcceptDTO {
  channelId: number
}

export interface InviteDeclineDTO {
  channelId: number
}

// ────────────────────────────────────────────────────────────────
// MESSAGE DTOs
// ────────────────────────────────────────────────────────────────

export interface MessageListDTO {
  channelId: number
  offset: number
}

export interface MessageSendDTO {
  channelId: number
  content?: string
  files?: FileMetaData[]
}

export interface MessageTypingDTO {
  channelId: number
  message: string
}

// ────────────────────────────────────────────────────────────────
// USER DTOs
// ────────────────────────────────────────────────────────────────

export interface UserStatusDTO {
  status: UserStatus
}

// ────────────────────────────────────────────────────────────────
// CLIENT TO SERVER EVENTS CONTRACT
// ────────────────────────────────────────────────────────────────

export interface ClientToServerEvents {
  // Channel events
  'channel:list': () => void
  'channel:create': (data: ChannelCreateDTO) => void
  'channel:join': (data: ChannelJoinDTO) => void
  'channel:list-members': (data: ChannelListMembersDTO) => void
  'channel:listInvites': (data: ChannelListInvitesDTO) => void
  'channel:cancel': (data: ChannelCancelDTO) => void
  'channel:quit': (data: ChannelQuitDTO) => void

  // Member events
  'member:kick-vote': (data: MemberKickVoteDTO) => void
  'member:notif-status:update': (data: MemberNotifStatusUpdateDTO) => void

  // Invite events
  'invite:list': () => void
  'invite:create': (data: InviteCreateDTO) => void
  'invite:accept': (data: InviteAcceptDTO) => void
  'invite:decline': (data: InviteDeclineDTO) => void

  // Message events
  'msg:list': (data: MessageListDTO) => void
  'msg:send': (data: MessageSendDTO) => void
  'msg:typing': (data: MessageTypingDTO) => void

  // User events
  'user:status': (data: UserStatusDTO) => void
}
