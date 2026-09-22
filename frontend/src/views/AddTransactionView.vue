<script setup lang="ts">
import { reactive, ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useTransactionsStore } from "@/stores/transactions";
import { useMasterDataStore } from "@/stores/masterData";
import TransactionForm, { type TxFormState } from "@/components/transactions/TransactionForm.vue";
import { ICON_MAP } from "@/components/icons";

const route = useRoute();
const router = useRouter();
const store = useTransactionsStore();
const master = useMasterDataStore();

const editingId = computed(() => route.params.id as string | undefined);
const saving = ref(false);
const errorMsg = ref("");

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const form = reactive<TxFormState>({
  type: "income",
  amount: null,
  periodType: "daily",
  incomeSourceId: null,
  expenseCategoryId: null,
  note: "",
  occurredAt: todayStr(),
});

onMounted(async () => {
  if (master.incomeSources.length === 0) await master.fetchAll();

  if (editingId.value) {
    let tx = store.items.find((t) => t.id === editingId.value);
    if (!tx) {
      await store.fetchList({});
      tx = store.items.find((t) => t.id === editingId.value);
    }
    if (tx) {
      form.type = tx.type;
      form.amount = Number(tx.amount);
      form.periodType = tx.periodType;
      form.incomeSourceId = tx.incomeSourceId;
      form.expenseCategoryId = tx.expenseCategoryId;
      form.note = tx.note || "";
      form.occurredAt = tx.occurredAt;
    }
  } else {
    const sourceId = route.query.sourceId as string | undefined;
    if (sourceId) {
      form.type = "income";
      form.incomeSourceId = sourceId;
      const src = master.incomeSources.find((s) => s.id === sourceId);
      if (src) form.periodType = src.defaultPeriodType;
    } else if (!form.incomeSourceId && master.incomeSources[0]) {
      form.incomeSourceId = master.incomeSources[0].id;
    }
    if (!form.expenseCategoryId && master.expenseCategories[0]) {
      form.expenseCategoryId = master.expenseCategories[0].id;
    }
  }
});

async function save() {
  errorMsg.value = "";
  if (!form.amount || form.amount <= 0) {
    errorMsg.value = "Masukkan jumlah yang valid (lebih dari 0).";
    return;
  }
  if (form.type === "income" && !form.incomeSourceId) {
    errorMsg.value = "Pilih sumber pemasukan terlebih dahulu.";
    return;
  }
  if (form.type === "expense" && !form.expenseCategoryId) {
    errorMsg.value = "Pilih kategori pengeluaran terlebih dahulu.";
    return;
  }

  saving.value = true;
  try {
    const payload = {
      type: form.type,
      amount: form.amount,
      periodType: form.periodType,
      incomeSourceId: form.type === "income" ? form.incomeSourceId! : undefined,
      expenseCategoryId: form.type === "expense" ? form.expenseCategoryId! : undefined,
      note: form.note || undefined,
      occurredAt: form.occurredAt,
    };
    if (editingId.value) {
      await store.update(editingId.value, payload);
    } else {
      await store.create(payload);
    }
    router.back();
  } catch (e: any) {
    errorMsg.value = e?.data?.error || "Gagal menyimpan transaksi.";
  } finally {
    saving.value = false;
  }
}

async function remove() {
  if (!editingId.value) return;
  if (!confirm("Hapus transaksi ini?")) return;
  await store.remove(editingId.value);
  router.back();
}
</script>

<template>
  <div class="min-h-screen bg-paper">
    <!-- Header -->
    <div
      class="flex items-center justify-between px-5 py-4 bg-surface border-b border-line"
      style="padding-top: calc(16px + env(safe-area-inset-top, 0px))"
    >
      <button
        class="w-9 h-9 rounded-full bg-surface-2 flex items-center justify-center"
        @click="router.back()"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="text-[17px] font-bold text-ink">
        {{ editingId ? "Edit Transaksi" : "Tambah Transaksi" }}
      </h1>
      <div class="w-9 h-9"></div><!-- spacer -->
    </div>

    <div class="px-5 pt-5 pb-10">
      <TransactionForm v-model="form" />

      <!-- Error -->
      <p v-if="errorMsg" class="text-[13px] font-medium mb-3 px-1" style="color: var(--expense)">
        {{ errorMsg }}
      </p>

      <!-- Simpan -->
      <button
        id="btn-simpan-transaksi"
        :disabled="saving"
        class="btn-primary mt-2"
        @click="save"
      >
        {{ saving ? "Menyimpan..." : "Simpan Transaksi" }}
      </button>

      <!-- Hapus -->
      <button
        v-if="editingId"
        class="w-full mt-3 py-4 rounded-2xl font-bold text-[15px] border-2 transition-colors"
        style="border-color: var(--expense); color: var(--expense); background: transparent;"
        @click="remove"
      >
        Hapus Transaksi
      </button>
    </div>
  </div>
</template>
