/* PRUEBA AUXILIAR - Modo Celebracion v2
   Para probar: agregar antes de </body> en index.html:
   <script src="js/modo-celebracion-v2.js"></script>
*/
(function(){
  'use strict';
  const MIN=22, MAX=56, STEP=2;
  const KEY='modoCelebracionFontSize';
  const modo=()=>document.getElementById('modoCelebracion');
  const letra=()=>document.getElementById('letraCelebracion');

  function sizeActual(){
    const guardado=parseInt(localStorage.getItem(KEY)||'',10);
    return Number.isFinite(guardado)?Math.max(MIN,Math.min(MAX,guardado)):(window.innerWidth<=640?32:36);
  }
  function aplicarSize(n){
    n=Math.max(MIN,Math.min(MAX,n));
    const m=modo(); if(!m)return;
    m.style.setProperty('--mc-font-size',n+'px');
    localStorage.setItem(KEY,String(n));
  }
  function irArriba(){
    requestAnimationFrame(()=>{
      const l=letra(); if(l)l.scrollTop=0;
      window.scrollTo(0,0);
    });
  }
  function preparar(){
    const m=modo(); if(!m)return;
    const nav=m.querySelector('.navegacion'); if(!nav)return;
    if(!document.getElementById('mcMenos')){
      const menos=document.createElement('button');
      menos.id='mcMenos'; menos.type='button'; menos.textContent='A−'; menos.title='Reducir letra';
      const mas=document.createElement('button');
      mas.id='mcMas'; mas.type='button'; mas.textContent='A+'; mas.title='Aumentar letra';
      const cerrar=[...nav.querySelectorAll('button')].find(b=>/Cerrar|Salir/i.test(b.textContent));
      nav.insertBefore(menos,cerrar||nav.lastElementChild);
      nav.insertBefore(mas,cerrar||nav.lastElementChild);
      menos.addEventListener('click',()=>aplicarSize(sizeActual()-STEP));
      mas.addEventListener('click',()=>aplicarSize(sizeActual()+STEP));
      if(cerrar){cerrar.setAttribute('aria-label','Salir del modo celebración');cerrar.title='Salir del modo celebración';}
    }
    aplicarSize(sizeActual());
  }
  function envolverCambio(nombre){
    const original=window[nombre];
    if(typeof original!=='function'||original.__mcV2)return;
    const envuelta=function(){const r=original.apply(this,arguments);irArriba();return r;};
    envuelta.__mcV2=true; window[nombre]=envuelta;
  }
  function instalar(){
    preparar();
    envolverCambio('iniciarCelebracion');
    envolverCambio('anterior');
    envolverCambio('siguiente');
    const m=modo();
    if(m){
      const obs=new MutationObserver(()=>{
        if(!m.classList.contains('oculto')){preparar();}
      });
      obs.observe(m,{attributes:true,childList:true,subtree:true});
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',instalar);
  else instalar();
})();
