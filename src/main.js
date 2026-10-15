import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { registrarCacheDeFotos } from "./shared/cacheFotos";
import "./styles/mural.css";

registrarCacheDeFotos();
createApp(App).use(router).mount("#app");
