import User from "#models/user"
import { UserStatus } from "types/string_literals.js"

export default class UsersService {

    static async updateUserStatus(user: User, data: {status: UserStatus}) : Promise<void> {
        user.status = data.status
        await user.save()
    }
}