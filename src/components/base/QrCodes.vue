<template>
  <!-- Sem link: no kiosk, abrir uma aba esconderia o mural. -->
  <div v-for="(item, indice) in itens" :key="indice" class="qr-item">
    <span class="qr-link">
      <span class="qr-box">
        <img v-if="imagens[item.url]" class="qr-generated" :src="imagens[item.url]" alt="" aria-hidden="true">
        <span v-else class="qr-fallback">QR</span>
      </span>
    </span>
    <span>{{ item.legenda || "conteúdo" }}</span>
  </div>
</template>

<script setup>
import { reactive, watchEffect } from "vue";
import QRCode from "qrcode";

const cache = new Map();

const props = defineProps({
  itens: { type: Array, default: () => [] },
});

const imagens = reactive({});

watchEffect(() => {
  props.itens.forEach(({ url }) => {
    if (!url || imagens[url]) return;
    if (!cache.has(url)) {
      cache.set(url, QRCode.toDataURL(url, {
        width: 160,
        margin: 0,
        errorCorrectionLevel: "M",
        color: { dark: "#071b2c", light: "#ffffff" },
      }));
    }
    cache.get(url)
      .then((dados) => { imagens[url] = dados; })
      .catch((erro) => console.warn(`[MURAL QR] Não foi possível gerar o QR code (${erro.message}).`));
  });
});
</script>
