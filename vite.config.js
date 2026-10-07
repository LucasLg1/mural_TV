import { fileURLToPath, URL } from "node:url";
import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";

// As bibliotecas do Thalamus (SSO e request-handler) leem process.env.VUE_APP_*,
// então os .env usam os mesmos nomes dos outros frontends do Thalamus.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), "VUE_APP_"), NODE_ENV: mode };
  // Cada chave precisa ser substituída: process.env.VUE_APP_ROOT_API vira a URL do .env.
  const define = Object.fromEntries(
    Object.entries(env).map(([chave, valor]) => [`process.env.${chave}`, JSON.stringify(valor)])
  );

  return {
    base: "./",
    plugins: [vue()],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
    },
    define,
    build: {
      // public/assets guarda as fotos e vídeos do config.js; o build vai para /app.
      assetsDir: "app",
    },
    server: {
      port: 5174,
      // O cookie de login só existe em *.thalamus.ind.br (hosts: localhost.thalamus.ind.br).
      // host true + allowedHosts true: outro PC abre pelo IP desta máquina.
      host: true,
      allowedHosts: true,
      // /api e /storage saem por esta mesma porta, então o outro PC não precisa
      // alcançar o 127.0.0.1:8000, que só existe neste computador.
      proxy: {
        "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
        "/storage": { target: "http://127.0.0.1:8000", changeOrigin: true },
      },
    },
  };
});
