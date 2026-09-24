import { createRouter, createWebHashHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: "/login", name: "login", component: () => import("@/views/LoginView.vue"), meta: { guestOnly: true } },
    { path: "/register", name: "register", component: () => import("@/views/RegisterView.vue"), meta: { guestOnly: true } },
    { path: "/reset-password", name: "reset-password", component: () => import("@/views/ResetPasswordView.vue") },
    { path: "/", name: "dashboard", component: () => import("@/views/DashboardView.vue"), meta: { requiresAuth: true } },
    { path: "/transaksi", name: "transactions", component: () => import("@/views/TransactionsView.vue"), meta: { requiresAuth: true } },
    { path: "/tambah", name: "add-transaction", component: () => import("@/views/AddTransactionView.vue"), meta: { requiresAuth: true } },
    { path: "/edit/:id", name: "edit-transaction", component: () => import("@/views/AddTransactionView.vue"), meta: { requiresAuth: true }, props: true },
    { path: "/laporan", name: "laporan", component: () => import("@/views/LaporanView.vue"), meta: { requiresAuth: true } },
    { path: "/pengaturan", name: "settings", component: () => import("@/views/SettingsView.vue"), meta: { requiresAuth: true } },
  ],
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.isInitialized) {
    await auth.init();
  }

  // Jika halaman butuh login tapi user belum login
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  // Jika halaman khusus tamu (login/register) tapi user sudah login
  if (to.meta.guestOnly && auth.isAuthenticated) {
    const redirect = (to.query.redirect as string) || null;
    if (redirect && redirect !== "/" && !redirect.startsWith("/login")) {
      return redirect;
    }
    return { name: "dashboard" };
  }

  return true;
});

export default router;
