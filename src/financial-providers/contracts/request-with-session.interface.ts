import type { Request } from 'express';
import { ProviderSession } from './provider-session';

export interface RequestWithSession extends Request {
  clientId?: string;
  accountId?: string;
  providerSession: ProviderSession;
}
