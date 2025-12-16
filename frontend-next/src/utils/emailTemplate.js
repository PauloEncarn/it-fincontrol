export function gerarEmailHtml(dados) {
  // Formatando o valor para BRL
  const valorFormatado = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(dados.valor);

  // Formatando a data
  const dataFormatada = new Date(dados.data_vencimento).toLocaleDateString('pt-BR');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        /* Estilos básicos para garantir que fique bonito */
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f9; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
        .header { background-color: #2c3e50; padding: 20px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
        .content { padding: 30px; color: #333333; line-height: 1.6; }
        .card-info { background-color: #eef2f5; padding: 15px; border-left: 5px solid #3498db; margin: 20px 0; border-radius: 4px; }
        .highlight { color: #2c3e50; font-weight: bold; }
        .valor { color: #c0392b; font-weight: bold; font-size: 18px; }
        .footer { background-color: #f4f4f9; padding: 15px; text-align: center; font-size: 12px; color: #7f8c8d; border-top: 1px solid #eeeeee; }
        .btn { display: inline-block; padding: 10px 20px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px; }
        .btn:hover { background-color: #2980b9; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>IT FinControl 🤖</h1>
        </div>

        <div class="content">
          <p>Olá, <strong>Prezados</strong>.</p>
          <p>Segue boleto e nota para lançamento:</p>
          
          <div class="card-info">
            <p style="margin: 5px 0;">🏢 <strong>Fornecedor:</strong> ${dados.fornecedor}</p>
            <p style="margin: 5px 0;">📑 <strong>Nota Fiscal:</strong> ${dados.numero_nota}</p>
            <p style="margin: 5px 0;">📅 <strong>Vencimento:</strong> ${dataFormatada}</p>
            <p style="margin: 5px 0;">💰 <strong>Valor:</strong> <span class="valor">${valorFormatado}</span></p>
          </div>

          <p>Acesse o painel para visualizar o boleto e aprovar o pagamento.</p>
          
          <center>
            <a href="https://it-fincontrol.vercel.app" class="btn">Acessar Sistema</a>
          </center>
        </div>

        <div class="footer">
          <p>Este é um e-mail automático do robô IT FinControl.<br>Não responda a este e-mail.</p>
          <p>🚀 Automação e Controle</p>
        </div>
      </div>
    </body>
    </html>
  `;
}