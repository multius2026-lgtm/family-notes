import { ref } from "vue";

const isPrivacyMode = ref(localStorage.getItem("ch_privacy_mode") === "true");

export function usePrivacyMode() {
  function togglePrivacy() {
    isPrivacyMode.value = !isPrivacyMode.value;
    localStorage.setItem("ch_privacy_mode", String(isPrivacyMode.value));
  }

  function maskValue(formattedText: string): string {
    if (isPrivacyMode.value) {
      return "••••••••";
    }
    return formattedText;
  }

  return {
    isPrivacyMode,
    togglePrivacy,
    maskValue,
  };
}
