export interface IInternalUser {
  id: string;
  username: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface ILoginInternalUser {
  username: string;
  password: string;
}
