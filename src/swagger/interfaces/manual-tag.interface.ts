/**
 * Interface para tags de documentação narrativa (manual)
 * Cada tag gera uma seção separada no portal de documentação
 */
export interface IManualTag {
  /** Nome exibido no sidebar */
  name: string;
  /** Conteúdo em Markdown da documentação narrativa */
  description: string;
  /**
   * Tag OpenAPI (controller) vinculada.
   * Quando definido, o conteúdo markdown aparece como cabeçalho
   * dentro do grupo de endpoints desse controller.
   * Ex: 'Boletos', 'PIX', 'TED'
   */
  apiTag?: string;
}

export interface ManualTagDefinition extends IManualTag {
  order?: number;
}
