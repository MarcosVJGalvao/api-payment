import { Injectable, HttpStatus } from '@nestjs/common';
import { FinancialProvider } from '@/common/enums/financial-provider.enum';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import { CustomHttpException } from '@/common/errors/exceptions/custom-http.exception';
import { ErrorCode } from '@/common/errors/enums/error-code.enum';
import { HiperbancoPixHelper } from './hiperbanco/hiperbanco-pix.helper';
import {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { RegisterPixKeyDto } from '../dto/register-pix-key.dto';
import { GenerateTotpDto } from '../dto/generate-totp.dto';

/**
 * Helper responsável por rotear requisições PIX para o provedor correto.
 */
@Injectable()
export class PixProviderHelper {
  constructor(private readonly hiperbancoHelper: HiperbancoPixHelper) {}

  /**
   * Consulta chaves PIX no provedor especificado.
   * @param provider Provedor financeiro.
   * @param accountNumber Número da conta.
   * @param session Sessão autenticada do provedor.
   * @returns Lista de chaves PIX.
   */
  async getPixKeys(
    provider: FinancialProvider,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.getPixKeys(accountNumber, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Registra uma chave PIX no provedor especificado.
   * @param provider Provedor financeiro.
   * @param dto Dados da chave a ser registrada.
   * @param accountBranch Agência da conta.
   * @param accountNumber Número da conta.
   * @param session Sessão autenticada do provedor.
   * @returns Resposta do registro.
   */
  async registerPixKey(
    provider: FinancialProvider,
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.registerPixKey(
          dto,
          accountBranch,
          accountNumber,
          session,
        );
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Exclui uma chave PIX no provedor especificado.
   * @param provider Provedor financeiro.
   * @param addressKey Valor da chave a ser excluída.
   * @param session Sessão autenticada do provedor.
   */
  async deletePixKey(
    provider: FinancialProvider,
    addressKey: string,
    session: ProviderSession,
  ): Promise<void> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.deletePixKey(addressKey, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }

  /**
   * Gera código TOTP no provedor especificado.
   * @param provider Provedor financeiro.
   * @param dto Dados para geração do TOTP.
   * @param session Sessão autenticada do provedor.
   */
  async generateTotpCode(
    provider: FinancialProvider,
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    switch (provider) {
      case FinancialProvider.HIPERBANCO:
        return this.hiperbancoHelper.generateTotpCode(dto, session);
      default:
        throw new CustomHttpException(
          `Provider ${String(provider)} is not supported for PIX`,
          HttpStatus.BAD_REQUEST,
          ErrorCode.INVALID_INPUT,
        );
    }
  }
}
