import { ref } from "vue";
import type { TransactionType } from "@/types";

export interface OpenTransactionModalOptions {
  type?: TransactionType;
  sourceId?: string;
  walletId?: string;
  editingId?: string;
}

const isTransactionModalOpen = ref(false);
const transactionModalOptions = ref<OpenTransactionModalOptions>({});

export function useTransactionModal() {
  function openModal(options: OpenTransactionModalOptions = {}) {
    transactionModalOptions.value = { ...options };
    isTransactionModalOpen.value = true;
  }

  function closeModal() {
    isTransactionModalOpen.value = false;
    transactionModalOptions.value = {};
  }

  return {
    isOpen: isTransactionModalOpen,
    options: transactionModalOptions,
    openModal,
    closeModal,
  };
}
