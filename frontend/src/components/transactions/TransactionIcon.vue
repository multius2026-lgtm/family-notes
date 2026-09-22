<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    type?: "income" | "expense";
    categoryName?: string;
    sourceName?: string;
    size?: number;
  }>(),
  {
    type: "expense",
    categoryName: "",
    sourceName: "",
    size: 20,
  }
);

const CATEGORY_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  "Makanan":           { bg: "#fff3e0", color: "#f8a730", icon: "food" },
  "Makanan & Minuman": { bg: "#fff3e0", color: "#f8a730", icon: "food" },
  "Transportasi":      { bg: "#e3f2fd", color: "#2196f3", icon: "car" },
  "Belanja":           { bg: "#fce4ec", color: "#e91e63", icon: "shopping" },
  "Tagihan":           { bg: "#e8f5e9", color: "#4caf50", icon: "bill" },
  "Hiburan":           { bg: "#ede7f6", color: "#7c4dff", icon: "entertainment" },
  "Kesehatan":         { bg: "#e0f7fa", color: "#00bcd4", icon: "health" },
  "Pendidikan":        { bg: "#e8eaf6", color: "#3f51b5", icon: "education" },
  "Lainnya":           { bg: "#f5f5f5", color: "#8a96a3", icon: "other" },
};

const SOURCE_STYLES: Record<string, { bg: string; color: string; icon: string }> = {
  "Gaji":      { bg: "#e8faf3", color: "#2dbe7e", icon: "salary" },
  "Freelance": { bg: "#e3f2fd", color: "#2196f3", icon: "freelance" },
  "Bonus":     { bg: "#fff8e1", color: "#ffc107", icon: "bonus" },
  "Investasi": { bg: "#e8f5e9", color: "#43a047", icon: "invest" },
  "Bisnis":    { bg: "#ede7f6", color: "#7c4dff", icon: "business" },
  "Lainnya":   { bg: "#f3e5f5", color: "#9c27b0", icon: "wallet" },
};

const styleInfo = computed(() => {
  if (props.type === "income") {
    const key = props.sourceName || "Lainnya";
    return SOURCE_STYLES[key] || { bg: "#e8faf3", color: "#2dbe7e", icon: "salary" };
  }
  const key = props.categoryName || "Lainnya";
  // Partial match fallback (e.g. "Makanan berat" -> "Makanan")
  for (const k of Object.keys(CATEGORY_STYLES)) {
    if (key.toLowerCase().includes(k.toLowerCase())) {
      return CATEGORY_STYLES[k];
    }
  }
  return CATEGORY_STYLES["Lainnya"];
});
</script>

<template>
  <div
    class="tx-icon"
    :style="{ backgroundColor: styleInfo.bg }"
  >
    <!-- Food / Makanan -->
    <svg
      v-if="styleInfo.icon === 'food'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M18 8h1a4 4 0 0 1 0 8h-1"/>
      <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/>
      <line x1="6" y1="1" x2="6" y2="4"/>
      <line x1="10" y1="1" x2="10" y2="4"/>
      <line x1="14" y1="1" x2="14" y2="4"/>
    </svg>

    <!-- Transportasi / Car -->
    <svg
      v-else-if="styleInfo.icon === 'car'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="1" y="3" width="15" height="13" rx="1"/>
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
      <circle cx="5.5" cy="18.5" r="2.5"/>
      <circle cx="18.5" cy="18.5" r="2.5"/>
    </svg>

    <!-- Belanja / Shopping Bag -->
    <svg
      v-else-if="styleInfo.icon === 'shopping'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
      <line x1="3" y1="6" x2="21" y2="6"/>
      <path d="M16 10a4 4 0 0 1-8 0"/>
    </svg>

    <!-- Tagihan / Invoice Bill -->
    <svg
      v-else-if="styleInfo.icon === 'bill'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>

    <!-- Hiburan / Entertainment -->
    <svg
      v-else-if="styleInfo.icon === 'entertainment'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="6" width="20" height="12" rx="2"/>
      <path d="M6 12h4m-2-2v4"/>
      <line x1="15" y1="11" x2="15.01" y2="11"/>
      <line x1="18" y1="13" x2="18.01" y2="13"/>
    </svg>

    <!-- Kesehatan / Health -->
    <svg
      v-else-if="styleInfo.icon === 'health'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>

    <!-- Pendidikan / Education -->
    <svg
      v-else-if="styleInfo.icon === 'education'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>

    <!-- Gaji / Salary (Briefcase) -->
    <svg
      v-else-if="styleInfo.icon === 'salary'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>

    <!-- Freelance / Laptop -->
    <svg
      v-else-if="styleInfo.icon === 'freelance'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
      <line x1="2" y1="20" x2="22" y2="20"/>
    </svg>

    <!-- Bonus / Gift -->
    <svg
      v-else-if="styleInfo.icon === 'bonus'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12"/>
      <rect x="2" y="7" width="20" height="5"/>
      <line x1="12" y1="22" x2="12" y2="7"/>
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/>
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>
    </svg>

    <!-- Investasi / Trending Up -->
    <svg
      v-else-if="styleInfo.icon === 'invest'"
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
      <polyline points="22 10 18 6 14 10 10 6 6 10 2 6"/>
    </svg>

    <!-- Default Wallet / Other -->
    <svg
      v-else
      :width="size"
      :height="size"
      viewBox="0 0 24 24"
      fill="none"
      :stroke="styleInfo.color"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  </div>
</template>
