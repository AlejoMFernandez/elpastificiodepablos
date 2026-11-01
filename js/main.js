// El Pastificio de Pablos · demo — Alejo Martín Fernández
import { initKit } from '../kit/kit.js?v=1';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const html = document.documentElement;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const MEITRE = 'https://elpastificiodepablos.meitre.com';
const WA = '5491144782365';
const TZ = 'America/Argentina/Buenos_Aires';
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const esCelu = () => matchMedia('(max-width: 899px)').matches;

// ---------------------------------------------------------------- intro
(function intro() {
  const t0 = performance.now();
  const listo = () => { html.classList.add('listo'); };
  if (!html.classList.contains('con-intro')) { requestAnimationFrame(listo); return; }
  requestAnimationFrame(() => html.classList.add('intro-play'));
  const celu = esCelu();
  const minimo = celu ? 1050 : 1350;                // dura lo que tarda en armarse el logo
  const heroImg = $('.arco img');
  const esperaImg = heroImg && !heroImg.complete ? new Promise(r => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); }) : Promise.resolve();
  const tope = new Promise(r => setTimeout(r, 2600));
  Promise.race([Promise.all([document.fonts?.ready, esperaImg]), tope]).then(() => {
    const falta = Math.max(0, minimo - (performance.now() - t0));
    setTimeout(() => {
      html.classList.add('intro-sale');
      setTimeout(listo, 220);
      setTimeout(() => { html.classList.remove('con-intro', 'intro-play'); $('#intro')?.remove(); }, 760);
    }, falta);
  });
})();

// ---------------------------------------------------------------- barra y menú
const barra = $('#barra');
const onScroll = () => barra.classList.toggle('solida', scrollY > 24);
addEventListener('scroll', onScroll, { passive: true }); onScroll();

const btnMenu = $('.barra__menu'), menu = $('#menu');
function cerrarMenu() { menu.hidden = true; btnMenu.setAttribute('aria-expanded', 'false'); btnMenu.setAttribute('aria-label', 'Abrir menú'); html.classList.remove('menu-abierto'); }
btnMenu.addEventListener('click', () => {
  const abrir = menu.hidden;
  if (!abrir) return cerrarMenu();
  menu.hidden = false; btnMenu.setAttribute('aria-expanded', 'true'); btnMenu.setAttribute('aria-label', 'Cerrar menú'); html.classList.add('menu-abierto');
});
menu.addEventListener('click', (e) => { if (e.target.closest('a')) cerrarMenu(); });
addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) cerrarMenu(); });
matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) cerrarMenu(); });

// ---------------------------------------------------------------- revelados
const io = new IntersectionObserver((ents) => ents.forEach(en => { if (en.isIntersecting) { en.target.classList.add('visto'); io.unobserve(en.target); } }), { threshold: 0.18, rootMargin: '0px 0px -40px 0px' });
function observar(root = document) {
  $$('.rev:not(.visto)', root).forEach(el => {
    if (!el.style.getPropertyValue('--rd')) {
      const hermanos = Array.from(el.parentElement.children).filter(x => x.classList.contains('rev'));
      el.style.setProperty('--rd', Math.min(hermanos.indexOf(el), 6));
    }
    io.observe(el);
  });
}
observar();

