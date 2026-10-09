import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, collection, getDocs, query, where, onSnapshot, getDoc
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";

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
const auth = getAuth(app);
const estado = document.getElementById("estadoNube");
const refCompartida = doc(db, "celebraciones", "actual");
const CACHE = "catalogoCancionesFirestore";

function adaptarCanciones(docs) {
  const resultado = [];
  for (const snap of docs) {
    const d = snap.data();
    for (const categoria of (Array.isArray(d.momentos) ? d.momentos : [])) {
      resultado.push({
        id: String(d.id ?? snap.id),
        titulo: d.titulo || "",
        autor: d.autor || "",
        categoria,
        letra: d.letra || "",
        tono: d.tono || "",
        acordes: d.acordes || ""
      });
    }
  }
  return resultado;
}

async function cargarCatalogo() {
  try {
    const q = query(
      collection(db, "canciones"),
      where("estado", "==", "PUBLICADA"),
      where("activo", "==", true)
    );
    const snap = await getDocs(q);
    const catalogo = adaptarCanciones(snap.docs);
    if (!catalogo.length) throw new Error("Catálogo vacío");
    localStorage.setItem(CACHE, JSON.stringify(catalogo));
    window.dispatchEvent(new CustomEvent("catalogo-cargado", {
      detail: { canciones: catalogo, origen: "firebase" }
    }));
    return "firebase";
  } catch (e) {
    console.warn("Catálogo Firebase:", e);
    try {
      const cache = JSON.parse(localStorage.getItem(CACHE) || "[]");
      if (Array.isArray(cache) && cache.length) {
        window.dispatchEvent(new CustomEvent("catalogo-cargado", {
          detail: { canciones: cache, origen: "cache" }
        }));
        return "cache";
      }
    } catch (_) {}
    window.dispatchEvent(new CustomEvent("catalogo-cargado", {
      detail: { canciones: null, origen: "local" }
    }));
    return "local";
  }
}

async function cargarPerfil(user) {
  if (!user) {
    window.actualizarPerfilSesion?.(null);
    return;
  }
  try {
    const snap = await getDoc(doc(db, "usuarios", user.uid));
    if (!snap.exists()) throw new Error("Perfil no encontrado");
    const p = snap.data();
    if (p.activo !== true) throw new Error("Usuario inactivo");
    window.actualizarPerfilSesion?.({
      uid: user.uid,
      email: user.email,
      nombre: p.nombre || "",
      rol: p.rol,
      activo: true
    });
  } catch (e) {
    console.warn("Perfil:", e);
    window.actualizarPerfilSesion?.(null);
  }
}

onAuthStateChanged(auth, cargarPerfil);

window.addEventListener("solicitar-login", async () => {
  const email = prompt("Correo electrónico:");
  if (!email) return;
  const password = prompt("Contraseña:");
  if (!password) return;
  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (e) {
    console.error(e);
    alert("No se pudo iniciar sesión. Verifica correo y contraseña.");
  }
});

window.addEventListener("solicitar-logout", () => signOut(auth));

// SEGUNDA MITAD: escucha en tiempo real de la celebración compartida.
// Funciona también para visitantes porque las reglas permiten lectura pública.
let primeraLecturaCompartida = true;
const compartidaInicial = new Promise((resolve) => {
  onSnapshot(
    refCompartida,
    (snap) => {
      const ids = snap.exists() ? (snap.data().seleccion || {}) : {};
      localStorage.setItem("celebracionCompartidaIds", JSON.stringify(ids));
      window.aplicarCelebracionCompartida?.(ids);
      if (primeraLecturaCompartida) {
        primeraLecturaCompartida = false;
        resolve(true);
      }
    },
    (e) => {
      console.warn("Celebración compartida:", e);
      if (primeraLecturaCompartida) {
        primeraLecturaCompartida = false;
        resolve(false);
      }
    }
  );
});

let timer;
window.addEventListener("celebracion-compartida-cambiada", (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      estado.textContent = "☁ Guardando...";
      await setDoc(refCompartida, {
        seleccion: e.detail,
        actualizada: new Date().toISOString()
      });
      estado.textContent = "☁ Guardado";
    } catch (err) {
      console.error(err);
      estado.textContent = "⚠ No se pudo guardar";
    }
  }, 300);
});

(async () => {
  estado.textContent = "☁ Conectando...";
  const origen = await cargarCatalogo();
  const compartidaOk = await compartidaInicial;

  if (origen === "firebase" && compartidaOk) estado.textContent = "☁ Sincronizado";
  else if (origen === "cache") estado.textContent = "☁ Catálogo offline";
  else if (origen === "local") estado.textContent = "⚠ Catálogo local";
  else estado.textContent = "⚠ Sin conexión Firebase";
})();
