/**
 * Interfaces de resposta da API do Hiperbanco
 * Tipagem mínima - apenas campos essenciais são obrigatórios
 */

export interface HiperbancoRequestOptions {
    headers?: Record<string, string>;
    params?: Record<string, string | number | boolean>;
}

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

export type UpdateWebhookResponse = RegisterWebhookResponse;

export interface WebhookItem {
    id: string;
    name: string;
    eventName: string;
    context: string;
    uri: string;
    publicKey: string;
    createdAt: string;
    updatedAt?: string;
    status: 'Enabled' | 'Disabled';
}

export interface WebhookListMeta {
    page: number;
    pageSize: number;
    total: number;
}

export interface ListWebhooksResponse {
    data: WebhookItem[];
    meta: WebhookListMeta;
}

export interface HiperbancoErrorResponse {
    message?: string;
    errorCode?: string;
}

export interface BoletoEmissionResponse extends Record<string, unknown> {
    id?: string;
    authenticationCode?: string;
    barcode?: string;
    digitable?: string;
    status?: string;
}

export interface BoletoWebhookPayload extends Record<string, unknown> {
    id?: string;
    externalId?: string;
    status?: string;
    authenticationCode?: string;
    barcode?: string;
    digitable?: string;
}
