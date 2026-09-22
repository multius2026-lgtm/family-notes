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
app.use(router);

// Init Supabase auth session sebelum mount
const auth = useAuthStore();
auth.init().then(() => {
  app.mount("#app");
});
