import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const IV_LENGTH = 16;
const ALGORITHM = 'aes-256-cbc';

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default-secret-key-must-be-changed';

/**
 * Helper para criptografia AES-256-CBC reversível.
 * Usado para armazenar senhas que precisam ser recuperadas posteriormente
 * (ex: credenciais de APIs externas).
 */
export class CryptoHelper {
  /**
   * Deriva uma chave de 32 bytes a partir da chave de ambiente.
   */
  private static async getKey(): Promise<Buffer> {
    const derived = await promisify(scrypt)(ENCRYPTION_KEY, 'salt', 32);
    if (Buffer.isBuffer(derived)) {
      return derived;
    }
    if (derived instanceof Uint8Array) {
      return Buffer.from(derived);
    }
    if (typeof derived === 'string') {
      return Buffer.from(derived, 'hex');
    }
    throw new Error('Invalid derived key type');
  }

  /**
   * Criptografa um texto usando AES-256-CBC.
   * @param text - Texto a ser criptografado
   * @returns Texto criptografado no formato `iv:encrypted`
   */
  static async encrypt(text: string): Promise<string> {
    const iv = randomBytes(IV_LENGTH);
    const key = await this.getKey();
    const cipher = createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  /**
   * Descriptografa um texto criptografado com AES-256-CBC.
   * @param text - Texto criptografado no formato `iv:encrypted`
   * @returns Texto original descriptografado
   */
  static async decrypt(text: string): Promise<string> {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift()!, 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = await this.getKey();
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
