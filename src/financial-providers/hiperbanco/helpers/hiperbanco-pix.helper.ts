import { Injectable } from '@nestjs/common';
import { HiperbancoHttpService } from '@/financial-providers/hiperbanco/hiperbanco-http.service';
import { ProviderSession } from '@/financial-providers/hiperbanco/interfaces/provider-session.interface';
import {
  PixGetKeysResponse,
  PixRegisterKeyResponse,
} from '@/financial-providers/hiperbanco/interfaces/hiperbanco-responses.interface';
import { HiperbancoEndpoint } from '@/financial-providers/hiperbanco/enums/hiperbanco-endpoint.enum';
import { RegisterPixKeyDto } from '@/pix/dto/register-pix-key.dto';
import { GenerateTotpDto } from '@/pix/dto/generate-totp.dto';
import { PixKeyType } from '@/pix/enums/pix-key-type.enum';
import { PixAccountType } from '@/pix/enums/pix-account-type.enum';

/**
 * Helper responsável pela comunicação com o Hiperbanco para operações PIX.
 */
@Injectable()
export class HiperbancoPixHelper {
  constructor(private readonly hiperbancoHttp: HiperbancoHttpService) {}

  /**
   * Consulta as chaves PIX vinculadas a uma conta.
   * @param accountNumber Número da conta.
   * @param session Sessão autenticada do provedor.
   * @returns Lista de chaves PIX da conta.
   */
  async getPixKeys(
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixGetKeysResponse> {
    const path = `${HiperbancoEndpoint.PIX_GET_KEYS}/${accountNumber}`;

    return this.hiperbancoHttp.get<PixGetKeysResponse>(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }

  /**
   * Registra uma nova chave PIX no Hiperbanco.
   * @param dto Dados da chave a ser registrada.
   * @param accountBranch Agência da conta.
   * @param accountNumber Número da conta.
   * @param session Sessão autenticada do provedor.
   * @returns Resposta do Hiperbanco com dados da chave registrada.
   */
  async registerPixKey(
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
    session: ProviderSession,
  ): Promise<PixRegisterKeyResponse> {
    const payload = this.buildRegisterPayload(
      dto,
      accountBranch,
      accountNumber,
    );

    return this.hiperbancoHttp.post<PixRegisterKeyResponse>(
      HiperbancoEndpoint.PIX_REGISTER_KEY,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  /**
   * Exclui uma chave PIX.
   * @param addressKey Valor da chave a ser excluída.
   * @param session Sessão autenticada do provedor.
   */
  async deletePixKey(
    addressKey: string,
    session: ProviderSession,
  ): Promise<void> {
    const path = `${HiperbancoEndpoint.PIX_DELETE_KEY}/${encodeURIComponent(addressKey)}`;

    await this.hiperbancoHttp.delete(path, {
      headers: {
        Authorization: `Bearer ${session.hiperbancoToken}`,
      },
    });
  }

  /**
   * Gera um código TOTP para validação de chave EMAIL ou PHONE.
   * O código será enviado por SMS (PHONE) ou email (EMAIL).
   * @param dto Dados para geração do TOTP.
   * @param session Sessão autenticada do provedor.
   */
  async generateTotpCode(
    dto: GenerateTotpDto,
    session: ProviderSession,
  ): Promise<void> {
    const payload = {
      operation: dto.operation,
      totpData: {
        addressingKey: {
          type: dto.type,
          value: dto.value,
        },
        ...(dto.pixKeyClaimId && { pixKeyClaimId: dto.pixKeyClaimId }),
      },
    };

    await this.hiperbancoHttp.post(
      HiperbancoEndpoint.PIX_GENERATE_TOTP,
      payload,
      {
        headers: {
          Authorization: `Bearer ${session.hiperbancoToken}`,
        },
      },
    );
  }

  /**
   * Monta o payload para registro de chave PIX conforme o tipo.
   */
  private buildRegisterPayload(
    dto: RegisterPixKeyDto,
    accountBranch: string,
    accountNumber: string,
  ): Record<string, unknown> {
    const basePayload = {
      addressingKey: {
        type: dto.type,
        ...(dto.type !== PixKeyType.EVP && { value: dto.value }),
      },
      account: {
        type: PixAccountType.CHECKING,
        branch: accountBranch,
        number: accountNumber,
      },
    };

    // Para EMAIL e PHONE, adicionar totpCode
    if (dto.type === PixKeyType.EMAIL || dto.type === PixKeyType.PHONE) {
      return {
        ...basePayload,
        totpCode: dto.totpCode,
      };
    }

    return basePayload;
  }
}
