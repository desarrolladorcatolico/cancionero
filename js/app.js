const cancionesRespaldo = canciones.slice();
let catalogoCanciones = cancionesRespaldo.slice();
const ordenLiturgico = ["Entrada","Perdon","Gloria","Antifona","Colecta","Ofertorio","Santo","Padre","Cordero","Comunion","ComunionII","Salida","Himno"];
let listaActual=[], seleccion={}, ordenCelebracion=[], indiceCelebracion=0, categoriaAbierta=null;

function cancionesActivas(){ return catalogoCanciones; }
function cargar(categoria){
  if(categoriaAbierta===categoria){categoriaAbierta=null;listaActual=[];document.getElementById("listaCanciones").innerHTML="";document.getElementById("buscador").value="";return;}
  categoriaAbierta=categoria;listaActual=cancionesActivas().filter(c=>c.categoria===categoria);document.getElementById("buscador").value="";mostrarCanciones(listaActual);
}
function mostrarCanciones(datos){document.getElementById("listaCanciones").innerHTML=datos.map(c=>`<div class="cancion" onclick="seleccionar(${c.id}, '${String(c.categoria).replace(/'/g,"\\'")}')">${seleccion[c.categoria]?.id===c.id?"✅ ":""}${c.titulo}</div>`).join("");}
function seleccionar(id,categoria){const c=cancionesActivas().find(x=>x.id===id&&(!categoria||x.categoria===categoria));if(!c)return;seleccion[c.categoria]=c;guardarCelebracion();actualizarSeleccion();mostrarCanciones(listaActual);}
function quitarCancion(cat){delete seleccion[cat];guardarCelebracion();actualizarSeleccion();mostrarCanciones(listaActual);}
function actualizarSeleccion(){document.getElementById("listaSeleccion").innerHTML=ordenLiturgico.map(cat=>seleccion[cat]?`<div class="itemSeleccion completo"><b>✅ ${cat}</b><br>${seleccion[cat].titulo}<br><br><button onclick="quitarCancion('${cat}')">❌ Quitar</button></div>`:`<div class="itemSeleccion incompleto"><b>⬜ ${cat}</b><br>Sin seleccionar</div>`).join("");}
function guardarCelebracion(){localStorage.setItem("celebracionActual",JSON.stringify(seleccion));window.dispatchEvent(new CustomEvent("celebracion-cambiada",{detail:Object.fromEntries(Object.entries(seleccion).map(([cat,c])=>[cat,c.id]))}));}
function aplicarSeleccionRemota(ids){seleccion={};for(const[cat,id]of Object.entries(ids||{})){const c=cancionesActivas().find(x=>x.id===id&&x.categoria===cat);if(c)seleccion[cat]=c;}localStorage.setItem("celebracionActual",JSON.stringify(seleccion));actualizarSeleccion();mostrarCanciones(listaActual);}
window.aplicarSeleccionRemota=aplicarSeleccionRemota;
function nuevaCelebracion(){if(confirm("¿Borrar toda la celebración compartida?")){seleccion={};ordenCelebracion=[];indiceCelebracion=0;guardarCelebracion();actualizarSeleccion();mostrarCanciones(listaActual);}}
function buscar(){const t=document.getElementById("buscador").value.trim().toLowerCase();listaActual=cancionesActivas().filter(c=>[c.titulo,c.autor,c.categoria].some(v=>(v||"").toLowerCase().includes(t)));mostrarCanciones(listaActual);}
function iniciarCelebracion(){ordenCelebracion=ordenLiturgico.filter(cat=>seleccion[cat]).map(cat=>seleccion[cat]);if(!ordenCelebracion.length){alert("Seleccione canciones");return;}indiceCelebracion=0;mostrarCelebracion();document.getElementById("modoCelebracion").classList.remove("oculto");pantallaCompleta();}
function mostrarCelebracion(){const c=ordenCelebracion[indiceCelebracion];if(!c){cerrarCelebracion();return;}document.getElementById("tituloCelebracion").innerHTML=`${c.categoria} · ${c.titulo}<small>&nbsp; (${indiceCelebracion+1} de ${ordenCelebracion.length})</small>`;const el=document.getElementById("letraCelebracion");el.innerText=c.letra;el.scrollTo({top:0,behavior:"smooth"});}
function siguiente(){if(indiceCelebracion<ordenCelebracion.length-1){indiceCelebracion++;mostrarCelebracion();}}
function anterior(){if(indiceCelebracion>0){indiceCelebracion--;mostrarCelebracion();}}
function cerrarCelebracion(){document.getElementById("modoCelebracion").classList.add("oculto");if(document.fullscreenElement)document.exitFullscreen();}
function pantallaCompleta(){if(!document.fullscreenElement)document.documentElement.requestFullscreen().catch(console.log);else document.exitFullscreen();}
function restaurarSeleccionLocal(){const guardado=localStorage.getItem("celebracionActual");if(!guardado)return;try{const d=JSON.parse(guardado);for(const cat of ordenLiturgico){const viejo=d?.[cat];if(!viejo)continue;const c=cancionesActivas().find(x=>x.id===viejo.id&&x.categoria===cat);if(c)seleccion[cat]=c;}}catch(e){localStorage.removeItem("celebracionActual");}}
window.addEventListener("catalogo-cargado",e=>{const nuevo=e.detail?.canciones;if(Array.isArray(nuevo)&&nuevo.length)catalogoCanciones=nuevo;else catalogoCanciones=cancionesRespaldo.slice();seleccion={};restaurarSeleccionLocal();if(categoriaAbierta){listaActual=cancionesActivas().filter(c=>c.categoria===categoriaAbierta);mostrarCanciones(listaActual);}actualizarSeleccion();console.log(`Catálogo cargado desde ${e.detail?.origen}: ${catalogoCanciones.length} entradas`);});
restaurarSeleccionLocal();actualizarSeleccion();
