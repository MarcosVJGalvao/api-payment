import {
  BackofficeUser,
  BackofficeUserStatus,
} from '../../entities/backoffice-user.entity';
import { CreateBackofficeUserDto } from '../../dto/create-backoffice-user.dto';

export const mockBackofficeUser = (): BackofficeUser => {
  const user = new BackofficeUser();
  user.id = 'uuid-user-1';
  user.name = 'John Doe';
  user.email = 'john@example.com';
  user.password = '$2b$10$hashedpassword';
  user.secretAnswer = '$2b$10$hashedsecret';
  user.clientId = 'uuid-client-1';
  user.status = BackofficeUserStatus.ACTIVE;
  user.createdAt = new Date();
  user.updatedAt = new Date();
  user.deletedAt = undefined;
  return user;
};

export const mockCreateBackofficeUserDto = (): CreateBackofficeUserDto => ({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'password123',
  secretAnswer: 'Smith',
});
