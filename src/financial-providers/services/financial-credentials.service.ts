import { Injectable, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProviderCredential } from '../entities/provider-credential.entity';
import { CreateProviderCredentialDto } from '../dto/create-provider-credential.dto';
import { CryptoHelper } from '../../common/helpers/crypto.helper';
import { CustomHttpException } from '../../common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '../../common/errors/enums/error-code.enum';
import { AppLoggerService } from '../../common/logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FinancialCredentialsService {
    private readonly context = FinancialCredentialsService.name;

    constructor(
        @InjectRepository(ProviderCredential)
        private readonly repository: Repository<ProviderCredential>,
        private readonly logger: AppLoggerService,
    ) { }

    /**
     * Salva ou atualiza as credenciais de um provedor financeiro.
     * A senha é criptografada antes de ser armazenada.
     * @param providerSlug - Identificador do provedor (ex: 'hiperbanco')
     * @param dto - Dados de credencial (login, password)
     * @returns Credencial salva (senha oculta pelo @Exclude)
     */
    async saveCredentials(
        providerSlug: string,
        dto: CreateProviderCredentialDto,
    ): Promise<ProviderCredential> {
        this.logger.log(`Saving credentials for provider: ${providerSlug}`, this.context);

        let credential = await this.repository.findOne({ where: { provider_slug: providerSlug } });

        if (!credential) {
            credential = this.repository.create({
                provider_slug: providerSlug,
                client_id: uuidv4(),
            });
            this.logger.log(`Creating new credential entry for ${providerSlug}`, this.context);
        }

        credential.login = dto.login;
        credential.password = await CryptoHelper.encrypt(dto.password);

        const saved = await this.repository.save(credential);
        this.logger.log(`Credentials saved for provider: ${providerSlug}`, this.context);
        return saved;
    }

    /**
     * Recupera credenciais de um provedor com a senha descriptografada.
     * Usado internamente para realizar autenticação com APIs externas.
     * @param providerSlug - Identificador do provedor
     * @returns Credencial com senha descriptografada
     * @throws CustomHttpException se o provedor não existir
     */
    async getDecryptedCredentials(providerSlug: string): Promise<ProviderCredential> {
        const credential = await this.repository.findOne({ where: { provider_slug: providerSlug } });
        if (!credential) {
            this.logger.warn(`Credentials not found for provider: ${providerSlug}`, this.context);
            throw new CustomHttpException(
                `Provider credentials not found: ${providerSlug}`,
                HttpStatus.NOT_FOUND,
                ErrorCode.PROVIDER_CREDENTIALS_NOT_FOUND,
            );
        }

        credential.password = await CryptoHelper.decrypt(credential.password);
        return credential;
    }

    /**
     * Recupera credenciais públicas de um provedor (senha oculta).
     * @param providerSlug - Identificador do provedor
     * @returns Credencial sem senha (oculta pelo interceptor/serializer)
     * @throws CustomHttpException se o provedor não existir
     */
    async getPublicCredentials(providerSlug: string): Promise<ProviderCredential> {
        const credential = await this.repository.findOne({ where: { provider_slug: providerSlug } });
        if (!credential) {
            this.logger.warn(`Credentials not found for provider: ${providerSlug}`, this.context);
            throw new CustomHttpException(
                `Provider credentials not found: ${providerSlug}`,
                HttpStatus.NOT_FOUND,
                ErrorCode.PROVIDER_CREDENTIALS_NOT_FOUND,
            );
        }
        return credential;
    }
}
