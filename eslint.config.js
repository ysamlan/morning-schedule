import prettier from 'eslint-config-prettier';
import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import { fileURLToPath } from 'node:url';
import ts from 'typescript-eslint';
import svelteParser from "svelte-eslint-parser";
const gitignorePath = fileURLToPath(new URL('./.gitignore', import.meta.url));

export default ts.config(
	includeIgnoreFile(gitignorePath),
	js.configs.recommended,
	...ts.configs.recommended,
	...svelte.configs['flat/recommended'],
	prettier,
	...svelte.configs['flat/prettier'],
	{
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node
			}
		}
	},
	{
		files: [
			"**/*.svelte",
      "*.svelte",
      // Need to specify the file extension for Svelte 5 with rune symbols
      "**/*.svelte.js",
      "*.svelte.js",
      "**/*.svelte.ts",
      "*.svelte.ts",
		],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tsParser,
      }
		}
	}
);
