# Portal Assets (Source of Truth)

- Edite apenas os arquivos `docs-portal*.ts` em `src/swagger/portal/assets/js/`.
- Os arquivos `docs-portal*.js` são gerados em `dist/swagger/portal/assets/js`.
- Para regenerar os JS, execute:
  - `npm run build:portal-assets`

Este processo é executado automaticamente em:
- `npm run build`
- `npm run start`
- `npm run start:dev`
- `npm run start:debug`
