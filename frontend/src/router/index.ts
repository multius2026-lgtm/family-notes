import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/login", name: "login", component: () => import("@/views/LoginView.vue"), meta: { guestOnly: true } },
    { path: "/register", name: "register", component: () => import("@/views/RegisterView.vue"), meta: { guestOnly: true } },
    { path: "/", name: "dashboard", component: () => import("@/views/DashboardView.vue"), meta: { requiresAuth: true } },
    { path: "/transaksi", name: "transactions", component: () => import("@/views/TransactionsView.vue"), meta: { requiresAuth: true } },
    { path: "/tambah", name: "add-transaction", component: () => import("@/views/AddTransactionView.vue"), meta: { requiresAuth: true } },
    { path: "/edit/:id", name: "edit-transaction", component: () => import("@/views/AddTransactionView.vue"), meta: { requiresAuth: true }, props: true },
    { path: "/laporan", name: "laporan", component: () => import("@/views/LaporanView.vue"), meta: { requiresAuth: true } },
    { path: "/pengaturan", name: "settings", component: () => import("@/views/SettingsView.vue"), meta: { requiresAuth: true } },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.isAuthenticated) return { name: "login" };
  if (to.meta.guestOnly && auth.isAuthenticated) return { name: "dashboard" };
  return true;
});

export default router;
