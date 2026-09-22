// Set ikon custom bergaya "stroke" minimal, dipakai untuk sumber pemasukan &
// kategori pengeluaran. Disimpan sebagai string SVG mentah supaya bisa dipakai
// langsung lewat v-html di berbagai komponen (list item, picker, dsb).
export const ICON_MAP: Record<string, string> = {
  scooter:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="18" r="2.3"/><circle cx="18" cy="18" r="2.3"/><path d="M7.7 18h8.6"/><path d="M9 18v-4.5h5L16.5 9H19"/><path d="M9 13.5 6.7 9H5"/><path d="M13.5 5.5h2"/></svg>',
  briefcase:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M8 8V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M3 13h18"/></svg>',
  store:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9"/><path d="M2.5 5 4 9h16l1.5-4a1 1 0 0 0-.9-1.4H3.4A1 1 0 0 0 2.5 5Z"/><path d="M9 20v-5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v5"/></svg>',
  dots:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>',
  fuel:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V6a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v15"/><path d="M4 11h9"/><path d="M13 8.5 16 11v6a1.6 1.6 0 0 0 3.2 0V9.5L17 7"/><path d="M2 21h13"/></svg>',
  food:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a2 2 0 0 0 4 0V3"/><path d="M8 10v11"/><path d="M17 3c-1.5 1-2.3 2.7-2.3 5.5S15.5 13 17 14v8"/></svg>',
  wrench:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.1L3 18.7 5.3 21l7.3-6.3a4 4 0 0 0 5.1-5.4l-2.8 2.8-2.1-.7-.7-2.1Z"/></svg>',
  wallet:
    '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2"/><path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-4"/><rect x="14" y="12" width="7" height="5" rx="1"/><circle cx="17" cy="14.5" r=".6" fill="currentColor"/></svg>',
  alert:
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.9 18a1.6 1.6 0 0 0 1.4 2.5h17.4A1.6 1.6 0 0 0 22 18L13.7 3.9a1.6 1.6 0 0 0-2.8 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  close:
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="M6 6l12 12"/></svg>',
  trash:
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3"/></svg>',
};
