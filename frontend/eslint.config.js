import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

// Nomes de componentes proibidos do recharts (variantes de pizza/donut)
const FORBIDDEN_PIE_IMPORTS = [
  'PieChart',
  'Pie',
  'RadialBarChart',
  'RadialBar',
]

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // ─── Regra Aurora: sem gráficos de pizza/donut ───────────────────────
      // Proíbe importar PieChart, Pie, RadialBarChart e RadialBar do recharts.
      // Use BarChart horizontal ou LineChart no lugar.
      'no-restricted-imports': [
        'error',
        {
          paths: FORBIDDEN_PIE_IMPORTS.map(name => ({
            name: 'recharts',
            importNames: [name],
            message: `[Aurora] Gráficos de pizza/donut são proibidos. Use BarChart (horizontal) ou LineChart no lugar de "${name}".`,
          })),
        },
      ],
    },
  },
)
