export interface JwtPayload {
  userId?: string;
  username?: string;
  email?: string;
  sub?: string;
  roles?: string[];
  clientId?: string;
}
