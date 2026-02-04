import { DataSource } from 'typeorm';
import { hashData } from '@/common/helpers/password.helper';
import { InternalUser } from '@/internal-user/entities/internal-user.entity';

export const internalUsers = [
  {
    username: 'admin',
    email: 'admin@api-payments.com',
    password: 'admin123', // Will be hashed
    name: 'Administrator',
  },
];

export async function seedInternalUsers(
  dataSource: DataSource,
): Promise<InternalUser[]> {
  const userRepository = dataSource.getRepository(InternalUser);
  const createdUsers: InternalUser[] = [];

  for (const userData of internalUsers) {
    const existingUser = await userRepository.findOne({
      where: { username: userData.username },
    });

    if (!existingUser) {
      // Hash password
      const hashedPassword = await hashData(userData.password);

      const user = userRepository.create({
        username: userData.username,
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
      });

      const savedUser = await userRepository.save(user);
      createdUsers.push(savedUser);
      console.log(`✓ Created internal user: ${userData.username}`);
      console.log(`  Email: ${userData.email}`);
      console.log(
        `  Password: ${userData.password} (change after first login)`,
      );
    } else {
      console.log(`- Internal user already exists: ${userData.username}`);
      createdUsers.push(existingUser);
    }
  }

  return createdUsers;
}
