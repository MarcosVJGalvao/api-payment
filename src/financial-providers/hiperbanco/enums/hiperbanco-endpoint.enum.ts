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
}
