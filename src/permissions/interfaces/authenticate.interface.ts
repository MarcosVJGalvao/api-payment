export interface AuthenticatedUser {
  userId: string;
}

export interface AuthenticatedRequest {
  user?: AuthenticatedUser;
}
