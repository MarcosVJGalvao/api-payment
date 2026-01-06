/**
 * Interfaces de resposta da API do Hiperbanco
 * Tipagem mínima - apenas campos essenciais são obrigatórios
 */

export interface HiperbancoAccount {
    id: string;
    status: string;
    branch: string;
    number: string;
    type: string;
}

export interface BankLoginUserData extends Record<string, unknown> {
    id: string;
    accounts: HiperbancoAccount[];
}

export interface BankLoginResponse extends Record<string, unknown> {
    access_token: string;
    userData: BankLoginUserData;
}

export interface BackofficeLoginResponse extends Record<string, unknown> {
    access_token: string;
}

export interface RegisterWebhookResponse {
    id: string;
    name: string;
    context: string;
    eventName: string;
    uri: string;
    publicKey: string;
}
