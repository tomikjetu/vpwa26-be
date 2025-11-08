import { ChannelNotFoundException } from '#exceptions/exceptions'
import Channel from '#models/channel'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'


export default class LoadChannelMiddleware {
  public async handle(ctx: HttpContext, next: NextFn) {
    const { channel_id } = ctx.params
    // Try to find the channel
    const channel = await Channel.find(channel_id)

    // If not found, return 404 response
    if (!channel) throw new ChannelNotFoundException()

    // Attach channel to context (so controller or next middleware can use it)
    ctx.channel = channel

    // Continue the middleware chain
    await next()
  }
}