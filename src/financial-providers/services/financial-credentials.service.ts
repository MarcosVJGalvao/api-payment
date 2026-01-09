import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderCredential } from '../entities/provider-credential.entity';
import { CreateProviderCredentialDto } from '../dto/create-provider-credential.dto';
import { CryptoHelper } from '../../common/helpers/crypto.helper';
import { CustomHttpException } from '../../common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '../../common/errors/enums/error-code.enum';
import { AppLoggerService } from '../../common/logger/logger.service';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderLoginType } from '../enums/provider-login-type.enum';

@Injectable()
export class FinancialCredentialsService {
  private readonly context = FinancialCredentialsService.name;

  constructor(
    @InjectRepository(ProviderCredential)
    private readonly repository: Repository<ProviderCredential>,
    private readonly logger: AppLoggerService,
  ) {}

  /**
   * Salva ou atualiza as credenciais de um provedor financeiro.
   * Permite múltiplas credenciais por provedor (uma para cada loginType).
   * A senha é criptografada antes de ser armazenada.
   * @param provider - Identificador do provedor (FinancialProvider)
   * @param dto - Dados de credencial (loginType, login, password)
   * @param clientId - ID do cliente multi-tenant (vem do header X-Client-Id)
   * @returns Credencial salva (senha oculta pelo @Exclude)
   */
  async saveCredentials(
    provider: FinancialProvider,
    dto: CreateProviderCredentialDto,
    clientId: string,
  ): Promise<ProviderCredential> {
    this.logger.log(
      `Saving credentials for provider: ${provider}, loginType: ${dto.loginType}, clientId: ${clientId}`,
      this.context,
    );

    let credential = await this.repository.findOne({
      where: {
        provider_slug: provider,
        loginType: dto.loginType,
      },
    });

    if (!credential) {
      credential = this.repository.create({
        provider_slug: provider,
        loginType: dto.loginType,
        clientId: clientId,
      });
      this.logger.log(
        `Creating new credential entry for ${provider} with loginType: ${dto.loginType}, clientId: ${clientId}`,
        this.context,
      );
    } else {
      // Atualiza o clientId se não estava definido (para credenciais antigas)
      if (!credential.clientId) {
        credential.clientId = clientId;
      }
    }

    credential.login = dto.login;
    credential.password = await CryptoHelper.encrypt(dto.password);

    const saved = await this.repository.save(credential);
    this.logger.log(
      `Credentials saved for provider: ${provider}, loginType: ${dto.loginType}, clientId: ${clientId}`,
      this.context,
    );
    return saved;
  }

  /**
   * Recupera credenciais de um provedor com a senha descriptografada.
   * Usado internamente para realizar autenticação com APIs externas.
   * @param provider - Identificador do provedor
   * @param loginType - Tipo de login: BACKOFFICE (email/senha) ou BANK (documento/senha)
   * @returns Credencial com senha descriptografada
   * @throws CustomHttpException se o provedor não existir
   */
  async getDecryptedCredentials(
    provider: FinancialProvider,
    loginType: ProviderLoginType,
  ): Promise<ProviderCredential> {
    const credential = await this.repository.findOne({
      where: {
        provider_slug: provider,
        loginType,
      },
    });
    if (!credential) {
      this.logger.warn(
        `Credentials not found for provider: ${provider}, loginType: ${loginType}`,
        this.context,
      );
      throw new CustomHttpException(
        `Provider credentials not found: ${provider} with loginType: ${loginType}`,
        HttpStatus.NOT_FOUND,
        ErrorCode.PROVIDER_CREDENTIALS_NOT_FOUND,
      );
    }

    credential.password = await CryptoHelper.decrypt(credential.password);
    return credential;
  }

  /**
   * Recupera credenciais públicas de um provedor (senha oculta).
   * @param provider - Identificador do provedor
   * @param loginType - Tipo de login: BACKOFFICE (email/senha) ou BANK (documento/senha)
   * @returns Credencial sem senha (oculta pelo interceptor/serializer)
   * @throws CustomHttpException se o provedor não existir
   */
  async getPublicCredentials(
    provider: FinancialProvider,
    loginType: ProviderLoginType,
  ): Promise<ProviderCredential> {
    const credential = await this.repository.findOne({
      where: {
        provider_slug: provider,
        loginType,
      },
    });
    if (!credential) {
      this.logger.warn(
        `Credentials not found for provider: ${provider}, loginType: ${loginType}`,
        this.context,
      );
      throw new CustomHttpException(
        `Provider credentials not found: ${provider} with loginType: ${loginType}`,
        HttpStatus.NOT_FOUND,
        ErrorCode.PROVIDER_CREDENTIALS_NOT_FOUND,
      );
    }
    return credential;
  }
}
