export interface OCILoggingConfig {
    logGroupOcid: string;
    logId?: string;
    region: string;
    compartmentOcid?: string;
    configFile?: string;
    profile?: string;
}

export interface ModuleLogMapping {
    [moduleName: string]: string;
}
