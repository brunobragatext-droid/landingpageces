import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { doc, getDoc, getFirestore, onSnapshot, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { getDownloadURL, getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-storage.js";
import { firebaseConfig, firebasePaths } from "./firebase-config.js";

const configured = !Object.values(firebaseConfig).some((value) => String(value).includes("SUBSTITUA") || String(value).includes("SEU_PROJETO"));
let services = null;

function getServices() {
  if (!configured) throw new Error("Firebase ainda não configurado. Preencha assets/js/firebase-config.js.");
  if (!services) {
    const app = initializeApp(firebaseConfig);
    services = { auth: getAuth(app), db: getFirestore(app), storage: getStorage(app) };
  }
  return services;
}

function siteRef() {
  return doc(getServices().db, firebasePaths.siteCollection, firebasePaths.siteDocument);
}

export const FirebaseService = {
  isConfigured: () => configured,

  async loadSiteData() {
    if (!configured) return null;
    const snapshot = await getDoc(siteRef());
    return snapshot.exists() ? snapshot.data().content : null;
  },

  subscribeSiteData(callback, onError = console.error) {
    if (!configured) return () => {};
    return onSnapshot(siteRef(), (snapshot) => {
      if (snapshot.exists() && snapshot.data().content) callback(snapshot.data().content);
    }, onError);
  },

  async saveSiteData(content) {
    const user = getServices().auth.currentUser;
    if (!user) throw new Error("Sua sessão expirou. Entre novamente.");
    await setDoc(siteRef(), { content, updatedAt: serverTimestamp(), updatedBy: user.uid }, { merge: true });
  },

  waitForAuth() {
    if (!configured) return Promise.resolve(null);
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(getServices().auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
  },

  login(email, password) {
    return signInWithEmailAndPassword(getServices().auth, email.trim(), password);
  },

  logout() {
    return configured ? signOut(getServices().auth) : Promise.resolve();
  },

  async uploadImage(file, path = "image") {
      if (!file?.type?.startsWith("image/")) {
        throw new Error("Selecione um arquivo de imagem válido.");
      }

      if (file.size > 10 * 1024 * 1024) {
        throw new Error("A imagem deve ter no máximo 10 MB.");
      }

      const user = getServices().auth.currentUser;
      if (!user) {
        throw new Error("Sua sessão expirou. Entre novamente.");
      }

      // Mantém apenas caracteres seguros no caminho
      const safePath = path.replace(/[^a-z0-9/_-]/gi, "-");

      // Utiliza sempre o mesmo caminho para sobrescrever a imagem existente
      const objectRef = ref(
        getServices().storage,
        `${firebasePaths.uploadFolder}/${safePath}`
      );

      await uploadBytes(objectRef, file, {
        contentType: file.type
      });

      return await getDownloadURL(objectRef);
}
};
