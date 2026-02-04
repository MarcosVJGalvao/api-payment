import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Gera um hash para uma string (senha, resposta secreta, etc).
 * @param data - Dado a ser hasheado
 * @returns Hash gerado
 */
export async function hashData(data: string): Promise<string> {
  return bcrypt.hash(data, SALT_ROUNDS);
}

/**
 * Compara um dado em texto plano com um hash.
 * @param data - Dado em texto plano
 * @param hash - Hash para comparação
 * @returns True se os dados coincidem
 */
export async function compareData(
  data: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(data, hash);
}
