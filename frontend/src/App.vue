<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import BottomNav from "@/components/ui/BottomNav.vue";

const route = useRoute();
const showNav = computed(() => !!route.meta.requiresAuth && route.name !== "add-transaction" && route.name !== "edit-transaction");
</script>

<template>
  <div :style="{ paddingBottom: showNav ? '96px' : '0' }">
    <router-view />
  </div>
  <BottomNav v-if="showNav" />
</template>
