// tests/auditoria.spec.js
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

// 1. LISTA MESTRA DE ROTAS (Baseado na estrutura do seu projeto)
// Isso é o padrão "Data-Driven". Se criar uma API nova, só adicione ela aqui.
const endpointsParaTestar = [
  '/api/filiais',
  '/api/fornecedores',
  '/api/lancamentos',
  '/api/solicitacoes',
  '/api/usuarios',
  '/api/dados-agrupados',
  '/api/teste-db'
];

test.describe('Suíte de Testes Enterprise - IT FinControl', () => {

  // --- BLOCO 1: TESTES DE INFRAESTRUTURA (API) ---
  // Esse loop cria um teste individual para cada rota automaticamente
  for (const url of endpointsParaTestar) {
    test(`API Check: ${url} deve estar respondendo`, async ({ request }) => {
      const response = await request.get(url);
      
      // Log para debug no relatório
      console.log(`Testando ${url} -> Status: ${response.status()}`);

      // CRITÉRIO DE ACEITE:
      // O sistema pode retornar 200 (OK) ou 401 (Não autorizado/Sem Token)
      // Mas NUNCA deve retornar 500 (Erro Interno do Servidor) ou 503 (Serviço Indisponível)
      expect(response.status(), `Falha crítica na rota ${url}`).not.toBe(500);
      expect(response.status()).not.toBe(503);
      expect(response.status()).not.toBe(404); // A rota tem que existir
    });
  }

  // --- BLOCO 2: TESTE VISUAL E USABILIDADE ---
  test('Smoke Test: Página inicial deve carregar elementos críticos', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se não há tela branca da morte ou erros de build expostos
    await expect(page.locator('body')).not.toContainText('Application error');
    await expect(page.locator('body')).not.toContainText('Unhandled Runtime Error');

    // Tira um print para provar que carregou
    await page.screenshot({ path: 'evidencias/home-full.png', fullPage: true });
  });

  // --- BLOCO 3: AUDITORIA DE ACESSIBILIDADE DETALHADA ---
  test('Auditoria WCAG: Relatório de Acessibilidade', async ({ page }, testInfo) => {
    await page.goto('/');

    // Analisa a página
    const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']) // Padrões internacionais
        .analyze();

    // ANEXAR O RELATÓRIO:
    // Se houver erros, anexamos o detalhe no relatório HTML para você ler depois
    if (accessibilityScanResults.violations.length > 0) {
      await testInfo.attach('violation-details', {
        body: JSON.stringify(accessibilityScanResults.violations, null, 2),
        contentType: 'application/json'
      });
      
      // Conta quantos erros achou
      console.log(`Encontrados ${accessibilityScanResults.violations.length} problemas de acessibilidade.`);
    }

    // AQUI VOCÊ ESCOLHE: 
    // Opção A (Rígida): O teste FALHA se tiver erro. (Descomente a linha abaixo)
    // expect(accessibilityScanResults.violations).toEqual([]);
    
    // Opção B (Observação): O teste PASSA, mas avisa os erros no relatório. (Ideal para projetos legados)
    expect(accessibilityScanResults.violations.length).toBeLessThan(50); // Só falha se tiver MUITO erro
  });

});