export interface InternalUserJwtPayload {
  userId: string;
  username: string;
  email: string;
  type: 'internal';
}
