<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from "vue";
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from "chart.js";
import { useCurrency } from "@/composables/useCurrency";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

const props = withDefaults(
  defineProps<{
    data: { key: string; total: number; label?: string }[];
    colors?: string[];
    showLegend?: boolean;
    heightClass?: string;
  }>(),
  {
    showLegend: true,
    heightClass: "h-56",
  }
);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const { fmt } = useCurrency();
let chart: Chart | null = null;

const DEFAULT_PALETTE = ["#2dbe7e", "#f8a730", "#f05a5a", "#6c63ff", "#00bcd4", "#ff9f43", "#e91e63"];

function render() {
  if (!canvasRef.value) return;
  chart?.destroy();

  const activePalette = props.colors && props.colors.length ? props.colors : DEFAULT_PALETTE;

  chart = new Chart(canvasRef.value, {
    type: "doughnut",
    data: {
      labels: props.data.map((d) => d.label || d.key),
      datasets: [
        {
          data: props.data.map((d) => d.total),
          backgroundColor: props.data.map((_, i) => activePalette[i % activePalette.length]),
          borderWidth: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "70%",
      plugins: {
        legend: {
          display: props.showLegend,
          position: "bottom",
          labels: {
            color: getComputedStyle(document.documentElement).getPropertyValue("--ink-muted") || "#8a96a3",
            boxWidth: 10,
            font: { size: 11 },
          },
        },
        tooltip: {
          callbacks: {
            label: (c) => ` ${c.label}: ${fmt(c.parsed)}`,
          },
        },
      },
    },
  });
}

onMounted(render);
onBeforeUnmount(() => chart?.destroy());
watch(() => [props.data, props.colors, props.showLegend], render, { deep: true });
</script>

<template>
  <div :class="['relative', heightClass]">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
