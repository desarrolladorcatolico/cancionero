import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, collection, getDocs
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsgYJ3OGJ2JQfXX9l2CO-V26-v90sKFAY",
  authDomain: "cancionerodominico.firebaseapp.com",
  projectId: "cancionerodominico",
  storageBucket: "cancionerodominico.firebasestorage.app",
  messagingSenderId: "1019835999965",
  appId: "1:1019835999965:web:4a30265a4d1cc69ba65d34",
  measurementId: "G-2DE8QCPQ1B",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const refCelebracion = doc(db, "celebraciones", "actual");
const estado = document.getElementById("estadoNube");
const CACHE_KEY = "catalogoCancionesFirestore";

function adaptarCancionesFirestore(docs) {
  const resultado = [];
  for (const snap of docs) {
    const d = snap.data();
    if (d.activo === false || d.estado !== "PUBLICADA") continue;
    const momentos = Array.isArray(d.momentos) ? d.momentos : [];
    for (const categoria of momentos) {
      resultado.push({
        id: Number(d.id ?? snap.id), titulo: d.titulo || "", autor: d.autor || "",
        categoria, letra: d.letra || "", tono: d.tono || "", acordes: d.acordes || ""
      });
    }
  }
  return resultado.sort((a,b) => a.id - b.id);
}

async function cargarCatalogo() {
  try {
    const snap = await getDocs(collection(db, "canciones"));
    const catalogo = adaptarCancionesFirestore(snap.docs);
    if (!catalogo.length) throw new Error("Firestore devolvió un catálogo vacío");
    localStorage.setItem(CACHE_KEY, JSON.stringify(catalogo));
    window.dispatchEvent(new CustomEvent("catalogo-cargado", {detail:{canciones:catalogo, origen:"firebase"}}));
    return "firebase";
  } catch (e) {
    console.warn("No se pudo cargar catálogo desde Firestore:", e);
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE_KEY) || "[]");
      if (Array.isArray(cache) && cache.length) {
        window.dispatchEvent(new CustomEvent("catalogo-cargado", {detail:{canciones:cache, origen:"cache"}}));
        return "cache";
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("catalogo-cargado", {detail:{canciones:null, origen:"local"}}));
    return "local";
  }
}

async function cargarCelebracion() {
  try {
    const s = await getDoc(refCelebracion);
    if (s.exists()) window.aplicarSeleccionRemota(s.data().seleccion || {});
    return true;
  } catch (e) {
    console.error(e); return false;
  }
}

async function iniciarFirebase() {
  estado.textContent = "☁ Conectando...";
  const origen = await cargarCatalogo();
  const celebracionOk = await cargarCelebracion();
  if (origen === "firebase" && celebracionOk) estado.textContent = "☁ Sincronizado";
  else if (origen === "cache") estado.textContent = "☁ Catálogo offline";
  else if (origen === "local") estado.textContent = "⚠ Catálogo local";
  else estado.textContent = "⚠ Sin conexión Firebase";
}

let timer;
window.addEventListener("celebracion-cambiada", (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      estado.textContent = "☁ Guardando...";
      await setDoc(refCelebracion, { seleccion: e.detail, actualizada: new Date().toISOString() });
      estado.textContent = "☁ Guardado";
    } catch (err) {
      console.error(err); estado.textContent = "⚠ No se pudo guardar";
    }
  }, 300);
});

iniciarFirebase();
