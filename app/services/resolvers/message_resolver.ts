import { MessageNotFoundException } from '#exceptions/exceptions'
import Message from '#models/message'

export default class MessageResolver {

    static async byId(id: number) {

        // Try to find the invited user
        const message = await Message.findBy('id', id)

        // Check whether user exists
        if (!message) throw new MessageNotFoundException()
        
        // Return
        return message
    }
}