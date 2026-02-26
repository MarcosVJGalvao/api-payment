/**
 * Interface para tags de documentação narrativa (manual)
 * Cada tag gera uma seção separada no grupo "📘 Manual" do Scalar
 */
export interface IManualTag {
  /** Nome exibido no sidebar do Scalar */
  name: string;
  /** Conteúdo em Markdown da documentação narrativa */
  description: string;
}
