import type { Component } from "vue";
import {
  Utensils,
  Car,
  Fuel,
  Wrench,
  ShoppingBag,
  ShoppingCart,
  Zap,
  Home,
  Film,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  BookOpen,
  Users,
  Sparkles,
  Gift,
  Heart,
  Receipt,
  CreditCard,
  Briefcase,
  Laptop,
  Store,
  TrendingUp,
  Banknote,
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Tag,
  CircleDollarSign,
  Coffee,
  Plane,
  Smartphone,
  Bike,
  Wallet,
  MoreHorizontal,
  Flame,
  Droplets,
  Wifi,
  Music,
  Dumbbell,
  PawPrint,
  PiggyBank
} from "lucide-vue-next";

export function getCategoryIconComponent(
  nameOrSlug?: string | null,
  type?: "income" | "expense" | "transfer"
): Component {
  if (type === "transfer") return ArrowLeftRight;

  const key = (nameOrSlug || "").toLowerCase().trim();

  // Income sources check
  if (type === "income") {
    if (key.includes("gaji") || key.includes("salary") || key.includes("kantor") || key.includes("upah") || key.includes("honor")) return Briefcase;
    if (key.includes("freelance") || key.includes("proyek") || key.includes("laptop") || key.includes("project")) return Laptop;
    if (key.includes("jual") || key.includes("dagang") || key.includes("bisnis") || key.includes("toko") || key.includes("store") || key.includes("business")) return Store;
    if (key.includes("invest") || key.includes("saham") || key.includes("dividen") || key.includes("reksadana") || key.includes("crypto") || key.includes("trading")) return TrendingUp;
    if (key.includes("bonus") || key.includes("thr") || key.includes("hadiah") || key.includes("reward") || key.includes("gift")) return Gift;
    if (key.includes("gojek") || key.includes("grab") || key.includes("ojol") || key.includes("scooter") || key.includes("maxim") || key.includes("indrive")) return Bike;
    if (key.includes("tabungan") || key.includes("saving") || key.includes("celengan")) return PiggyBank;
    if (key.includes("dots") || key.includes("lainnya") || key.includes("other")) return MoreHorizontal;
    return CircleDollarSign;
  }

  // Expense categories check
  if (key.includes("makan") || key.includes("minum") || key.includes("kuliner") || key.includes("resto") || key.includes("food") || key.includes("snack") || key.includes("sarapan") || key.includes("lunch") || key.includes("dinner")) {
    if (key.includes("kopi") || key.includes("coffee") || key.includes("cafe") || key.includes("kafe")) return Coffee;
    return Utensils;
  }

  if (key.includes("bensin") || key.includes("fuel") || key.includes("spbu") || key.includes("pertamina") || key.includes("shell") || key.includes("solar") || key.includes("pertalite") || key.includes("pertamax")) {
    return Fuel;
  }

  if (key.includes("servis") || key.includes("service") || key.includes("bengkel") || key.includes("wrench") || key.includes("reparasi") || key.includes("cuci") || key.includes("ganti oli") || key.includes("repair")) {
    return Wrench;
  }

  if (key.includes("gojek") || key.includes("grab") || key.includes("scooter") || key.includes("motor") || key.includes("ojek") || key.includes("bike")) {
    return Bike;
  }

  if (key.includes("transport") || key.includes("mobil") || key.includes("car") || key.includes("tol") || key.includes("parkir") || key.includes("angkot") || key.includes("bus") || key.includes("kereta") || key.includes("mrt") || key.includes("krl")) {
    return Car;
  }

  if (key.includes("belanja") || key.includes("shopping") || key.includes("cart") || key.includes("pakaian") || key.includes("baju") || key.includes("sepatu") || key.includes("tas") || key.includes("fashion")) {
    return ShoppingBag;
  }

  if (key.includes("pasar") || key.includes("supermarket") || key.includes("minimarket") || key.includes("groceries") || key.includes("sembako") || key.includes("indomaret") || key.includes("alfamart")) {
    return ShoppingCart;
  }

  if (key.includes("listrik") || key.includes("pln") || key.includes("bolt") || key.includes("zap") || key.includes("token")) {
    return Zap;
  }

  if (key.includes("air") || key.includes("pdam") || key.includes("water") || key.includes("galon") || key.includes("aqua")) {
    return Droplets;
  }

  if (key.includes("gas") || key.includes("lpg") || key.includes("flame")) {
    return Flame;
  }

  if (key.includes("pulsa") || key.includes("paket data") || key.includes("kuota") || key.includes("telkom") || key.includes("hp") || key.includes("smartphone") || key.includes("phone")) {
    return Smartphone;
  }

  if (key.includes("wifi") || key.includes("internet") || key.includes("indihome") || key.includes("biznet") || key.includes("first media") || key.includes("myrepublic")) {
    return Wifi;
  }

  if (key.includes("tagihan") || key.includes("bill") || key.includes("iuran")) {
    return Zap;
  }

  if (key.includes("rumah") || key.includes("kos") || key.includes("kost") || key.includes("kontrakan") || key.includes("sewa") || key.includes("home") || key.includes("house") || key.includes("apartemen")) {
    return Home;
  }

  if (key.includes("game") || key.includes("gaming") || key.includes("steam") || key.includes("playstation") || key.includes("xbox") || key.includes("topup")) {
    return Gamepad2;
  }

  if (key.includes("film") || key.includes("cinema") || key.includes("bioskop") || key.includes("nonton") || key.includes("netflix") || key.includes("disney") || key.includes("movie")) {
    return Film;
  }

  if (key.includes("musik") || key.includes("music") || key.includes("spotify") || key.includes("lagu")) {
    return Music;
  }

  if (key.includes("hiburan") || key.includes("entertainment") || key.includes("rekreasi")) {
    return Film;
  }

  if (key.includes("wisata") || key.includes("liburan") || key.includes("travel") || key.includes("pesawat") || key.includes("hotel") || key.includes("tiket") || key.includes("flight")) {
    return Plane;
  }

  if (key.includes("sehat") || key.includes("kesehatan") || key.includes("obat") || key.includes("dokter") || key.includes("apotek") || key.includes("rumah sakit") || key.includes("klinik") || key.includes("vitamin") || key.includes("medis") || key.includes("health") || key.includes("bpjs")) {
    return HeartPulse;
  }

  if (key.includes("gym") || key.includes("fitness") || key.includes("olahraga") || key.includes("sport") || key.includes("futsal") || key.includes("badminton")) {
    return Dumbbell;
  }

  if (key.includes("didik") || key.includes("pendidikan") || key.includes("sekolah") || key.includes("kuliah") || key.includes("kursus") || key.includes("les") || key.includes("education") || key.includes("spp") || key.includes("buku") || key.includes("kitab") || key.includes("novel") || key.includes("book")) {
    return GraduationCap;
  }

  if (key.includes("keluarga") || key.includes("anak") || key.includes("bayi") || key.includes("orang tua") || key.includes("family") || key.includes("istri") || key.includes("suami")) {
    return Users;
  }

  if (key.includes("salon") || key.includes("barber") || key.includes("skincare") || key.includes("kosmetik") || key.includes("perawatan") || key.includes("cantik") || key.includes("spa")) {
    return Sparkles;
  }

  if (key.includes("hewan") || key.includes("pet") || key.includes("kucing") || key.includes("anjing") || key.includes("paw")) {
    return PawPrint;
  }

  if (key.includes("donasi") || key.includes("zakat") || key.includes("sedekah") || key.includes("infaq") || key.includes("sumbangan") || key.includes("amal") || key.includes("charity")) {
    return Heart;
  }

  if (key.includes("hadiah") || key.includes("gift") || key.includes("kado") || key.includes("angpau")) {
    return Gift;
  }

  if (key.includes("pajak") || key.includes("asuransi") || key.includes("receipt") || key.includes("struk") || key.includes("denda") || key.includes("tax")) {
    return Receipt;
  }

  if (key.includes("cicilan") || key.includes("utang") || key.includes("kredit") || key.includes("pinjaman") || key.includes("paylater") || key.includes("kartu kredit") || key.includes("credit")) {
    return CreditCard;
  }

  if (key.includes("dots") || key.includes("lainnya") || key.includes("other") || key.includes("more")) {
    return MoreHorizontal;
  }

  return Tag;
}

