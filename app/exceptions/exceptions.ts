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

export class MessageOwnerRequiredException extends Exception {
  constructor(action_name: string) {
    super(`You must be the owner of the message to ${action_name} in that message.`, {
      status: 403,
      code: 'MESSAGE_OWNERSHIP_REQUIRED',
    })
  }
}

export class MembershipProhibitedException extends Exception {
  constructor(action_name: string) {
    super(`If you want to ${action_name}, then you cannot already be a member of the channel.`, {
      status: 403,
      code: 'MEMBERSHIP_PROHIBITED',
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

export class MemberInvitedAgainException extends Exception {
  constructor() {
    super('Cannot invite a user who is already a member of the channel.', {
      status: 403,
      code: 'MEMBER_INVITED_AGAIN',
    })
  }
}

export class DuplicateInviteException extends Exception {
  constructor() {
    super('Cannot invite a user who has already been invited.', {
      status: 403,
      code: 'DUPLICATE_INVITE',
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

export class MessageNotFoundException extends Exception {
  constructor() {
    super('Message has not been found.', {
      status: 403,
      code: 'MESSAGE_NOT_FOUND',
    })
  }
}

export class IncorrectMessageFormatException extends Exception {
  constructor(constraint_name: string) {
    super(`The format of the message is incorrect, because the following constraint has been violated: ${constraint_name}.`, {
      status: 403,
      code: 'INCORRECT_MESSAGE_FORMAT',
    })
  }
}

export class ProhibitedKickVoteException extends Exception {
  constructor(invalid_target_name: string) {
    super(`You cannot vote to kick ${invalid_target_name}.`, {
      status: 403,
      code: 'PROHIBITED_KICK_VOTE',
    })
  }
}

export class BlacklistEntryException extends Exception {
  constructor() {
    super("You are blacklisted from this channel.", {
      status: 403,
      code: 'BLACKLISTED',
    })
  }
}