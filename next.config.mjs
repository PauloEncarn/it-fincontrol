/** @type {import('next').NextConfig} */
const nextConfig = {
    // Aumenta o limite de tamanho do corpo da requisição
    experimental: {
        serverActions: {
            bodySizeLimit: '10mb', // Pode aumentar para '20mb' se precisar
        },
    },
    // Adicione cabeçalhos para evitar problemas de CORS com arquivos grandes
    async headers() {
        return [
            {
                source: "/api/:path*",
                headers: [
                    { key: "Access-Control-Allow-Origin", value: "*" },
                    { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
                ],
            },
        ];
    },
};

export default nextConfig;