// ---------------------------------------------------------------- filas arrastrables con el mouse (con inercia)
function arrastrable(fila) {
  let x0 = 0, s0 = 0, movio = false, activo = false, vel = 0, ultX = 0, ultT = 0, raf = 0;
  fila.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0 || fila.scrollWidth <= fila.clientWidth + 2) return;
    cancelAnimationFrame(raf); activo = true; movio = false; x0 = ultX = e.clientX; s0 = fila.scrollLeft; vel = 0; ultT = performance.now();
  });
  addEventListener('pointermove', (e) => {
    if (!activo) return;
    const dx = e.clientX - x0;
    if (!movio && Math.abs(dx) > 5) { movio = true; fila.classList.add('arrastrando'); }
    if (!movio) return;
    e.preventDefault();
    fila.scrollLeft = s0 - dx;
    const now = performance.now(); const dt = Math.max(1, now - ultT);
    vel = 0.8 * ((ultX - e.clientX) / dt) + 0.2 * vel; ultX = e.clientX; ultT = now;
  }, { passive: false });
  const soltar = () => {
    if (!activo) return; activo = false;
    if (!movio) return;
    let v = vel * 16;
    const paso = () => {
      v *= 0.94; fila.scrollLeft += v;
      if (Math.abs(v) > 0.4) raf = requestAnimationFrame(paso);
      else fila.classList.remove('arrastrando');
    };
    raf = requestAnimationFrame(paso);
    const tapa = (ev) => { ev.preventDefault(); ev.stopPropagation(); };
    fila.addEventListener('click', tapa, { capture: true, once: true });
    setTimeout(() => fila.removeEventListener('click', tapa, { capture: true }), 60);
  };
  addEventListener('pointerup', soltar); addEventListener('pointercancel', soltar);
  fila.addEventListener('dragstart', (e) => e.preventDefault());
}
$$('.fila').forEach(arrastrable);

// ---------------------------------------------------------------- reloj del local
function ahora() {
  const p = {};
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
  const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday);
  return { dow, min: Number(p.hour) * 60 + Number(p.minute), hora: `${p.hour}:${p.minute}` };
}
const FRANJAS = [{ id: 'desayuno', a: 600, b: 720 }, { id: 'almuerzo', a: 720, b: 960 }, { id: 'merienda', a: 960, b: 1200 }, { id: 'cena', a: 1200, b: 1440 }];
function momento() {
  const q = new URLSearchParams(location.search).get('momento');
  const n = ahora();
  const fijo = { desayuno: 660, almuerzo: 780, merienda: 1020, cena: 1290 }[q];
  if (fijo != null) return { ...n, dow: n.dow === 2 || (n.dow === 1 && fijo < 960) ? 4 : n.dow, min: fijo, hora: `${String(Math.floor(fijo / 60)).padStart(2, '0')}:${String(fijo % 60).padStart(2, '0')}` };
  if (q === 'martes') return { ...n, dow: 2 };
  return n;
}
const abreDia = (dow) => dow === 2 ? null : dow === 1 ? 960 : 600;
function pintarReloj() {
  const m = momento();
  const sec = $('#ahora');
  const abre = abreDia(m.dow);
  const actual = abre != null && m.min >= abre ? FRANJAS.find(f => m.min >= f.a && m.min < f.b) : null;
  $$('[data-franja]').forEach(el => {
    const f = FRANJAS.find(x => x.id === el.dataset.franja);
    el.classList.toggle('es-ahora', actual?.id === f.id);
    el.classList.toggle('apagada', abre == null || f.b <= abre);
  });
  $$('[data-solo-mediodia]').forEach(li => li.classList.toggle('no-hoy', ![3, 4, 5].includes(m.dow)));
  $$('[data-solo-merezco]').forEach(li => li.classList.toggle('no-hoy', ![1, 3, 4, 0].includes(m.dow)));
  sec.classList.toggle('martes', m.dow === 2);
  const frase = $('[data-reloj-frase]');
  const dia = DIAS[m.dow];
  const quehacer = { desayuno: 'es hora de desayunar', almuerzo: 'es hora de almorzar', merienda: 'es hora de merendar', cena: 'es hora de cenar' };
  if (m.dow === 2) frase.textContent = 'Hoy es martes y El Pasti descansa. Mañana abrimos a las 10:00 hs con el desayuno.';
  else if (actual) frase.textContent = `Son las ${m.hora} hs de un ${dia}: ${quehacer[actual.id]}.`;
  else if (m.min < abre) frase.textContent = `Son las ${m.hora} hs de un ${dia}. Hoy abrimos a las ${abre === 960 ? '16:00' : '10:00'} hs.`;
  else frase.textContent = `Son las ${m.hora} hs: ya cerramos. Mañana te esperamos.`;
  // placas: cuál va hoy
  $('[data-placa="mediodia"]')?.classList.toggle('hoy-va', [3, 4, 5].includes(m.dow));
  $('[data-placa="merezco"]')?.classList.toggle('hoy-va', [1, 3, 4, 0].includes(m.dow));
  // horario de hoy
  $$('[data-horarios] li').forEach(li => li.classList.toggle('hoy', Number(li.dataset.dia) === m.dow));
  // estado del hero
  const est = $('[data-estado]'), txt = $('[data-estado-txt]');
  const abierto = abre != null && m.min >= abre;
  est.classList.toggle('abierto', abierto);
  if (abierto) txt.textContent = `Abierto ahora · hasta las 00:00 hs`;
  else if (abre != null) txt.textContent = `Hoy abrimos a las ${abre === 960 ? '16:00' : '10:00'} hs`;
  else txt.textContent = 'Hoy descansamos · mañana desde las 10:00 hs';
  return actual;
}
const franjaActual = pintarReloj();
setInterval(pintarReloj, 60_000);
// en el celu, la franja de ahora queda a la vista en la fila
if (franjaActual) {
  const fila = $('[data-franjas]'), card = $(`[data-franja="${franjaActual.id}"]`);
  const centrar = () => { if (esCelu() && fila.scrollWidth > fila.clientWidth) fila.scrollTo({ left: card.offsetLeft - fila.offsetLeft - 4, behavior: 'instant' }); };
  requestAnimationFrame(centrar);
}

