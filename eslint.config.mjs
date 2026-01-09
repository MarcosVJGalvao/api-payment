// eslint.config.mjs
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';

export default [
  // Ignora arquivos e pastas irrelevantes
  {
    ignores: [
      'eslint.config.mjs',
      'node_modules/**',
      'dist/**',
      'ecosystem.config.js',
      '.env',
    ],
  },

  // Regras base do ESLint
  eslint.configs.recommended,

  // Regras recomendadas com verificação de tipo do TypeScript
  ...tseslint.configs.recommendedTypeChecked,

  // Integração com Prettier via eslint-plugin-prettier
  eslintPluginPrettierRecommended,

  // Configuração principal
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'unused-imports': unusedImports,
    },
    rules: {
      // Regras TypeScript ajustadas
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',

      // Limpeza de imports e variáveis não usadas
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],

      // Prettier como regra de formatação
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  // Regras específicas para testes
  {
    files: ['**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];
