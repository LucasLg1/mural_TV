import { createRouter, createWebHashHistory } from "vue-router";
import TvView from "./tv/TvView.vue";

// A TV não carrega nada do painel (nem SSO): só /painel exige login no Thalamus.
const routes = [
  { path: "/", name: "tv", component: TvView },
  {
    path: "/painel",
    name: "painel",
    component: () => import("./painel/PainelView.vue"),
    beforeEnter: async () => {
      const { exigirSessao } = await import("./painel/sessao");
      return exigirSessao();
    },
  },
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

export default createRouter({
  history: createWebHashHistory(),
  routes,
});
