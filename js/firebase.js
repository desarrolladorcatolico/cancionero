import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
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
const app = initializeApp(firebaseConfig),
  db = getFirestore(app),
  ref = doc(db, "celebraciones", "actual"),
  estado = document.getElementById("estadoNube");
async function cargar() {
  try {
    const s = await getDoc(ref);
    if (s.exists()) window.aplicarSeleccionRemota(s.data().seleccion || {});
    estado.textContent = "☁ Sincronizado";
  } catch (e) {
    console.error(e);
    estado.textContent = "⚠ Sin conexión Firebase";
  }
}
let timer;
window.addEventListener("celebracion-cambiada", (e) => {
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      estado.textContent = "☁ Guardando...";
      await setDoc(ref, {
        seleccion: e.detail,
        actualizada: new Date().toISOString(),
      });
      estado.textContent = "☁ Guardado";
    } catch (err) {
      console.error(err);
      estado.textContent = "⚠ No se pudo guardar";
    }
  }, 300);
});
cargar();
