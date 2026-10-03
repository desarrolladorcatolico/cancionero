const ordenLiturgico = [
  "Entrada",
  "Perdon",
  "Gloria",
  "Antifona",
  "Colecta",
  "Ofertorio",
  "Santo",
  "Padrenuestro",
  "Cordero",
  "Comunion",
  "ComunionII",
  "Salida",
  "Himno",
];
let listaActual = [],
  seleccion = {},
  ordenCelebracion = [],
  indiceCelebracion = 0,
  categoriaAbierta = null;
function cargar(categoria) {
  if (categoriaAbierta === categoria) {
    categoriaAbierta = null;
    listaActual = [];
    document.getElementById("listaCanciones").innerHTML = "";
    document.getElementById("buscador").value = "";
    return;
  }
  categoriaAbierta = categoria;
  listaActual = canciones.filter((c) => c.categoria === categoria);
  document.getElementById("buscador").value = "";
  mostrarCanciones(listaActual);
}
function mostrarCanciones(datos) {
  document.getElementById("listaCanciones").innerHTML = datos
    .map(
      (c) =>
        `<div class="cancion" onclick="seleccionar(${c.id})">${
          seleccion[c.categoria]?.id === c.id ? "✅ " : ""
        }${c.titulo}</div>`
    )
    .join("");
}
function seleccionar(id) {
  const c = canciones.find((x) => x.id === id);
  if (!c) return;
  seleccion[c.categoria] = c;
  guardarCelebracion();
  actualizarSeleccion();
  mostrarCanciones(listaActual);
}
function quitarCancion(cat) {
  delete seleccion[cat];
  guardarCelebracion();
  actualizarSeleccion();
  mostrarCanciones(listaActual);
}
function actualizarSeleccion() {
  document.getElementById("listaSeleccion").innerHTML = ordenLiturgico
    .map((cat) =>
      seleccion[cat]
        ? `<div class="itemSeleccion completo"><b>✅ ${cat}</b><br>${seleccion[cat].titulo}<br><br><button onclick="quitarCancion('${cat}')">❌ Quitar</button></div>`
        : `<div class="itemSeleccion incompleto"><b>⬜ ${cat}</b><br>Sin seleccionar</div>`
    )
    .join("");
}
function guardarCelebracion() {
  localStorage.setItem("celebracionActual", JSON.stringify(seleccion));
  window.dispatchEvent(
    new CustomEvent("celebracion-cambiada", {
      detail: Object.fromEntries(
        Object.entries(seleccion).map(([cat, c]) => [cat, c.id])
      ),
    })
  );
}
function aplicarSeleccionRemota(ids) {
  seleccion = {};
  for (const [cat, id] of Object.entries(ids || {})) {
    const c = canciones.find((x) => x.id === id && x.categoria === cat);
    if (c) seleccion[cat] = c;
  }
  localStorage.setItem("celebracionActual", JSON.stringify(seleccion));
  actualizarSeleccion();
  mostrarCanciones(listaActual);
}
window.aplicarSeleccionRemota = aplicarSeleccionRemota;
function nuevaCelebracion() {
  if (confirm("¿Borrar toda la celebración compartida?")) {
    seleccion = {};
    ordenCelebracion = [];
    indiceCelebracion = 0;
    guardarCelebracion();
    actualizarSeleccion();
    mostrarCanciones(listaActual);
  }
}
function buscar() {
  const t = document.getElementById("buscador").value.trim().toLowerCase();
  listaActual = canciones.filter((c) =>
    [c.titulo, c.autor, c.categoria].some((v) =>
      (v || "").toLowerCase().includes(t)
    )
  );
  mostrarCanciones(listaActual);
}
function iniciarCelebracion() {
  ordenCelebracion = ordenLiturgico
    .filter((cat) => seleccion[cat])
    .map((cat) => seleccion[cat]);
  if (!ordenCelebracion.length) {
    alert("Seleccione canciones");
    return;
  }
  indiceCelebracion = 0;
  mostrarCelebracion();
  document.getElementById("modoCelebracion").classList.remove("oculto");
  pantallaCompleta();
}
function mostrarCelebracion() {
  const c = ordenCelebracion[indiceCelebracion];
  if (!c) {
    cerrarCelebracion();
    return;
  }
  document.getElementById("tituloCelebracion").innerHTML = `${c.categoria} · ${
    c.titulo
  }<small>&nbsp; (${indiceCelebracion + 1} de ${
    ordenCelebracion.length
  })</small>`;
  const el = document.getElementById("letraCelebracion");
  el.innerText = c.letra;
  el.scrollTo({ top: 0, behavior: "smooth" });
}
function siguiente() {
  if (indiceCelebracion < ordenCelebracion.length - 1) {
    indiceCelebracion++;
    mostrarCelebracion();
  }
}
function anterior() {
  if (indiceCelebracion > 0) {
    indiceCelebracion--;
    mostrarCelebracion();
  }
}
function cerrarCelebracion() {
  document.getElementById("modoCelebracion").classList.add("oculto");
  if (document.fullscreenElement) document.exitFullscreen();
}
function pantallaCompleta() {
  if (!document.fullscreenElement)
    document.documentElement.requestFullscreen().catch(console.log);
  else document.exitFullscreen();
}
const guardado = localStorage.getItem("celebracionActual");
if (guardado) {
  try {
    const d = JSON.parse(guardado);
    for (const cat of ordenLiturgico) {
      const c = d?.[cat];
      if (c && canciones.some((x) => x.id === c.id && x.categoria === cat))
        seleccion[cat] = c;
    }
  } catch (e) {
    localStorage.removeItem("celebracionActual");
  }
}
actualizarSeleccion();
