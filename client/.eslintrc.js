module.exports = {
    env: {
      browser: true,
      es2021: true
    },
    extends: [
      'eslint:recommended',
      'plugin:react/recommended',
      'plugin:react-hooks/recommended'
    ],
    parserOptions: {
      ecmaFeatures: {
        jsx: true
      },
      ecmaVersion: 12,
      sourceType: 'module'
    },
    plugins: ['react', 'react-hooks'],
    rules: {
      // Разрешить console.log в development
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      
      // Менее строгие правила для unused variables
      'no-unused-vars': ['warn', { 
        'argsIgnorePattern': '^_',
        'varsIgnorePattern': '^_'
      }],
      
      // Отключить требование React import в новых версиях React
      'react/react-in-jsx-scope': 'off',
      
      // Менее строгие правила для dependencies в useEffect
      'react-hooks/exhaustive-deps': 'warn',
      
      // Разрешить anonymous default export
      'import/no-anonymous-default-export': 'off',
      
      // Отключить prop-types (используем TypeScript или альтернативы)
      'react/prop-types': 'off',
      
      // Разрешить unescaped entities
      'react/no-unescaped-entities': 'off'
    },
    settings: {
      react: {
        version: 'detect'
      }
    }
  }