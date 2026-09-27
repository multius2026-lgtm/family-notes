<script setup lang="ts">
import { onMounted, onBeforeUnmount, watch, ref } from "vue";
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip } from "chart.js";
import type { TrendPoint } from "@/types";
import { useCurrency } from "@/composables/useCurrency";

Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip);

const props = defineProps<{ points: TrendPoint[] }>();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const { fmt } = useCurrency();
let chart: Chart | null = null;

function readVar(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function render() {
  if (!canvasRef.value) return;
  const labels = props.points.map((p) =>
    new Date(p.date + "T00:00:00").toLocaleDateString("id-ID", { day: "numeric", month: "short" })
  );
  const income = props.points.map((p) => p.income);
  const expense = props.points.map((p) => p.expense);

  const incomeCol = readVar("--income") || "#4fd1a5";
  const expenseCol = readVar("--expense") || "#f0955a";
  const inkMuted = readVar("--ink-muted") || "#93a69a";
  const lineCol = readVar("--line") || "#2c4038";

  chart?.destroy();
  chart = new Chart(canvasRef.value, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "Pemasukan", data: income, borderColor: incomeCol, backgroundColor: incomeCol + "22", tension: 0.35, fill: true, pointRadius: 0, borderWidth: 2 },
        { label: "Pengeluaran", data: expense, borderColor: expenseCol, backgroundColor: expenseCol + "22", tension: 0.35, fill: true, pointRadius: 0, borderWidth: 2 },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (c) => `${c.dataset.label}: ${fmt(c.parsed.y ?? 0)}` } },
      },
      scales: {
        x: { ticks: { color: inkMuted, font: { size: 9.5 }, maxRotation: 0, autoSkip: true, maxTicksLimit: 6 }, grid: { display: false } },
        y: { ticks: { color: inkMuted, font: { size: 9.5 } }, grid: { color: lineCol } },
      },
    },
  });
}

onMounted(render);
onBeforeUnmount(() => chart?.destroy());
watch(() => props.points, render, { deep: true });
</script>

<template>
  <div class="flex gap-4 px-1.5 pb-2 text-[12px] text-ink-muted">
    <span class="inline-flex items-center gap-1.5"><i class="w-2 h-2 rounded-full inline-block" style="background: var(--income)"></i>Pemasukan</span>
    <span class="inline-flex items-center gap-1.5"><i class="w-2 h-2 rounded-full inline-block" style="background: var(--expense)"></i>Pengeluaran</span>
  </div>
  <div class="h-40 relative">
    <canvas ref="canvasRef"></canvas>
  </div>
</template>
