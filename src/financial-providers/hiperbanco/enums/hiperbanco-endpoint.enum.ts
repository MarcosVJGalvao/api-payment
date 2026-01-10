/**
 * Enum com todos os endpoints da API Hiperbanco.
 * Centraliza as rotas utilizadas na integração para facilitar manutenção.
 */
export enum HiperbancoEndpoint {
  // ============ Auth ============
  /** Login via backoffice (email/senha) */
  LOGIN_BACKOFFICE = '/Backoffice/Login',
  /** Login via API Bank (documento/senha) */
  LOGIN_BANK = '/Users/login/api-bank',

  // ============ Webhook ============
  /** Registrar um novo webhook */
  WEBHOOK_REGISTER = '/WebhookInternal/registerWebhook',
  /** Listar webhooks registrados */
  WEBHOOK_LIST = '/WebhookInternal/webhooks',
  /** Atualizar URL de um webhook (path param: webhookId) */
  WEBHOOK_UPDATE = '/WebhookInternal/changeWebhook',
  /** Deletar um webhook (path param: webhookId) */
  WEBHOOK_DELETE = '/WebhookInternal/deleteWebhook',

  // ============ Boleto ============
  /** Emitir um novo boleto */
  BOLETO_EMISSION = '/boletos/emission',
  /** Obter dados de um boleto (path params: authenticationCode/branch/number) */
  BOLETO_GET_DATA = '/boletos/getData',
  /** Cancelar um boleto (DELETE com body) */
  BOLETO_CANCEL = '/boletos',

  // ============ Bill Payment (Pagamento de Contas) ============
  /** Validar título pela linha digitável (PATCH) */
  BILL_PAYMENT_VALIDATE = '/Payments/validate',
  /** Confirmar pagamento (POST) */
  BILL_PAYMENT_CONFIRM = '/Payments/confirm',
  /** Consultar detalhes do pagamento (path params: branch/account/authCode) */
  BILL_PAYMENT_DETAIL = '/Payments/detail',

  // ============ PIX ============
  /** Consultar chaves PIX de uma conta (path param: accountNumber) */
  PIX_GET_KEYS = '/pix',
  /** Registrar nova chave PIX */
  PIX_REGISTER_KEY = '/pix/register-pix-key',
  /** Excluir chave PIX (path param: addressKey) */
  PIX_DELETE_KEY = '/pix/keys',
  /** Gerar código TOTP para validação de chaves EMAIL/PHONE */
  PIX_GENERATE_TOTP = '/totp-code',
}