// ---------------------------------------------------------------- kit
let kit;
const productos = new Map();
const GRUPOS = [
  { t: 'Menús de la semana', cats: ['mediodia', 'merezco'] },
  { t: 'Almuerzo y cena', cats: ['entradas', 'ensaladas', 'pastas', 'pizzas', 'sandwiches', 'coolkids', 'postres'] },
  { t: 'Desayunos y meriendas', cats: ['desayunos', 'pasteleria', 'tortas'] },
  { t: 'Barra y cava', cats: ['cafeteria', 'bebidas', 'vinos'] },
];
const FAMILIA = ['ajies-dominga', 'tagliatelle-amalia', 'campanelle-carmelo', 'tiramisu-marcela'];

function itemTemplate(p, ctx) {
  const precio = ctx.money(p.precio);
  const fam = FAMILIA.includes(p.id) || (p.etiquetas || []).includes('casa');
  const otros = (p.etiquetas || []).filter(x => x !== 'casa').map(ctx.etiquetaHTML).join('');
  return `${p.foto ? `<img class="kit-item__foto" src="${esc(ctx.asset(p.foto))}" alt="" width="64" height="64" loading="lazy" decoding="async">` : ''}
    <div class="kit-item__body">
      <h3 class="kit-item__name">${esc(p.nombre)}${fam ? '<span class="fam-tag">de la familia</span>' : ''}${otros}</h3>
      ${p.descripcion ? `<p class="kit-item__desc">${esc(p.descripcion)}</p>` : ''}
    </div>
    <div class="kit-item__side"><span class="kit-price">${precio ? esc(precio) : '<span class="kit-price--na">Consultar</span>'}</span></div>`;
}

