<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import BottomNav from "@/components/ui/BottomNav.vue";
import SideNav from "@/components/ui/SideNav.vue";

const route = useRoute();
const showNav = computed(
  () =>
    !!route.meta.requiresAuth &&
    route.name !== "add-transaction" &&
    route.name !== "edit-transaction"
);
</script>

<template>
  <div class="app-shell">
    <!-- Sidebar: tablet & desktop only (hidden on mobile via SideNav scoped CSS) -->
    <SideNav v-if="showNav" />

    <!-- Main content area -->
    <main class="app-main" :class="{ 'has-nav': showNav }">
      <router-view />
    </main>

    <!-- Bottom dock: mobile only (hidden on md+ via CSS) -->
    <BottomNav v-if="showNav" />
  </div>
</template>
