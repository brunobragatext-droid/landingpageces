export const AdminBridge = {
  notifyPreview(data) {
    window.dispatchEvent(new CustomEvent("ces:preview-update", { detail: data }));
  },

  onPreviewUpdate(callback) {
    window.addEventListener("storage", (event) => {
      if (event.key !== "ces-site-data" || !event.newValue) return;

      try {
        callback(JSON.parse(event.newValue));
      } catch {
        callback(null);
      }
    });

    window.addEventListener("ces:data-updated", (event) => callback(event.detail));
  }
};