function mejorarCarta(e) {
  const { el, productos: prods, categorias } = e.detail;
  prods.forEach(p => productos.set(p.id, p));
  const tabs = $('.kit-tabs', el);
  // índice agrupado (desktop)
  if (tabs) {
    GRUPOS.forEach(g => {
      const primero = g.cats.map(c => tabs.querySelector(`[data-cat="${c}"]`)).find(Boolean);
      if (primero) primero.insertAdjacentHTML('beforebegin', `<span class="idx-grupo" aria-hidden="true">${esc(g.t)}</span>`);
    });
  }
  const paneles = $$('.kit-carta__panel', el);
  const tabsBtn = $$('.kit-tab', el);
  paneles.forEach((panel, i) => {
    const catId = panel.querySelector('.kit-item')?.dataset.cat;
    const cat = categorias.find(c => c.id === catId) || {};
    const n = panel.querySelectorAll('.kit-item').length;
    panel.insertAdjacentHTML('afterbegin', `<div class="cp-head"><h3>${esc(cat.nombre || '')}</h3><p>${n} ${n === 1 ? 'opción' : 'opciones'}${cat.descripcion ? ` · ${esc(cat.descripcion)}` : ''}</p></div>`);
    const prev = tabsBtn[i - 1], next = tabsBtn[i + 1];
    panel.insertAdjacentHTML('beforeend', `<div class="cp-nav"><button type="button" data-ir="${i - 1}" ${prev ? '' : 'disabled'}>← ${esc(prev?.textContent || '')}</button><button type="button" data-ir="${i + 1}" ${next ? '' : 'disabled'}>${esc(next?.textContent || '')} →</button></div>`);
    $$('.kit-item', panel).forEach(it => { if (productos.get(it.dataset.id)?.foto) it.classList.add('con-foto'); });
  });
  // precios del Menú me lo merezco desde la carta (si el dueño los cambia, cambian acá)
  const lista = $('[data-merezco]');
  if (lista && kit) {
    const ids = ['merezco-1', 'merezco-2', 'merezco-3']; const etiquetas = ['Pasta + agua libre', '+ copa de vino', '+ postre y café'];
    const items = ids.map((id, i) => ({ p: productos.get(id), lbl: etiquetas[i] })).filter(x => x.p && x.p.disponible !== false);
    if (items.length) lista.innerHTML = items.map(x => `<li><span>${esc(x.lbl)}</span><b>${esc(kit.money(x.p.precio) || 'Consultar')}</b></li>`).join('');
  }
  pintarFamilia();
  requestAnimationFrame(() => centrarTab(el));
}

function irAPanel(el, i, scroll = true) {
  const tab = $$('.kit-tab', el)[i]; if (!tab) return;
  tab.click();
  if (scroll && esCelu()) {
    const y = el.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(html).getPropertyValue('--barra')) || 64) - 6;
    scrollTo({ top: y, behavior: 'smooth' });
  }
}
function centrarTab(el) {
  const tabs = $('.kit-tabs', el), on = $('.kit-tab.is-on', el);
  if (tabs && on && esCelu()) tabs.scrollTo({ left: on.offsetLeft - 24, behavior: 'smooth' });
}

function verEnCarta(id) {
  const p = productos.get(id); const el = $('.carta__kit'); if (!p || !el) return;
  const tab = $(`.kit-tab[data-cat="${p.categoria}"]`, el); tab?.click(); centrarTab(el);
  const it = $(`.kit-item[data-id="${id}"]`, el); if (!it) return;
  const y = it.getBoundingClientRect().top + scrollY - window.innerHeight * 0.35;
  scrollTo({ top: y, behavior: 'smooth' });
  it.classList.remove('destello'); void it.offsetWidth; it.classList.add('destello');
  if (!esCelu()) mostrarFoto(p);
}

// foto del plato en la polaroid fija (desktop)
const pol = $('[data-carta-foto]'), polImg = $('[data-carta-img]'), polCap = $('[data-carta-cap]');
let fotoActual = '', rafFoto = 0;
function mostrarFoto(p) {
  if (!p?.foto || !kit) return;
  const src = kit.asset(p.foto);
  if (src === fotoActual) return; fotoActual = src;
  pol.classList.add('cambia');
  const img = new Image(); img.src = src;
  img.decode().catch(() => {}).finally(() => { polImg.src = src; polCap.textContent = p.nombre.toLowerCase(); pol.classList.remove('cambia'); });
}
document.addEventListener('pointerover', (e) => {
  if (e.pointerType !== 'mouse') return;
  const it = e.target.closest?.('.carta__kit .kit-item.con-foto'); if (!it) return;
  cancelAnimationFrame(rafFoto); rafFoto = requestAnimationFrame(() => mostrarFoto(productos.get(it.dataset.id)));
});

