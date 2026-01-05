// playwright.config.js
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests', // Onde ficam os testes
  fullyParallel: true, // Roda tudo ao mesmo tempo (mais rápido)
  retries: 1, // Se falhar, tenta de novo 1 vez (evita falsos negativos)
  
  // Gera relatório HTML que abre ao final
  reporter: 'html',

  use: {
    // URL do seu servidor de produção local
    baseURL: 'http://localhost:3000',

    // Coleta evidências apenas se der erro
    trace: 'on-first-retry',
    screenshot: 'only-on-failure', 
    video: 'retain-on-failure',
  },

  // Configura navegadores (Desktop Chrome e Mobile)
  projects: [
    {
      name: 'Chrome Desktop',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
});