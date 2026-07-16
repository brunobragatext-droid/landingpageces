const STORAGE_KEY = "ces-site-data";
const VERSION_KEY = "ces-site-version";

// Altere este número sempre que publicar uma alteração importante no site
const DATA_VERSION = "20260717";

const DATA_URL = new URL("../../data/site.json", import.meta.url);

export const StorageService = {
  async loadSiteData() {
    const savedVersion = localStorage.getItem(VERSION_KEY);

    // Usa o cache local somente se for a mesma versão
    if (savedVersion === DATA_VERSION) {
      const localData = this.getLocalData();
      if (localData) return localData;
    }

    // Busca uma versão nova
    const response = await fetch(`${DATA_URL.href}?v=${DATA_VERSION}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar o arquivo data/site.json.");
    }

    const data = await response.json();

    this.saveLocalData(data);
    localStorage.setItem(VERSION_KEY, DATA_VERSION);

    return data;
  },

  async loadOriginalData() {
    const response = await fetch(`${DATA_URL.href}?v=${DATA_VERSION}`, {
      cache: "no-store"
    });

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

  saveLocalData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    window.dispatchEvent(
      new CustomEvent("ces:data-updated", {
        detail: data
      })
    );
  },

  resetLocalData() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(VERSION_KEY);
  },

  exportData(data) {
    const blob = new Blob(
      [JSON.stringify(data, null, 2)],
      { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "site.json";
    link.click();

    URL.revokeObjectURL(url);
  }
};

export const debounce = (callback, wait = 180) => {
  let timeoutId;

  return (...args) => {
    window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, wait);
  };
};
