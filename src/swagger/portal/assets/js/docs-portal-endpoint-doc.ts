(function initDocsPortalEndpointDocModule(globalScope) {
  interface OpenApiSchema {
    $ref?: string;
    type?: string;
    format?: string;
    enum?: unknown[];
    properties?: Record<string, OpenApiSchema>;
    items?: OpenApiSchema;
    allOf?: OpenApiSchema[];
    oneOf?: OpenApiSchema[];
    anyOf?: OpenApiSchema[];
    required?: string[];
    description?: string;
    example?: unknown;
    [key: string]: unknown;
  }

  interface OpenApiMediaType {
    schema?: OpenApiSchema;
    example?: unknown;
    examples?: Record<string, { value?: unknown }>;
  }

  interface OpenApiResponse {
    description?: string;
    content?: Record<string, OpenApiMediaType>;
  }

  interface OpenApiParameter {
    name: string;
    in: string;
    required?: boolean;
    description?: string;
    schema?: OpenApiSchema;
  }

  interface EndpointDoc {
    method: string;
    path: string;
    summary?: string;
    description?: string;
    parameters?: OpenApiParameter[];
    requestBody?: {
      content?: Record<string, OpenApiMediaType>;
    };
    responses?: Record<string, OpenApiResponse>;
    security?: Array<Record<string, unknown>>;
  }

  interface EnumDefinition {
    title: string;
    description?: string;
    values: unknown[];
  }

  interface SuccessExample {
    name: string;
    value: unknown;
  }

  interface OpenApiSpec {
    components?: {
      schemas?: Record<string, OpenApiSchema>;
    };
  }

  interface EndpointDocDeps {
    escapeHtml: (value: string) => string;
    marked: { parse: (markdown: string) => string };
    getOpenApiSpec: () => OpenApiSpec | null;
    getAuthLabelForEndpoint: (endpoint: EndpointDoc) => string;
    renderRequiredHeadersBox: (endpoint: EndpointDoc) => string;
  }

  function createEndpointDocModule(deps: EndpointDocDeps) {
    const {
      escapeHtml,
      marked,
      getOpenApiSpec,
      getAuthLabelForEndpoint,
      renderRequiredHeadersBox,
    } = deps;

    function resolveSchema(schema: OpenApiSchema | undefined | null): OpenApiSchema | null {
      if (!schema) return null;
      if (schema.$ref) {
        const refPath = schema.$ref.replace('#/components/schemas/', '');
        const spec = getOpenApiSpec();
        return (spec?.components?.schemas?.[refPath] || null) as OpenApiSchema | null;
      }
      return schema;
    }

    function getResponseJsonContent(resp: OpenApiResponse | undefined): OpenApiMediaType | null {
      if (!resp || !resp.content) return null;
      return resp.content['application/json'] || null;
    }

    function getExampleValuesFromContent(jsonContent: OpenApiMediaType | null): unknown[] {
      if (!jsonContent) return [];
      if (jsonContent.examples && typeof jsonContent.examples === 'object') {
        return Object.values(jsonContent.examples)
          .map((example) => (example && typeof example === 'object' ? example.value : null))
          .filter((value) => value != null);
      }
      if (jsonContent.example != null) return [jsonContent.example];
      return [];
    }

    function generateExampleFromSchema(
      schema: OpenApiSchema | undefined | null,
      depth = 0,
    ): unknown | undefined {
      if (!schema || depth > 4) return undefined;

      const resolved = resolveSchema(schema) || schema;
      if (!resolved || typeof resolved !== 'object') return undefined;

      if (resolved.example != null) return resolved.example;

      if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
        return resolved.enum[0];
      }

      if (resolved.oneOf && Array.isArray(resolved.oneOf) && resolved.oneOf.length > 0) {
        return generateExampleFromSchema(resolved.oneOf[0], depth + 1);
      }
      if (resolved.anyOf && Array.isArray(resolved.anyOf) && resolved.anyOf.length > 0) {
        return generateExampleFromSchema(resolved.anyOf[0], depth + 1);
      }
      if (resolved.allOf && Array.isArray(resolved.allOf) && resolved.allOf.length > 0) {
        const merged: Record<string, unknown> = {};
        resolved.allOf.forEach((part) => {
          const value = generateExampleFromSchema(part, depth + 1);
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            Object.assign(merged, value as Record<string, unknown>);
          }
        });
        if (Object.keys(merged).length > 0) return merged;
      }

      if (resolved.type === 'array' || resolved.items) {
        const itemExample = generateExampleFromSchema(resolved.items, depth + 1);
        return itemExample === undefined ? [] : [itemExample];
      }

      if (resolved.type === 'object' || resolved.properties) {
        const obj: Record<string, unknown> = {};
        const props = resolved.properties || {};
        Object.entries(props).forEach(([key, propSchema]) => {
          const value = generateExampleFromSchema(propSchema, depth + 1);
          obj[key] = value === undefined ? null : value;
        });
        return obj;
      }

      switch (resolved.type) {
        case 'string':
          if (resolved.format === 'date-time') return '2026-01-01T00:00:00.000Z';
          if (resolved.format === 'date') return '2026-01-01';
          if (resolved.format === 'uuid') return '00000000-0000-0000-0000-000000000000';
          if (resolved.format === 'email') return 'user@example.com';
          if (resolved.format === 'uri') return 'https://example.com';
          return 'string';
        case 'integer':
        case 'number':
          return 0;
        case 'boolean':
          return true;
        default:
          return undefined;
      }
    }

    function getSuccessExamples(jsonResp: OpenApiMediaType | null): SuccessExample[] {
      if (!jsonResp) return [];

      if (jsonResp.examples && typeof jsonResp.examples === 'object') {
        return Object.entries(jsonResp.examples)
          .map(([name, ex]) => ({
            name,
            value: ex && typeof ex === 'object' ? ex.value : null,
          }))
          .filter((item): item is SuccessExample => item.value != null);
      }

      if (jsonResp.example != null) {
        return [{ name: 'success', value: jsonResp.example }];
      }

      const schema = resolveSchema(jsonResp.schema);
      if (schema && schema.example != null) {
        return [{ name: 'success', value: schema.example }];
      }

      if (schema) {
        const generated = generateExampleFromSchema(schema);
        if (generated !== undefined) {
          return [{ name: 'success', value: generated }];
        }
      }

      return [];
    }

    function extractErrorSummary(resp: OpenApiResponse | undefined): {
      errorCode: string;
      message: string;
      description: string;
    } {
      const jsonContent = getResponseJsonContent(resp);
      const examples = getExampleValuesFromContent(jsonContent);

      let errorCode = '—';
      let message = '—';
      const description = resp && resp.description ? String(resp.description) : '—';

      for (const example of examples) {
        if (!example || typeof example !== 'object') continue;
        const parsed = example as Record<string, unknown>;
        if ('errorCode' in parsed && parsed.errorCode != null && errorCode === '—') {
          errorCode = String(parsed.errorCode);
        }
        if ('message' in parsed && parsed.message != null) {
          message = String(parsed.message);
          break;
        }
      }

      return { errorCode, message, description };
    }

    function getSchemaDisplayType(schema: OpenApiSchema | undefined | null): string {
      if (!schema) return '—';
      const parsed = resolveSchema(schema) || schema;
      let type = parsed.type || '—';
      if (parsed.type === 'array' && parsed.items) {
        const item = resolveSchema(parsed.items) || parsed.items;
        const itemType = item.type || (item.properties ? 'object' : '—');
        type = 'array<' + itemType + '>';
      }
      if (parsed.format) type += ' (' + parsed.format + ')';
      if (Array.isArray(parsed.enum) && parsed.enum.length > 0) type = 'enum';
      return type;
    }

    function dedupeEnumDefinitions(defs: EnumDefinition[]): EnumDefinition[] {
      const seen = new Set<string>();
      return (defs || []).filter((def) => {
        const key = def.title + '|' + JSON.stringify(def.values || []);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    function collectEnumDefinitionsFromSchema(
      schema: OpenApiSchema | undefined | null,
      prefix = '',
      visited = new Set<string>(),
    ): EnumDefinition[] {
      const resolved = resolveSchema(schema) || schema;
      if (!resolved || typeof resolved !== 'object') return [];

      const results: EnumDefinition[] = [];
      const visitKey = prefix + '|' + (resolved.$ref || '');
      if (visited.has(visitKey)) return results;
      visited.add(visitKey);

      if (Array.isArray(resolved.enum) && resolved.enum.length > 0) {
        results.push({
          title: prefix || 'body',
          description: typeof resolved.description === 'string' ? resolved.description : '',
          values: resolved.enum,
        });
      }

      const props =
        resolved.properties && typeof resolved.properties === 'object'
          ? resolved.properties
          : null;
      if (props) {
        Object.entries(props).forEach(([name, propSchema]) => {
          const fieldPath = prefix ? prefix + '.' + name : name;
          results.push(...collectEnumDefinitionsFromSchema(propSchema, fieldPath, visited));
        });
      }

      if (resolved.items) {
        const itemPath = prefix ? prefix + '[]' : 'items[]';
        results.push(...collectEnumDefinitionsFromSchema(resolved.items, itemPath, visited));
      }

      ['allOf', 'oneOf', 'anyOf'].forEach((key) => {
        const list = resolved[key] as OpenApiSchema[] | undefined;
        if (!Array.isArray(list)) return;
        list.forEach((part) => {
          results.push(...collectEnumDefinitionsFromSchema(part, prefix, visited));
        });
      });

      return dedupeEnumDefinitions(results);
    }

    function collectEnumDefinitionsFromParameters(params: OpenApiParameter[]): EnumDefinition[] {
      const defs: EnumDefinition[] = [];
      (params || []).forEach((param) => {
        const schema = param && param.schema ? resolveSchema(param.schema) || param.schema : null;
        if (!schema || !Array.isArray(schema.enum) || schema.enum.length === 0) return;
        defs.push({
          title: param.name + ' (' + (param.in || 'param') + ')',
          description: param.description || '',
          values: schema.enum,
        });
      });
      return defs;
    }

    function renderEnumDefinitionsSection(enumDefs: EnumDefinition[], title: string): string {
      if (!Array.isArray(enumDefs) || enumDefs.length === 0) return '';

      let html = '<section class="enum-definitions-section"><h3>' + escapeHtml(title) + '</h3>';
      enumDefs.forEach((def) => {
        html += '<h4>' + escapeHtml(def.title) + '</h4>';
        if (def.description) {
          html += '<p>' + escapeHtml(def.description) + '</p>';
        }
        html += '<table><thead><tr><th>Valor</th></tr></thead><tbody>';
        (def.values || []).forEach((value) => {
          html += '<tr><td><code>' + escapeHtml(String(value)) + '</code></td></tr>';
        });
        html += '</tbody></table>';
      });
      html += '</section>';
      return html;
    }

    function renderSchemaRows(
      schema: OpenApiSchema | undefined | null,
      prefix = '',
      depth = 0,
      visited = new Set<string>(),
    ): string {
      const resolvedSchema = resolveSchema(schema) || schema;
      if (!resolvedSchema || !resolvedSchema.properties || depth > 4) return '';

      const visitKey = prefix + '|' + depth;
      if (visited.has(visitKey)) return '';
      visited.add(visitKey);

      let html = '';
      const required = Array.isArray(resolvedSchema.required) ? resolvedSchema.required : [];

      for (const [name, prop] of Object.entries(resolvedSchema.properties)) {
        const parsed = resolveSchema(prop) || prop;
        const fullName = prefix ? prefix + '.' + name : name;
        const type = getSchemaDisplayType(parsed);
        const desc = parsed.description || (parsed.example !== undefined ? 'Ex: ' + parsed.example : '—');

        html += '<tr>';
        html += '<td><code>' + escapeHtml(fullName) + '</code></td>';
        if (parsed.enum) {
          html +=
            '<td><span class="enum-value-list">' +
            escapeHtml(type).replaceAll(', ', ',<wbr> ') +
            '</span></td>';
        } else {
          html += '<td>' + escapeHtml(type) + '</td>';
        }
        const finalDesc = required.includes(name)
          ? '<strong>Obrigatório.</strong> ' + escapeHtml(String(desc))
          : escapeHtml(String(desc));
        html += '<td>' + finalDesc + '</td>';
        html += '</tr>';

        if (parsed.type === 'object' || parsed.properties) {
          html += renderSchemaRows(parsed, fullName, depth + 1, visited);
          continue;
        }

        if (parsed.type === 'array' && parsed.items) {
          const itemSchema = resolveSchema(parsed.items) || parsed.items;
          if (itemSchema && (itemSchema.type === 'object' || itemSchema.properties)) {
            html += renderSchemaRows(itemSchema, fullName + '[]', depth + 1, visited);
          }
        }
      }

      return html;
    }

    function renderSchemaTable(schema: OpenApiSchema): string {
      let html = '<table><thead><tr><th>Campo</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>';
      html += renderSchemaRows(schema, '', 0, new Set());
      html += '</tbody></table>';
      return html;
    }

    function resolveResponseSchemaForTable(schema: OpenApiSchema | null): OpenApiSchema | null {
      if (!schema) return null;
      const parsed = resolveSchema(schema) || schema;
      if (!parsed || typeof parsed !== 'object') return null;

      if (parsed.properties && typeof parsed.properties === 'object') {
        return parsed;
      }

      if (parsed.type === 'array' && parsed.items) {
        const itemSchema = resolveSchema(parsed.items) || parsed.items;
        if (itemSchema && itemSchema.properties && typeof itemSchema.properties === 'object') {
          return itemSchema;
        }
      }

      return null;
    }

    function renderSuccessExamplesBlock(successExamples: SuccessExample[]): string {
      if (!Array.isArray(successExamples) || successExamples.length === 0) {
        return '';
      }

      let html = '';
      html += '<h3>Exemplo do retorno</h3>';
      html +=
        '<p>O payload abaixo exemplifica a estrutura do response que deverá ser recebido. Clique na seta para expandi-lo.</p>';
      successExamples.forEach((example, index) => {
        const suffix =
          successExamples.length > 1
            ? ' (' + escapeHtml(example.name || 'exemplo ' + (index + 1)) + ')'
            : '';
        html += '<details><summary>Exemplo de payload' + suffix + '</summary>';
        html += '<pre><code>' + escapeHtml(JSON.stringify(example.value, null, 2)) + '</code></pre>';
        html += '</details>';
      });
      return html;
    }

    function buildEndpointDoc(ep: EndpointDoc, tag: string): string {
      let md = '';

      md += '<h1>' + escapeHtml(ep.summary || tag) + '</h1>';

      if (ep.description) {
        md += marked.parse(ep.description);
      }

      md += '<div class="endpoint-header">';
      md += '<span class="endpoint-method-badge method-' + ep.method + '">' + ep.method + '</span>';
      md += '<span class="endpoint-path">' + escapeHtml(ep.path) + '</span>';
      md += '</div>';

      md +=
        '<div class="auth-chip">🔐 Autenticação: ' +
        escapeHtml(getAuthLabelForEndpoint(ep)) +
        '</div>';

      md += renderRequiredHeadersBox(ep);

      const routeParams = (ep.parameters || []).filter(
        (param) => param && (param.in === 'query' || param.in === 'path'),
      );
      const routeParamEnums = collectEnumDefinitionsFromParameters(routeParams);
      md += '<h2>Parâmetros</h2>';
      if (routeParams.length > 0) {
        md +=
          '<table><thead><tr><th>Nome</th><th>Local</th><th>Tipo</th><th>Descrição</th></tr></thead><tbody>';
        routeParams.forEach((param) => {
          const type = param.schema
            ? Array.isArray(param.schema.enum) && param.schema.enum.length > 0
              ? 'enum'
              : param.schema.type || '—'
            : '—';
          md += '<tr>';
          md += '<td><code>' + escapeHtml(param.name) + '</code></td>';
          md += '<td>' + escapeHtml(param.in) + '</td>';
          md += '<td>' + escapeHtml(type) + '</td>';
          const paramDescription = param.required
            ? '<strong>Obrigatório.</strong> ' + escapeHtml(param.description || '—')
            : escapeHtml(param.description || '—');
          md += '<td>' + paramDescription + '</td>';
          md += '</tr>';
        });
        md += '</tbody></table>';
      } else {
        md += '<p>Não é necessário enviar parâmetros nesta requisição.</p>';
      }
      md += renderEnumDefinitionsSection(routeParamEnums, 'Enums dos Parâmetros');

      md += '<h2>Corpo da Requisição</h2>';
      if (ep.requestBody) {
        const content = ep.requestBody.content;
        if (content && content['application/json']) {
          const jsonContent = content['application/json'];
          const schema = resolveSchema(jsonContent.schema);
          if (schema && schema.properties) {
            md += renderSchemaTable(schema);
          }
          md += renderEnumDefinitionsSection(
            collectEnumDefinitionsFromSchema(schema),
            'Enums do Corpo da Requisição',
          );
          if (jsonContent.examples) {
            md += '<h3>Exemplos</h3>';
            for (const [name, example] of Object.entries(jsonContent.examples)) {
              md += '<h4>' + escapeHtml(name) + '</h4>';
              md += '<pre><code>' + escapeHtml(JSON.stringify(example.value, null, 2)) + '</code></pre>';
            }
          }
        } else {
          md += '<p>Esta requisição não possui corpo em <code>application/json</code>.</p>';
        }
      } else {
        md += '<p>Não é necessário enviar body nesta requisição.</p>';
      }

      if (ep.responses) {
        const responseEntries = Object.entries(ep.responses);
        const successResponses = responseEntries.filter(([status]) => String(status).startsWith('2'));
        const errorResponses = responseEntries.filter(([status]) => !String(status).startsWith('2'));

        if (successResponses.length > 0) {
          const [status, resp] = successResponses[0] as [string, OpenApiResponse];
          const jsonResp = getResponseJsonContent(resp);
          const schema = jsonResp ? resolveSchema(jsonResp.schema) : null;
          const tableSchema = resolveResponseSchemaForTable(schema);

          md += '<h2>Resposta</h2>';
          md +=
            '<p>Quando a requisição retornar sucesso, a API irá retornar <strong>statusCode ' +
            escapeHtml(String(status)) +
            '</strong>';
          if (resp && resp.description) {
            md += ' (' + escapeHtml(String(resp.description)) + ')';
          }
          md += tableSchema ? ' e um objeto no formato abaixo:</p>' : '.</p>';

          if (tableSchema) {
            md += renderSchemaTable(tableSchema);
          }

          const successExamples = getSuccessExamples(jsonResp);
          if (successExamples.length > 0) {
            md += renderSuccessExamplesBlock(successExamples);
          }
        } else {
          md += '<h2>Resposta</h2>';
          md += '<p>Não há resposta de sucesso documentada para este endpoint.</p>';
        }

        if (errorResponses.length > 0) {
          md += '<h2>Erros</h2>';
          md += '<p>Este endpoint pode retornar erros específicos, conforme a tabela a seguir:</p>';
          if (errorResponses.some(([status]) => String(status) === '400')) {
            md +=
              '<p>Recordamos que esta API também poderá retornar erros comuns entre todos os endpoints que acompanham os erros <strong>400</strong> (se houver). Consulte a seção <a href="/docs#manual=tratamento-de-erros">Padrões de Erros</a>.</p>';
          }
          md +=
            '<table><thead><tr><th>Status Code</th><th>Error Code</th><th>Message</th><th>Descrição</th></tr></thead><tbody>';

          errorResponses.forEach(([status, resp]) => {
            const errorSummary = extractErrorSummary(resp as OpenApiResponse);
            md += '<tr>';
            md += '<td>' + escapeHtml(String(status)) + '</td>';
            md += '<td><code>' + escapeHtml(errorSummary.errorCode) + '</code></td>';
            md += '<td>' + escapeHtml(errorSummary.message) + '</td>';
            md += '<td>' + escapeHtml(errorSummary.description) + '</td>';
            md += '</tr>';
          });

          md += '</tbody></table>';
        } else {
          md += '<h2>Erros</h2>';
          md += '<p>Não há erros específicos documentados para este endpoint.</p>';
        }
      } else {
        md += '<h2>Resposta</h2>';
        md += '<p>Não há resposta de sucesso documentada para este endpoint.</p>';
        md += '<h2>Erros</h2>';
        md += '<p>Não há erros documentados para este endpoint.</p>';
      }

      return md;
    }

    return {
      buildEndpointDoc,
    };
  }

  globalScope.DocsPortalEndpointDoc = {
    createEndpointDocModule,
  };
})(window);
