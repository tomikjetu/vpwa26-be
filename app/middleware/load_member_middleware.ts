import { MemberNotFoundException } from '#exceptions/exceptions'
import Member from '#models/member'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'


export default class LoadMemberMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    const { member_id } = ctx.params
    
    // Try to find the member
    const member = await Member.find(member_id)

    // If not found, return 404 response
    if (!member) throw new MemberNotFoundException()

    // Attach member to context (so controller or next middleware can use it)
    ctx.member = member

    // Continue the middleware chain
    await next()
  }
}