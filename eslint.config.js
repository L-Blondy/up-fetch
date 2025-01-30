/* eslint-disable @typescript-eslint/no-unused-vars */
/* global require module process */
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import preferLet from 'eslint-plugin-prefer-let'

export default tseslint.config(
   { ignores: ['dist', 'scripts', 'eslint.config.js'] },
   eslint.configs.recommended,
   ...tseslint.configs.recommendedTypeChecked,
   {
      languageOptions: {
         parserOptions: {
            project: 'tsconfig.json',
            tsconfigRootDir: '.',
         },
      },
      'plugins': { 'prefer-let': preferLet },
      rules: {
         'block-scoped-var': 'error',
         'default-param-last': 0,
         'getter-return': 'error',
         'grouped-accessor-pairs': 'warn',
         'max-params': ['error', 4],
         'new-cap': 'warn',
         'no-alert': 'error',
         'no-case-declarations': 'warn',
         'no-class-assign': 'error',
         'no-cond-assign': 0,
         'no-console': 'warn',
         'no-const-assign': 'error',
         'no-constructor-return': 'error',
         'no-dupe-args': 'error',
         'no-duplicate-imports': 'warn',
         'no-eq-null': 'warn',
         'no-eval': 'error',
         'no-extend-native': 'error',
         'no-extra-semi': 0,
         'no-implied-eval': 'error',
         'no-invalid-this': 'error',
         'no-mixed-operators': 0,
         'no-multi-assign': 'error',
         'no-multi-str': 'error',
         'no-template-curly-in-string': 'warn',
         'no-unused-vars': 'off',
         'no-var': 0,
         'prefer-template': 0,
         'prefer-const': 0,
         'prefer-let/prefer-let': 2,
         'no-ex-assign': 'error',
         'spaced-comment': [
            'warn',
            'always',
            {
               'markers': ['/'],
            },
         ],
         'eqeqeq': 'error',
         '@typescript-eslint/ban-types': 0,
         '@typescript-eslint/ban-ts-comment': 0,
         '@typescript-eslint/only-throw-error': 0,
         '@typescript-eslint/unbound-method': 0,
         '@typescript-eslint/no-empty-function': 0,
         '@typescript-eslint/no-explicit-any': 0,
         '@typescript-eslint/no-unnecessary-condition': 2,
         '@typescript-eslint/no-unsafe-assignment': 0,
         '@typescript-eslint/no-unsafe-return': 0,
         '@typescript-eslint/no-base-to-string': 0,
         '@typescript-eslint/no-redundant-type-constituents': 0,
         '@typescript-eslint/no-unused-vars': [
            'warn',
            {
               argsIgnorePattern: '^_',
               varsIgnorePattern: '^_',
               caughtErrorsIgnorePattern: '^_',
            },
         ],
         '@typescript-eslint/no-unused-expressions': [
            2,
            {
               allowShortCircuit: true,
               allowTernary: true,
               allowTaggedTemplates: true,
            },
         ],
      },
   },
)
