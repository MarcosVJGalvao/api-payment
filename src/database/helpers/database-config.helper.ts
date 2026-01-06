import { ConfigService } from '@nestjs/config';

/**
 * Obtém valores de configuração do banco de dados
 * Quando SECRETS_SOURCE=VAULT: lê apenas de process.env (valores do Vault)
 * Quando SECRETS_SOURCE=ENV: lê do ConfigService (valores do .env)
 */
export function getDatabaseConfig(
  configService: ConfigService,
): {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  const secretsSource = configService.get<string>('SECRETS_SOURCE', 'ENV') || process.env.SECRETS_SOURCE || 'ENV';

  if (secretsSource === 'VAULT') {
    // Quando vem do Vault, ler APENAS de process.env (sem fallback para .env)
    const host = process.env.DB_HOST;
    const port = Number(process.env.DB_PORT);
    const username = process.env.DB_USERNAME;
    const password = process.env.DB_PASSWORD;
    const database = process.env.DB_DATABASE;

    const missingVars: string[] = [];
    if (!host) missingVars.push('DB_HOST');
    if (!port) missingVars.push('DB_PORT');
    if (!username) missingVars.push('DB_USERNAME');
    if (!password) missingVars.push('DB_PASSWORD');
    if (!database) missingVars.push('DB_DATABASE');

    if (missingVars.length > 0) {
      throw new Error(
        `Database configuration error: Secrets do Vault não foram carregados corretamente. ` +
        `Variáveis faltando: ${missingVars.join(', ')}. ` +
        `Verifique os logs do [VaultLoader] para mais detalhes.`
      );
    }

    // TypeScript: após validação, sabemos que todos os valores estão definidos
    return { 
      host: host!, 
      port: port!, 
      username: username!, 
      password: password!, 
      database: database! 
    };
  } else {
    // Quando vem do .env, ler do ConfigService
    const host = configService.get<string>('DB_HOST');
    const port = configService.get<number>('DB_PORT', 3306);
    const username = configService.get<string>('DB_USERNAME');
    const password = configService.get<string>('DB_PASSWORD');
    const database = configService.get<string>('DB_DATABASE');

    const missingVars: string[] = [];
    if (!host) missingVars.push('DB_HOST');
    if (!username) missingVars.push('DB_USERNAME');
    if (!password) missingVars.push('DB_PASSWORD');
    if (!database) missingVars.push('DB_DATABASE');

    if (missingVars.length > 0) {
      throw new Error(
        `Database configuration error: Variáveis obrigatórias não encontradas: ${missingVars.join(', ')}. ` +
        `Defina essas variáveis no arquivo .env.`
      );
    }

    // TypeScript: após validação, sabemos que todos os valores estão definidos
    return { 
      host: host!, 
      port, 
      username: username!, 
      password: password!, 
      database: database! 
    };
  }
}

