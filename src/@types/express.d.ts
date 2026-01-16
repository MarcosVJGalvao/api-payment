import 'express';

declare module 'express' {
  export interface Request {
    webhookClientId?: string;
    validPublicKey?: boolean;
    rawBody?: Buffer;
  }
}