document.addEventListener('click', (e) => {
  const ir = e.target.closest('.cp-nav [data-ir]');
  if (ir) { const el = ir.closest('.carta__kit'); irAPanel(el, Number(ir.dataset.ir)); setTimeout(() => centrarTab(el), 50); return; }
  if (e.target.closest('.carta__kit .kit-tab')) { setTimeout(() => centrarTab($('.carta__kit')), 30); }
});

// ---------------------------------------------------------------- familia
function pintarFamilia() {
  $$('[data-fam]').forEach(card => {
    const p = productos.get(card.dataset.fam); const dorso = $('[data-dorso]', card);
    if (!p || !kit) return;
    const foto = p.foto ? `<img class="dorso__foto" src="${esc(kit.asset(p.foto))}" alt="${esc(p.nombre)}" width="480" height="360" loading="lazy">` : `<span class="dorso__sinfoto"><img src="img/flor.svg" alt="" width="60" height="58"></span>`;
    dorso.innerHTML = `${foto}<span class="dorso__n">${esc(p.nombre)}</span><span class="dorso__d">${esc(p.descripcion || '')}</span>
      <span class="dorso__p"><span>${esc(kit.money(p.precio) || 'Consultar')}</span></span>
      <span class="dorso__acc"><a class="dorso__ver" href="#carta" data-ver="${esc(p.id)}">Verlo en la carta</a><button type="button" class="dorso__volver" data-volver>↺ volver</button></span>`;
    if (!$('.foto-fam__girar', card)) card.insertAdjacentHTML('afterbegin', `<button type="button" class="foto-fam__girar" aria-label="Dar vuelta la foto de ${esc(card.dataset.nombre)}: ${esc(p.nombre)}"></button>`);
  });
}
document.addEventListener('click', (e) => {
  const g = e.target.closest('.foto-fam__girar'); if (g) { const c = g.closest('.foto-fam'); c.classList.add('girada'); setTimeout(() => $('.dorso__ver', c)?.focus({ preventScroll: true }), 300); return; }
  const v = e.target.closest('[data-volver]'); if (v) { v.closest('.foto-fam').classList.remove('girada'); return; }
  const ver = e.target.closest('[data-ver]'); if (ver) { e.preventDefault(); verEnCarta(ver.dataset.ver); }
});

