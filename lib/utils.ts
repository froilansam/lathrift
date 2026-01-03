import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(timestamp));
}

export function formatDateTime(timestamp: number): string {
  return new Intl.DateTimeFormat("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export const CONDITION_LABELS: Record<string, string> = {
  new: "Brand New",
  "like-new": "Like New",
  good: "Good",
  fair: "Fair",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Payment",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const SHIPPING_LABELS: Record<string, string> = {
  gogo: "GoGo Xpress",
  lalamove: "Lalamove (Same Day)",
  tiktok: "TikTok Shop",
  flat: "Standard Delivery",
};

export const COURIER_LABELS: Record<string, string> = {
  jnt: "J&T Express",
  lbc: "LBC Express",
  flash: "Flash Express",
  ninja: "Ninja Van",
  gogoxpress: "GoGo Xpress",
  lalamove: "Lalamove",
  grab: "Grab Express",
  other: "Other Courier",
};

export const COURIER_TRACKING_URLS: Record<string, string | null> = {
  jnt: "https://www.jtexpress.ph/track?billcode=",
  lbc: "https://www.lbcexpress.com/track/?tracking_no=",
  flash: "https://flashexpress.ph/tracking?tracking_number=",
  ninja: "https://www.ninjavan.co/en-ph/tracking?id=",
  gogoxpress: "https://www.gogoxpress.com/track/",
  lalamove: null,
  grab: null,
  other: null,
};

export function getTrackingUrl(courier: string, trackingNumber: string): string | null {
  const baseUrl = COURIER_TRACKING_URLS[courier];
  if (!baseUrl) return null;
  return `${baseUrl}${trackingNumber}`;
}

export const SHIPPING_RATES: Record<string, Record<string, number>> = {
  flat: {
    "metro-manila": 99,
    luzon: 149,
    visayas: 199,
    mindanao: 199,
  },
};

export function getRegion(province: string): string {
  const metroManila = [
    "metro manila",
    "ncr",
    "manila",
    "quezon city",
    "makati",
    "pasig",
    "taguig",
    "mandaluyong",
    "paranaque",
    "las pinas",
    "muntinlupa",
    "pasay",
    "caloocan",
    "malabon",
    "navotas",
    "valenzuela",
    "marikina",
    "san juan",
    "pateros",
  ];

  const visayas = [
    "cebu",
    "bohol",
    "negros occidental",
    "negros oriental",
    "iloilo",
    "leyte",
    "samar",
    "aklan",
    "antique",
    "capiz",
    "guimaras",
    "eastern samar",
    "northern samar",
    "southern leyte",
    "biliran",
    "siquijor",
  ];

  const mindanao = [
    "davao",
    "cagayan de oro",
    "zamboanga",
    "general santos",
    "bukidnon",
    "misamis oriental",
    "misamis occidental",
    "south cotabato",
    "north cotabato",
    "sultan kudarat",
    "lanao del norte",
    "lanao del sur",
    "agusan del norte",
    "agusan del sur",
    "surigao del norte",
    "surigao del sur",
    "compostela valley",
    "davao del sur",
    "davao del norte",
    "davao oriental",
    "sarangani",
    "zamboanga del norte",
    "zamboanga del sur",
    "zamboanga sibugay",
    "basilan",
    "sulu",
    "tawi-tawi",
    "maguindanao",
    "cotabato",
  ];

  const lowerProvince = province.toLowerCase();

  if (metroManila.some((m) => lowerProvince.includes(m))) {
    return "metro-manila";
  }
  if (visayas.some((v) => lowerProvince.includes(v))) {
    return "visayas";
  }
  if (mindanao.some((m) => lowerProvince.includes(m))) {
    return "mindanao";
  }
  return "luzon";
}