export function getCategoryEmoji(
  nameOrSlug?: string | null,
  type?: "income" | "expense" | "transfer"
): string {
  if (type === "transfer") return "🔁";

  const key = (nameOrSlug || "").toLowerCase().trim();

  // If already an emoji (e.g. user typed an emoji or unicode character), return it
  if (nameOrSlug && /\p{Extended_Pictographic}/u.test(nameOrSlug)) {
    return nameOrSlug;
  }

  if (type === "income") {
    if (key.includes("gaji") || key.includes("salary") || key.includes("kantor") || key.includes("upah") || key.includes("honor")) return "💼";
    if (key.includes("freelance") || key.includes("proyek") || key.includes("laptop") || key.includes("project")) return "💻";
    if (key.includes("jual") || key.includes("dagang") || key.includes("bisnis") || key.includes("toko") || key.includes("store") || key.includes("business")) return "🏪";
    if (key.includes("invest") || key.includes("saham") || key.includes("dividen") || key.includes("reksadana") || key.includes("crypto") || key.includes("trading")) return "📈";
    if (key.includes("bonus") || key.includes("thr") || key.includes("hadiah") || key.includes("reward") || key.includes("gift")) return "🎁";
    if (key.includes("gojek") || key.includes("grab") || key.includes("ojol") || key.includes("scooter") || key.includes("maxim") || key.includes("indrive")) return "🛵";
    if (key.includes("tabungan") || key.includes("saving") || key.includes("celengan")) return "🐷";
    return "💰";
  }

  if (key.includes("makan") || key.includes("minum") || key.includes("kuliner") || key.includes("resto") || key.includes("food") || key.includes("snack") || key.includes("sarapan") || key.includes("lunch") || key.includes("dinner")) {
    if (key.includes("kopi") || key.includes("coffee") || key.includes("cafe") || key.includes("kafe")) return "☕";
    return "🍽️";
  }

  if (key.includes("bensin") || key.includes("fuel") || key.includes("spbu") || key.includes("pertamina") || key.includes("shell") || key.includes("solar") || key.includes("pertalite") || key.includes("pertamax")) {
    return "⛽";
  }

  if (key.includes("servis") || key.includes("service") || key.includes("bengkel") || key.includes("wrench") || key.includes("reparasi") || key.includes("cuci") || key.includes("ganti oli") || key.includes("repair")) {
    return "🔧";
  }

  if (key.includes("gojek") || key.includes("grab") || key.includes("scooter") || key.includes("motor") || key.includes("ojek") || key.includes("bike")) {
    return "🛵";
  }

  if (key.includes("transport") || key.includes("mobil") || key.includes("car") || key.includes("tol") || key.includes("parkir") || key.includes("angkot") || key.includes("bus") || key.includes("kereta") || key.includes("mrt") || key.includes("krl")) {
    return "🚗";
  }

  if (key.includes("belanja") || key.includes("shopping") || key.includes("cart") || key.includes("pakaian") || key.includes("baju") || key.includes("sepatu") || key.includes("tas") || key.includes("fashion")) {
    return "🛍️";
  }

  if (key.includes("pasar") || key.includes("supermarket") || key.includes("minimarket") || key.includes("groceries") || key.includes("sembako") || key.includes("indomaret") || key.includes("alfamart")) {
    return "🛒";
  }

  if (key.includes("listrik") || key.includes("pln") || key.includes("bolt") || key.includes("zap") || key.includes("token")) {
    return "⚡";
  }

  if (key.includes("air") || key.includes("pdam") || key.includes("water") || key.includes("galon") || key.includes("aqua")) {
    return "💧";
  }

  if (key.includes("gas") || key.includes("lpg") || key.includes("flame")) {
    return "🔥";
  }

  if (key.includes("pulsa") || key.includes("paket data") || key.includes("kuota") || key.includes("telkom") || key.includes("hp") || key.includes("smartphone") || key.includes("phone")) {
    return "📱";
  }

  if (key.includes("wifi") || key.includes("internet") || key.includes("indihome") || key.includes("biznet") || key.includes("first media") || key.includes("myrepublic")) {
    return "🌐";
  }

  if (key.includes("tagihan") || key.includes("bill") || key.includes("iuran")) {
    return "📄";
  }

  if (key.includes("rumah") || key.includes("kos") || key.includes("kost") || key.includes("kontrakan") || key.includes("sewa") || key.includes("home") || key.includes("house") || key.includes("apartemen")) {
    return "🏠";
  }

  if (key.includes("game") || key.includes("gaming") || key.includes("steam") || key.includes("playstation") || key.includes("xbox") || key.includes("topup")) {
    return "🎮";
  }

  if (key.includes("film") || key.includes("cinema") || key.includes("bioskop") || key.includes("nonton") || key.includes("netflix") || key.includes("disney") || key.includes("movie")) {
    return "🎬";
  }

  if (key.includes("musik") || key.includes("music") || key.includes("spotify") || key.includes("lagu")) {
    return "🎵";
  }

  if (key.includes("hiburan") || key.includes("entertainment") || key.includes("rekreasi")) {
    return "🎡";
  }

  if (key.includes("wisata") || key.includes("liburan") || key.includes("travel") || key.includes("pesawat") || key.includes("hotel") || key.includes("tiket") || key.includes("flight")) {
    return "✈️";
  }

  if (key.includes("sehat") || key.includes("kesehatan") || key.includes("obat") || key.includes("dokter") || key.includes("apotek") || key.includes("rumah sakit") || key.includes("klinik") || key.includes("vitamin") || key.includes("medis") || key.includes("health") || key.includes("bpjs")) {
    return "💊";
  }

  if (key.includes("gym") || key.includes("fitness") || key.includes("olahraga") || key.includes("sport") || key.includes("futsal") || key.includes("badminton")) {
    return "🏋️";
  }

  if (key.includes("didik") || key.includes("pendidikan") || key.includes("sekolah") || key.includes("kuliah") || key.includes("kursus") || key.includes("les") || key.includes("education") || key.includes("spp") || key.includes("buku") || key.includes("kitab") || key.includes("novel") || key.includes("book")) {
    return "🎓";
  }

  if (key.includes("keluarga") || key.includes("anak") || key.includes("bayi") || key.includes("orang tua") || key.includes("family") || key.includes("istri") || key.includes("suami")) {
    return "👨‍👩‍👧";
  }

  if (key.includes("salon") || key.includes("barber") || key.includes("skincare") || key.includes("kosmetik") || key.includes("perawatan") || key.includes("cantik") || key.includes("spa")) {
    return "✨";
  }

  if (key.includes("hewan") || key.includes("pet") || key.includes("kucing") || key.includes("anjing") || key.includes("paw")) {
    return "🐾";
  }

  if (key.includes("donasi") || key.includes("zakat") || key.includes("sedekah") || key.includes("infaq") || key.includes("sumbangan") || key.includes("amal") || key.includes("charity")) {
    return "🤲";
  }

  if (key.includes("hadiah") || key.includes("gift") || key.includes("kado") || key.includes("angpau")) {
    return "🎁";
  }

  if (key.includes("pajak") || key.includes("asuransi") || key.includes("receipt") || key.includes("struk") || key.includes("denda") || key.includes("tax")) {
    return "🧾";
  }

  if (key.includes("cicilan") || key.includes("utang") || key.includes("kredit") || key.includes("pinjaman") || key.includes("paylater") || key.includes("kartu kredit") || key.includes("credit")) {
    return "💳";
  }

  return "🏷️";
}