// ---------------------------------------------------------------- catas
const COPA = '<svg viewBox="0 0 16 22" aria-hidden="true"><path d="M2 1h12c0 6-2 9-6 9S2 7 2 1Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8 10v9M4 20.5h8" stroke="currentColor" stroke-width="1.6" fill="none" stroke-linecap="round"/></svg>';
async function pintarCatas() {
  const box = $('[data-tickets]'); if (!kit?.eventos) return;
  const evs = kit.eventos.proximos();
  if (!evs.length) { box.innerHTML = '<p class="tickets__cargando">Estamos armando la próxima. Seguinos en Instagram para enterarte primero.</p>'; return; }
  const filas = await Promise.all(evs.map(async (ev) => {
    let libres = ev.cupo;
    if (ev.reserva && kit.reservas) { try { const ts = await kit.reservas.turnos(ev.fecha, 1); const t = ts.find(x => x.hora === ev.hora); if (t) libres = t.libres; } catch (_) { /* nada */ } }
    return { ev, libres };
  }));
  box.innerHTML = filas.map(({ ev, libres }) => {
    const [y, mo, d] = ev.fecha.split('-').map(Number);
    const dow = new Date(Date.UTC(y, mo - 1, d)).getUTCDay();
    const tipo = (kit.config.eventosTipos || []).find(x => x.id === ev.tipo)?.nombre || 'Evento';
    const ocup = ev.cupo - libres; const llenas = Math.round(ocup / ev.cupo * 10);
    const copas = Array.from({ length: 10 }, (_, i) => `<span class="${i < llenas ? 'llena' : ''}" style="color:${i < llenas ? 'var(--vino)' : 'var(--ceniza)'}">${COPA.replace('fill="none" stroke', i < llenas ? 'fill="currentColor" stroke' : 'fill="none" stroke')}</span>`).join('');
    return `<article class="ticket ticket--${esc(ev.tipo)} rev">
      <span class="ticket__tipo">${esc(tipo)}</span>
      <div class="ticket__top">
        <div class="ticket__fecha"><b>${d}</b><span>${MESES[mo - 1]}</span></div>
        <div><p class="ticket__cuando">${DIAS[dow]} · ${esc(ev.hora)} hs</p><h3 class="ticket__t">${esc(ev.nombre)}</h3></div>
      </div>
      <div class="ticket__body">
        ${ev.descripcion ? `<p class="ticket__d">${esc(ev.descripcion)}</p>` : ''}
        ${ev.precio != null ? `<p class="ticket__precio">Cubierto ${esc(kit.money(ev.precio))}</p>` : ''}
        ${ev.reserva ? `<div class="copas" aria-label="Quedan ${libres} de ${ev.cupo} lugares">${copas}<span class="copas__txt">${libres > 0 ? `Quedan ${libres} lugares` : 'Completo'}</span></div>
          <button type="button" class="btn btn--verde btn--grande" data-cata="${esc(ev.fecha)}|${esc(ev.hora)}" ${libres > 0 ? '' : 'disabled'}>${libres > 0 ? 'Guardame un lugar' : 'Sin lugares'}</button>`
        : `<p class="ticket__libre">Sin reserva · por orden de llegada</p>`}
      </div>
    </article>`;
  }).join('');
  observar(box);
}
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cata]'); if (!b || !kit?.reservas) return;
  const [fecha, hora] = b.dataset.cata.split('|');
  kit.reservas.abrir({ fecha, hora, personas: 2 });
});
// confirmación con el sello de la nonna
document.addEventListener('kit:reserva-lista', (e) => {
  e.preventDefault();
  const { resumen, el } = e.detail;
  const txt = `Hola Pasti! Me anoté desde la web: ${resumen.servicio}, ${resumen.dia} a las ${resumen.hora}, ${resumen.personas}. A nombre de ${resumen.nombre}.`;
  el.innerHTML = `<div class="ok-cata">
    <div class="ok-cata__sello"><span>Aprobado<br>por la<br>nonna ✿</span></div>
    <h3>¡Te guardamos el lugar!</h3>
    <p>${esc(resumen.servicio)} · ${esc(resumen.dia)} a las ${esc(resumen.hora)} hs · ${esc(resumen.personas)}. Te escribimos por WhatsApp para confirmar.</p>
    <a class="btn btn--verde btn--grande" href="https://wa.me/${WA}?text=${encodeURIComponent(txt)}" target="_blank" rel="noopener">Avisar por WhatsApp</a>
  </div>`;
});
document.addEventListener('kit:eventos', () => pintarCatas());

// ---------------------------------------------------------------- arranque del kit
document.addEventListener('kit:carta', mejorarCarta);
initKit({
  config: 'cliente.json',
  carta: { template: itemTemplate, pedir: false },
  imagenes: { lqip: 'img/lqip.json' },
  badgeTexto: 'Probá el panel del dueño',
}).then((k) => { kit = k; window.kit = k; pintarFamilia(); pintarCatas(); productos.size && mejorarCartaPrecios(); })
  .catch((err) => { console.error('[demo] kit', err); $('[data-tickets]').innerHTML = '<p class="tickets__cargando">No pudimos cargar la agenda.</p>'; });

function mejorarCartaPrecios() {
  const lista = $('[data-merezco]'); if (!lista) return;
  const ids = ['merezco-1', 'merezco-2', 'merezco-3']; const etiquetas = ['Pasta + agua libre', '+ copa de vino', '+ postre y café'];
  const items = ids.map((id, i) => ({ p: productos.get(id), lbl: etiquetas[i] })).filter(x => x.p && x.p.disponible !== false);
  if (items.length) lista.innerHTML = items.map(x => `<li><span>${esc(x.lbl)}</span><b>${esc(kit.money(x.p.precio) || 'Consultar')}</b></li>`).join('');
}
export { MEITRE };
