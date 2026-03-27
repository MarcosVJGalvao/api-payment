# Refatoração do Portal em Fases

## Fase 1 - Planejamento e contratos
- Definir contratos de tipos para rotas/assets do portal.
- Consolidar checklist de validação por fase.

## Fase 2 - Backend desacoplado para assets/rotas
- Reduzir duplicação no registro de rotas de assets.
- Centralizar mapeamento de rotas estáticas do portal.

## Fase 3 - Modularização do script do portal
- Extrair helpers utilitários (`slugify`, `escapeHtml`, `stripMd`) para arquivo separado.
- Manter o runtime idêntico, apenas desacoplando responsabilidades.

## Fase 4 - Responsividade
- Ajustar largura útil e breakpoints para mobile/tablet/desktop/2k+.
- Validar layout sem alterar identidade visual.

## Fase 5 - Validação final
- Executar `npm run build`.
- Fazer smoke check manual de `/docs`, `/docs/manual/:slug`, `/docs/api/portal`.
