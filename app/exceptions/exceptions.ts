import { Exception } from '@adonisjs/core/exceptions'

export class InviteRequiredException extends Exception {
  constructor(action_name: string) {
    super(`You must be invited to ${action_name}.`, {
      status: 403,
      code: 'INVITE_REQUIRED',
    })
  }
}

export class MembershipRequiredException extends Exception {
  constructor(action_name: string) {
    super(`You must be a member of the channel to ${action_name}.`, {
      status: 403,
      code: 'MEMBERSHIP_REQUIRED',
    })
  }
}

export class OwnershipRequiredException extends Exception {
  constructor(action_name: string) {
    super(`You must be an owner of the channel to ${action_name}.`, {
      status: 403,
      code: 'OWNERSHIP_REQUIRED',
    })
  }
}

export class ChannelNotFoundException extends Exception {
  constructor() {
    super('Channel has not been found.', {
      status: 403,
      code: 'CHANNEL_NOT_FOUND',
    })
  }
}

export class MemberNotFoundException extends Exception {
  constructor() {
    super('Member has not been found.', {
      status: 403,
      code: 'MEMBER_NOT_FOUND',
    })
  }
}

export class UserNotFoundException extends Exception {
  constructor() {
    super('User has not been found.', {
      status: 403,
      code: 'USER_NOT_FOUND',
    })
  }
}