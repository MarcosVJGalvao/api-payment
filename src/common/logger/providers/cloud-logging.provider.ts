/**
 * Interface para provedores de cloud logging.
 */
export interface CloudLoggingProvider {
    /**
     * Envia um log para o serviço de cloud logging
     * @param moduleName Nome do módulo que gerou o log
     * @param logEntry Dados do log
     */
    sendLog(moduleName: string, logEntry: CloudLogEntry): Promise<void>;

    /** Verifica se o provider está habilitado */
    isEnabled(): boolean;

    /** Retorna o nome do provider */
    getProviderName(): string;

    /** Limpa cache interno */
    clearCache(): void;
}

/** Estrutura de entrada de log para cloud providers */
export interface CloudLogEntry {
    timestamp: string;
    level: string;
    message: string;
    module?: string;
    context?: string;
    stack?: string;
    data?: Record<string, any>;
    [key: string]: any;
}

/** Configuração base para cloud logging providers */
export interface CloudLoggingConfig {
    region: string;
    configFile?: string;
    profile?: string;
}
