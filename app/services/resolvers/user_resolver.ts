import { UserNotFoundException } from '#exceptions/exceptions'
import User from '#models/user'
import { Socket } from 'socket.io'

export default class ChannelResolver {

    static async curr(socket: Socket) {
        return (socket as any).user
    }

    static async byId(id: number) {

        // Try to find the invited user
        const user = await User.findBy('id', id)

        // Check whether user exists
        if (!user) throw new UserNotFoundException()
        
        // Return
        return user
    }
    
    static async byNick(nickname: string) {

        // Try to find the invited user
        const user = await User.findBy('nick', nickname)

        // Check whether user exists
        if (!user) throw new UserNotFoundException()
        
        // Return
        return user
    }
}