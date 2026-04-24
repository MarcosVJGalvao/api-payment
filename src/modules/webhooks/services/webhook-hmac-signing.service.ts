import { Injectable } from '@nestjs/common';
import { createHmac, randomBytes } from 'crypto';

export interface HmacSignatureResult {
  /** Valor do header Authorization: "hmac <base64>" */
  authorization: string;
  timestamp: string;
  nonce: string;
}

@Injectable()
export class WebhookHmacSigningService {
  sign(
    uri: string,
    rawBody: string,
    publicKey: string,
    privateKey: string,
  ): HmacSignatureResult {
    const timestamp = new Date().toISOString();
    const nonce = randomBytes(16).toString('hex');
    const requestUri = encodeURIComponent(uri.toLowerCase());
    const bodyBase64 = Buffer.from(rawBody, 'utf8').toString('base64');
    const preHashedString = `${publicKey}&${requestUri}&${timestamp}&${nonce}&${bodyBase64}`;

    const signature = createHmac('sha256', privateKey)
      .update(preHashedString, 'utf8')
      .digest('base64');

    return {
      authorization: `hmac ${signature}`,
      timestamp,
      nonce,
    };
  }

  generateKeyPair(): { publicKey: string; privateKey: string } {
    return {
      publicKey: randomBytes(16).toString('hex'),
      privateKey: randomBytes(32).toString('hex'),
    };
  }
}
