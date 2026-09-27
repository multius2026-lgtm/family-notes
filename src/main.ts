import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import { useTheme } from "./composables/useTheme";
import { useAuthStore } from "./stores/auth";
import "./style.css";

// Initialize saved color theme
useTheme().initTheme();

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Init Supabase auth session terlebih dahulu, lalu pasang router & mount app
const auth = useAuthStore();
auth.init().finally(() => {
  app.use(router);
  router.isReady().then(() => {
    app.mount("#app");
  });
});
