import { Request } from 'express';

export interface AuthorizedRequest extends Request {
  user?: {
    clientId?: string;
    id?: string;
    email?: string;
    roles?: string[];
    permissions?: string[];
  };
}
