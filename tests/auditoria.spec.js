const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const endpointsGet = [
  '/api/filiais',
  '/api/fornecedores',
  '/api/lancamentos',
  '/api/solicitacoes',
  '/api/usuarios',
  '/api/dados-agrupados?mes=7&ano=2026',
];

const endpointsPatch = [
  {
    url: '/api/lancamentos/0/campo',
    body: { field: 'campo_inexistente', value: '18' },
    expectedStatus: 400,
  },
  {
    url: '/api/lancamentos/0/status',
    body: { etapa: 'etapa_invalida' },
    expectedStatus: 400,
  },
];

test.describe('Auditoria IT FinControl', () => {
  for (const url of endpointsGet) {
    test(`GET ${url} responde sem erro critico`, async ({ request }) => {
      const response = await request.get(url);

      expect(response.status(), `Rota inexistente: ${url}`).not.toBe(404);
      expect(response.status(), `Erro interno em ${url}`).not.toBe(500);
      expect(response.status(), `Servico indisponivel em ${url}`).not.toBe(503);
    });
  }

  for (const endpoint of endpointsPatch) {
    test(`PATCH ${endpoint.url} responde sem erro critico`, async ({ request }) => {
      const response = await request.patch(endpoint.url, { data: endpoint.body });

      expect(response.status(), `Rota inexistente: ${endpoint.url}`).not.toBe(404);
      expect(response.status(), `Servico indisponivel em ${endpoint.url}`).not.toBe(503);
      expect(response.status()).toBe(endpoint.expectedStatus);
    });
  }

  test('pagina inicial carrega sem erro visivel de runtime', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');
    await expect(page.locator('body')).not.toContainText('Internal Server Error');
  });

  test('auditoria WCAG basica da pagina inicial', async ({ page }, testInfo) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      await testInfo.attach('violacoes-acessibilidade', {
        body: JSON.stringify(accessibilityScanResults.violations, null, 2),
        contentType: 'application/json',
      });
    }

    expect(accessibilityScanResults.violations.length).toBeLessThan(50);
  });
});
