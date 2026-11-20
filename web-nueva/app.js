/* Mason Natural · web nueva · interacción (maqueta navegable: no procesa pagos). */
(function () {
  const M = window.M, P = {}; M.productos.forEach(p => P[p.sku] = p);
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const money = x => 'S/ ' + x.toFixed(2);
  const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const SUS = 0.10, ENVIO = M.envioGratis;
  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d } catch (e) { return d } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } }
  };
  const lock = on => document.body.classList.toggle('lock', on);
  function toast(t) { let el = $('.toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2400) }

  /* ---------- carrito ---------- */
  let cart = store.get('mason_carrito', []).filter(i => P[i.sku]);
  const unit = i => P[i.sku].precio * (i.sus ? 1 - SUS : 1);
  const subtotal = () => cart.reduce((a, i) => a + unit(i) * i.q, 0);
  function save() { store.set('mason_carrito', cart); render() }
  function add(sku, q = 1, sus = 0, open = true) {
    const p = P[sku]; if (!p || !p.stock) return;
    const it = cart.find(i => i.sku === sku && i.sus === sus);
    it ? it.q += q : cart.push({ sku, q, sus }); save(); if (open) openCart(); else toast('Agregado al carrito');
  }
  function render() {
    const n = cart.reduce((a, i) => a + i.q, 0);
    $$('.cnt').forEach(c => c.textContent = n || '');
    const b = $('.cart .cb'), st = subtotal(), falta = Math.max(0, ENVIO - st);
    $('.cart .ch h3').textContent = `Tu carrito (${n})`;
    $('.ship span').innerHTML = falta > 0 ? `Te faltan <b>${money(falta)}</b> para el envío gratis en Lima Metropolitana` : 'Tienes <b>envío gratis</b> en Lima Metropolitana';
    $('.ship .bar i').style.width = Math.min(100, st / ENVIO * 100) + '%';
    $('.cart .tot b').textContent = money(st);
    $('.cart .cf .btn').toggleAttribute('disabled', !n);
    if (!n) { b.innerHTML = `<div class="empty"><p class="h3">Tu carrito está vacío</p><p class="mu sm" style="margin:10px 0 22px">Empieza por lo que más eligen nuestros clientes.</p><a class="btn" href="tienda.html#mas-vendidos">Ver más vendidos</a></div>`; return }
    b.innerHTML = cart.map((i, k) => { const p = P[i.sku]; return `<div class="ci"><a class="im" href="${p.url}"><img src="${p.img}" alt=""></a>
      <div><a class="n" href="${p.url}">${p.n}</a><div class="s">${p.pres}${p.dias ? ' · te dura ' + p.dias + ' días' : ''}</div>
      <div><span class="qty"><button data-q="${k}" data-d="-1" aria-label="Quitar uno">−</button><span>${i.q}</span><button data-q="${k}" data-d="1" aria-label="Agregar uno">+</button></span><button class="rm" data-rm="${k}">Quitar</button></div>
      <select class="subsel" data-sus="${k}"><option value="0"${i.sus ? '' : ' selected'}>Compra única</option><option value="1"${i.sus ? ' selected' : ''}>Suscripción · ${SUS * 100} % menos${p.dias ? ', cada ' + p.dias + ' días' : ''}</option></select></div>
      <div class="pr">${money(unit(i) * i.q)}${i.sus ? `<s>${money(p.precio * i.q)}</s>` : ''}</div></div>` }).join('') + comp();
  }
  function comp() {
    const en = new Set(cart.map(i => i.sku));
    for (const d of M.duplas) { const [a, c] = d; const o = en.has(a) && !en.has(c) ? c : en.has(c) && !en.has(a) ? a : null;
      if (o && P[o] && P[o].stock) { const p = P[o]; return `<div class="comp"><h4>Completa tu rutina</h4><div class="ci" style="border:0"><a class="im" href="${p.url}"><img src="${p.img}" alt=""></a><div><a class="n" href="${p.url}">${p.n}</a><div class="s">Dupla perfecta: ${d[3]}</div><button class="btn sm out" style="margin-top:10px" data-add="${o}" data-noopen>Agregar</button></div><div class="pr">${money(p.precio)}</div></div></div>` } }
    return '';
  }
  function openCart() { $('.cart').classList.add('on'); $('.ov').classList.add('on'); lock(true) }
  function closeAll() { $$('.cart,.srch,.mob,.ov,.pop,.chatp').forEach(e => e.classList.remove('on')); lock(false) }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-add],[data-q],[data-rm],[data-open],[data-close]'); if (!t) return;
    if (t.dataset.add) { e.preventDefault(); if (t.dataset.two) add(t.dataset.two, 1, 0, false); add(t.dataset.add, 1, 0, !t.hasAttribute('data-noopen')) }
    else if (t.dataset.q) { const i = cart[+t.dataset.q]; i.q += +t.dataset.d; if (i.q < 1) cart.splice(+t.dataset.q, 1); save() }
    else if (t.dataset.rm) { cart.splice(+t.dataset.rm, 1); save() }
    else if (t.dataset.open) { e.preventDefault(); const w = t.dataset.open; closeAll();
      if (w === 'cart') openCart();
      if (w === 'srch') { $('.srch').classList.add('on'); $('.ov').classList.add('on'); lock(true); setTimeout(() => $('.srch input').focus(), 250); srch('') }
      if (w === 'mob') { $('.mob').classList.add('on'); lock(true) }
      if (w === 'chat') $('.chatp').classList.add('on') }
    else if (t.dataset.close !== undefined) { e.preventDefault(); closeAll() }
  });
  document.addEventListener('change', e => { if (e.target.dataset.sus) { const i = cart[+e.target.dataset.sus]; i.sus = +e.target.value; save() } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll() });
  $('.ov').addEventListener('click', closeAll);

  /* ---------- cintillo ---------- */
  const cin = $$('.cin div'); let ci = 0;
  if (cin.length > 1) setInterval(() => { cin[ci].classList.remove('on'); ci = (ci + 1) % cin.length; cin[ci].classList.add('on') }, 4200);

  /* ---------- buscador ---------- */
  function buscar(q) {
    q = norm(q.trim()); if (!q) return [];
    const ws = q.split(/\s+/);
    return M.productos.map(p => { const h = norm(p.n + ' ' + p.pres + ' ' + p.k); let s = 0;
      for (const w of ws) { if (!h.includes(w)) return null; s += norm(p.n).startsWith(w) ? 3 : norm(p.n).includes(w) ? 2 : 1 }
      return [s + p.ped / 1e4, p] }).filter(Boolean).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  }
  const card = p => `<a class="sres" href="${p.url}"><img src="${p.img}" alt=""><div><div class="n">${p.n}</div><div class="p">${money(p.precio)} <span class="mu">· ${p.pres}</span></div></div></a>`;
  function srch(q) {
    const r = buscar(q), t = $('.srch .terms'), res = $('.srch .res'), all = $('.srch .all'), h = $('.srch .rh');
    if (!q.trim()) {
      t.innerHTML = M.populares.map(x => `<a href="buscar.html?q=${encodeURIComponent(x)}">${x}</a>`).join('');
      $('.srch .th5').textContent = 'Búsquedas populares'; h.textContent = 'Más vendidos';
      res.innerHTML = M.productos.slice(0, 8).map(card).join(''); all.style.display = 'none'; return;
    }
    const nq = norm(q.trim()), sug = new Set();
    M.populares.concat(M.productos.map(p => p.n)).forEach(x => { if (norm(x).includes(nq) && sug.size < 6) sug.add(x) });
    $('.srch .th5').textContent = 'Sugerencias';
    t.innerHTML = [...sug].map(x => { const i = norm(x).indexOf(nq); return `<a href="buscar.html?q=${encodeURIComponent(x)}">${x.slice(0, i)}<b>${x.slice(i, i + nq.length)}</b>${x.slice(i + nq.length)}</a>` }).join('') || '<span class="mu sm">Sin sugerencias</span>';
    h.textContent = r.length ? `Productos (${r.length})` : 'Productos';
    res.innerHTML = r.slice(0, 8).map(card).join('') || `<p class="mu">No encontramos «${q}». Prueba con «magnesio», «omega 3» o «colágeno».</p>`;
    all.style.display = r.length ? '' : 'none'; all.href = 'buscar.html?q=' + encodeURIComponent(q); all.textContent = `Ver todos los resultados para «${q}»`;
  }
  const si = $('.srch input');
  si.addEventListener('input', () => srch(si.value));
  si.addEventListener('keydown', e => { if (e.key === 'Enter' && si.value.trim()) location.href = 'buscar.html?q=' + encodeURIComponent(si.value.trim()) });

  /* ---------- pop-up (portada, una vez) ---------- */
  if (document.body.dataset.pop && !store.get('mason_pop', 0)) setTimeout(() => { if (!document.body.classList.contains('lock')) { $('.pop').classList.add('on'); store.set('mason_pop', 1) } }, 6500);

  /* ---------- chat ---------- */
  const cb = $('.chatp .b');
  if (cb) cb.addEventListener('click', e => { const b = e.target.closest('[data-r]'); if (!b) return;
    cb.insertAdjacentHTML('beforeend', `<div class="msg me">${b.textContent}</div><div class="msg">${M.chat[b.dataset.r]}</div>`); cb.scrollTop = 1e5 });

  /* ---------- rieles ---------- */
  $$('[data-rail]').forEach(w => { const r = $('.rail', w.parentElement.parentElement) || $('.rail');
    $$('button', w).forEach(b => b.addEventListener('click', () => r.scrollBy({ left: (b.dataset.d === '1' ? 1 : -1) * r.clientWidth * .8, behavior: 'smooth' }))) });

  /* ---------- slider ---------- */
  $$('.slider').forEach(s => { const sl = $('.sl', s), n = sl.children.length, d = $$('.dots button', s.parentElement); let i = 0;
    const go = k => { i = (k + n) % n; sl.style.transform = `translateX(-${i * 100}%)`; d.forEach((x, j) => x.classList.toggle('on', j === i)) };
    d.forEach((x, j) => x.addEventListener('click', () => go(j))); setInterval(() => go(i + 1), 5200) });

  /* ---------- Línea Ultra: el frasco gira ---------- */
  $$('.ul .stage').forEach(st => { const im = $$('img', st), v = $$('.views span', st.parentElement); let i = 0, t;
    const show = k => { i = k % im.length; im.forEach((x, j) => x.classList.toggle('on', j === i)); v.forEach((x, j) => x.classList.toggle('on', j === i)) };
    st.addEventListener('mouseenter', () => { t = setInterval(() => show(i + 1), 650) });
    st.addEventListener('mouseleave', () => { clearInterval(t); show(0) });
    st.addEventListener('mousemove', e => { const r = st.getBoundingClientRect(); clearInterval(t); show(Math.min(im.length - 1, Math.floor((e.clientX - r.left) / r.width * im.length))) });
    let x0 = null; st.addEventListener('touchstart', e => x0 = e.touches[0].clientX, { passive: true });
    st.addEventListener('touchend', e => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 25) show(i + (dx < 0 ? 1 : im.length - 1)); x0 = null }) });

  /* ---------- cuánto te dura ---------- */
  $$('.calc').forEach(c => { const s = $('select', c); const f = () => { const p = P[s.value];
    $('.out', c).innerHTML = `<img src="${p.img}" alt=""><div><div class="big">${p.dias}<small> días</small></div><div class="sm" style="margin-top:6px">${p.pres} · ${p.dosis}</div><div class="xs mu" style="margin-top:6px">Dosis tomada de la ficha técnica del producto.</div><button class="btn sm" style="margin-top:12px" data-add="${p.sku}">Agregar · ${money(p.precio)}</button></div>` };
    s.addEventListener('change', f); f() });

  /* ---------- listado ---------- */
  const lst = $('#listado');
  if (lst) {
    const cards = $$('.pc', lst), sel = $('#orden'), tit = $('#ltit'), sub = $('#lsub'), cr = $('#lcrumb');
    function apply() {
      const h = decodeURIComponent(location.hash.slice(1)) || 'todos';
      const o = M.objetivos.find(x => 'objetivo-' + x[0] === h);
      let vis = 0;
      cards.forEach(c => { const ok = h === 'todos' || h === 'mas-vendidos' || (o && c.dataset.objs.split(' ').includes(o[0])) || (h === 'nuevos' && c.dataset.nuevo);
        c.style.display = ok ? '' : 'none'; if (ok) vis++ });
      $$('.tools .chip').forEach(c => c.classList.toggle('on', c.getAttribute('href') === '#' + h));
      const T = { 'todos': ['Todos los productos', 'Vitaminas y suplementos Mason Natural, con la dosis y lo que dura cada frasco.'], 'mas-vendidos': ['Más vendidos', 'Ordenados por pedidos en la tienda online en 2026.'], 'nuevos': ['Línea Ultra', 'Nuestros productos más nuevos.'] };
      const tt = o ? [o[1], `Productos para ${o[1].toLowerCase()}.`] : (T[h] || T.todos);
      tit.textContent = tt[0]; sub.textContent = `${tt[1]} ${vis} productos.`; cr.textContent = tt[0];
      if (h === 'mas-vendidos') sel.value = 'ped'; sort();
    }
    function sort() { const k = sel.value; cards.slice().sort((a, b) => k === 'asc' ? a.dataset.p - b.dataset.p : k === 'desc' ? b.dataset.p - a.dataset.p : b.dataset.ped - a.dataset.ped).forEach(c => lst.appendChild(c)) }
    sel.addEventListener('change', sort); addEventListener('hashchange', apply); apply();
  }

  /* ---------- resultados de búsqueda ---------- */
  const br = $('#bres');
  if (br) { const q = new URLSearchParams(location.search).get('q') || ''; const r = buscar(q); $('#bq').value = q;
    $('#btit').textContent = q ? `Resultados para «${q}»` : 'Buscar';
    $('#bsub').textContent = q ? `${r.length} productos` : 'Escribe qué buscas';
    br.innerHTML = r.map(p => $('#tpl-' + p.sku).innerHTML).join('') || (q ? `<p class="mu">No encontramos «${q}». Revisa la ortografía o prueba con el nombre del nutriente.</p>` : '') }

  /* ---------- ficha de producto ---------- */
  const buy = $('.buy');
  if (buy) {
    const sku = buy.dataset.sku; let q = 1;
    $$('.gal .th button').forEach(b => b.addEventListener('click', () => { $('.gal .main img').src = b.dataset.src; $$('.gal .th button').forEach(x => x.classList.toggle('on', x === b)) }));
    $$('.opt', buy).forEach(o => o.addEventListener('click', () => { $$('.opt', buy).forEach(x => x.classList.toggle('on', x === o)); $('input', o).checked = true; upd() }));
    const qv = $('.addrow .qty span', buy);
    $$('.addrow .qty button', buy).forEach(b => b.addEventListener('click', () => { q = Math.max(1, q + +b.dataset.d); qv.textContent = q; upd() }));
    function upd() { const sus = +$('input[name=modo]:checked', buy).value; $('#addbtn').textContent = `Agregar al carrito · ${money(P[sku].precio * (sus ? 1 - SUS : 1) * q)}` }
    $('#addbtn').addEventListener('click', () => add(sku, q, +$('input[name=modo]:checked', buy).value));
    const sk = $('.stick'); if (sk) new IntersectionObserver(([e]) => sk.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0)).observe($('#addbtn'));
    if ($('#addbtn')) upd();
  }

  /* ---------- Arma tu plan ---------- */
  const qz = $('.quiz');
  if (qz) {
    const st = { para: null, objs: [], toma: null }; let paso = 0;
    const pasos = $$('.qpaso', qz), marcas = $$('.steps div', qz);
    function ver(k) { paso = k; pasos.forEach((p, i) => p.hidden = i !== k); marcas.forEach((m, i) => { m.className = i < k ? 'dn' : i === k ? 'on' : '' }); if (k === 3) plan(); qz.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
    $$('[data-k]', qz).forEach(b => b.addEventListener('click', () => { const k = b.dataset.k, v = b.dataset.v;
      if (k === 'objs') { const i = st.objs.indexOf(v); i >= 0 ? st.objs.splice(i, 1) : st.objs.length < 2 && st.objs.push(v); $$('[data-k=objs]', qz).forEach(x => x.classList.toggle('on', st.objs.includes(x.dataset.v))) }
      else { st[k] = v; $$(`[data-k=${k}]`, qz).forEach(x => x.classList.toggle('on', x === b)) }
      $$('[data-next]', qz).forEach(n => n.toggleAttribute('disabled', !listo(+n.dataset.next))) }));
    const listo = k => k === 1 ? !!st.para : k === 2 ? st.objs.length > 0 : k === 3 ? !!st.toma : true;
    $$('[data-next]', qz).forEach(n => n.addEventListener('click', () => listo(+n.dataset.next) && ver(+n.dataset.next)));
    $$('[data-back]', qz).forEach(n => n.addEventListener('click', () => ver(paso - 1)));
    function plan() {
      const sel = [];
      st.objs.forEach(o => { const ps = M.productos.filter(p => p.objs.includes(o) && p.stock && !sel.find(s => s.p.sku === p.sku)).slice(0, 2);
        const ob = M.objetivos.find(x => x[0] === o); ps.forEach((p, i) => sel.push({ p, why: i === 0 ? `El más elegido para ${ob[1].toLowerCase()}` : `También para ${ob[1].toLowerCase()}` })) });
      const tot = sel.reduce((a, s) => a + s.p.precio, 0);
      $('.planr', qz).innerHTML = sel.map(s => `<div class="it"><img src="${s.p.img}" alt=""><div><a href="${s.p.url}" style="font-weight:500">${s.p.n}</a><div class="why">${s.why} · ${s.p.dosis.split(',')[0]} · te dura ${s.p.dias} días</div></div><b style="font-weight:500">${money(s.p.precio)}</b></div>`).join('');
      $('#ptot').textContent = money(tot);
      $('#pnota').textContent = st.toma === 'si' ? 'Como ya tomas otros suplementos, te recomendamos revisar tu plan con nuestro equipo de nutrición antes de empezar.' : 'Si tienes alguna condición de salud, estás embarazada o tomas medicación, revisa tu plan con nuestro equipo de nutrición.';
      $('#paddall').onclick = () => { sel.forEach(s => add(s.p.sku, 1, 0, false)); openCart() };
    }
    ver(0);
  }

  /* ---------- checkout ---------- */
  const co = $('#cosum');
  if (co) {
    const st = subtotal(), env = st >= ENVIO ? 0 : 10;
    co.innerHTML = cart.length ? cart.map(i => { const p = P[i.sku]; return `<div class="ci" style="grid-template-columns:60px 1fr auto;padding:12px 0"><div class="im" style="height:70px"><img src="${p.img}" style="height:60px" alt=""></div><div><div class="n" style="font-size:14px">${p.n} × ${i.q}</div><div class="s">${i.sus ? 'Suscripción' : 'Compra única'}</div></div><div class="pr" style="font-size:14px">${money(unit(i) * i.q)}</div></div>` }).join('') +
      `<div style="display:flex;justify-content:space-between;margin-top:14px"><span>Subtotal</span><span>${money(st)}</span></div><div style="display:flex;justify-content:space-between;margin-top:6px" class="mu"><span>Envío (Lima Metropolitana)</span><span>${env ? 'según distrito' : 'Gratis'}</span></div><div style="display:flex;justify-content:space-between;margin-top:14px;font-size:19px;font-weight:500"><span>Total</span><span>${money(st)}</span></div>`
      : '<p class="mu">Tu carrito está vacío. <a class="lnk" href="tienda.html">Ver productos</a></p>';
    $('#cofrm').addEventListener('submit', e => { e.preventDefault(); toast('Esta es una maqueta: aquí no se procesa ningún pago') });
  }

  /* ---------- aparición suave ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' });
  $$('.fade').forEach(e => io.observe(e));
  render();
})();
