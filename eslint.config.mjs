import { defineConfig } from 'eslint/config';
import { fixupPluginRules } from '@eslint/compat';
import globals from 'globals';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';

const files = ['**/*.{ts,tsx}'];

export default defineConfig(
    ...[eslint.configs.recommended, ...tseslint.configs.recommended].map(c => ({ ...c, files })),
    {
        files,
        plugins: { import: fixupPluginRules(importPlugin) },
        languageOptions: {
            parserOptions: { ecmaFeatures: { jsx: true } },
            globals: { ...globals.browser },
        },
        rules: {
            'import/order': 'error',
            indent: ['error', 4, { ignoredNodes: ['TemplateLiteral > *'], SwitchCase: 1 }],
            'linebreak-style': ['error', 'windows'],
            quotes: ['error', 'single'],
            semi: ['error', 'always'],
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-case-declarations': 'off',
            'no-shadow': 'error',
            '@typescript-eslint/no-explicit-any': 'off',
            'comma-dangle': ['error', 'always-multiline'],
        },
    },
);