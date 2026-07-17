import { FirebaseService } from "./firebase.js";

const STORAGE_KEY = "ces-site-data";
const DATA_URL = new URL("../../data/site.json", import.meta.url);

export const StorageService = {
  async loadSiteData() {
    const firebaseData = await FirebaseService.loadSiteData();
    if (firebaseData) {
      this.cacheData(firebaseData);
      return firebaseData;
    }

    const response = await fetch(`${DATA_URL.href}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar o arquivo data/site.json.");
    }

    const data = await response.json();
    this.cacheData(data);
    return data;
  },

  async loadOriginalData() {
    const response = await fetch(`${DATA_URL.href}?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Não foi possível carregar o JSON original.");
    }
    return response.json();
  },

  getLocalData() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  },

  cacheData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("ces:data-updated", { detail: data }));
  },

  async saveSiteData(data) {
    await FirebaseService.saveSiteData(data);
    this.cacheData(data);
  },

  subscribeSiteData(callback, onError) {
    return FirebaseService.subscribeSiteData((data) => {
      this.cacheData(data);
      callback(data);
    }, onError);
  },

  resetLocalData() {
    localStorage.removeItem(STORAGE_KEY);
  },

  exportData(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "site.json";
    link.click();
    URL.revokeObjectURL(url);
  },

  isFirebaseConfigured() {
    return FirebaseService.isConfigured();
  },

  getAuthenticatedUser() {
    return FirebaseService.waitForAuth();
  },

  login: (email, password) => FirebaseService.login(email, password),
  logout: () => FirebaseService.logout(),
  uploadImage: (file, path) => FirebaseService.uploadImage(file, path)
};

export const debounce = (callback, wait = 180) => {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
};
