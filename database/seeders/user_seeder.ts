import User from '#models/user'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { DateTime } from 'luxon'

export default class UserSeeder extends BaseSeeder {
  public async run() {
    // Unique key to prevent duplicates if seeder is run multiple times
    const uniqueKey = 'email'

    await User.updateOrCreateMany(uniqueKey, [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        nick: 'jd_admin',
        // NOTE: In a real app, this MUST be a hashed password. Using a placeholder here.
        passwdHash: 'hashed_password_123', 
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        nick: 'jane_s',
        passwdHash: 'hashed_password_456',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
      {
        firstName: 'Tom',
        lastName: 'Wilson',
        email: 'tom.wilson@example.com',
        nick: 'twil',
        passwdHash: 'hashed_password_789',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      },
    ])
  }
}