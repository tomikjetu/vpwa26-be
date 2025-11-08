import Member from '#models/member'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'


export default class LoadUserMemberMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    // Get user
    const user = ctx.auth.user
    
    // Try to find the member
    const member = await Member.findBy('user_id', user!.id)

    // Attach member to context (so controller or next middleware can use it)
    ctx.user_member = member

    await next()
  }
}