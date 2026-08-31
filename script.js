/* =========================================================
   Taberna dos Nerds — comportamento da landing
   ========================================================= */
(function () {
  'use strict';

  var semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* -------------------------------------------------------
     1. Logo: usa assets/logo.png quando existir;
        senao mantem a versao vetorial (SVG) da placa
     ------------------------------------------------------- */
  var logo = document.getElementById('logo');
  var logoPic = document.getElementById('logo-png');
  var logoSvg = document.getElementById('logo-svg');

  function usaPng() {
    if (!logoPic || !logoSvg) return;
    // SVGElement nao tem a propriedade .hidden — precisa do atributo
    logoSvg.setAttribute('hidden', '');
    logoPic.hidden = false;
  }

  if (logo && logoPic && logoSvg) {
    if (logo.complete && logo.naturalWidth > 0) {
      usaPng();
    } else {
      logo.addEventListener('load', usaPng);
    }
  }

  /* -------------------------------------------------------
     2. Meta Pixel: evento de clique nos grupos
     ------------------------------------------------------- */
  document.querySelectorAll('[data-cta]').forEach(function (el) {
    el.addEventListener('click', function () {
      if (typeof window.fbq !== 'function') return;
      window.fbq('track', el.dataset.evento || 'Lead', {
        content_name: el.dataset.grupo,
        content_category: el.dataset.evento ? 'apoio-adm' : 'grupo-facebook',
        source: el.dataset.cta
      });
    });
  });

  /* -------------------------------------------------------
     2b. Aviso de cookies (LGPD) — trava o Pixel
     ------------------------------------------------------- */
  var COOKIE_CHAVE = 'tn-cookies';
  var aviso = document.getElementById('cookies');
  var btnAceitar = document.getElementById('cookies-aceitar');
  var btnRecusar = document.getElementById('cookies-recusar');
  var btnGerenciar = document.getElementById('cookies-gerenciar');

  function leConsentimento() {
    try { return localStorage.getItem(COOKIE_CHAVE); } catch (e) { return null; }
  }

  function salvaConsentimento(valor) {
    try { localStorage.setItem(COOKIE_CHAVE, valor); } catch (e) {}
  }

  function mostraAviso(aberto, focar) {
    if (!aviso) return;
    aviso.hidden = !aberto;
    document.body.classList.toggle('cookies-aberto', aberto);
    if (aberto && focar && btnAceitar) btnAceitar.focus();
  }

  function decide(valor) {
    var anterior = leConsentimento();
    salvaConsentimento(valor);
    mostraAviso(false);
    if (valor === 'aceito' && typeof window.tnCarregaPixel === 'function') {
      window.tnCarregaPixel();
    } else if (valor === 'recusado' && anterior === 'aceito') {
      location.reload();
    }
  }

  if (btnAceitar) btnAceitar.addEventListener('click', function () { decide('aceito'); });
  if (btnRecusar) btnRecusar.addEventListener('click', function () { decide('recusado'); });
  if (btnGerenciar) {
    btnGerenciar.addEventListener('click', function () { mostraAviso(true, true); });
  }

  if (!leConsentimento()) mostraAviso(true);

  /* -------------------------------------------------------
     3. Barra fixa de CTA: aparece quando o botao do hero sai da tela
     ------------------------------------------------------- */
  var barra = document.getElementById('barra');
  var btnHero = document.querySelector('.hero .btn');

  var obsBarra;
  if (barra && btnHero && 'IntersectionObserver' in window) {
    obsBarra = new IntersectionObserver(function (entradas) {
      barra.classList.toggle('visivel', !entradas[0].isIntersecting);
    }, { threshold: 0 });
    obsBarra.observe(btnHero);
  }

  /* -------------------------------------------------------
     4. Revelação no scroll
     ------------------------------------------------------- */
  var alvos = document.querySelectorAll(
    '.eyebrow, .titulo, .lead, .prova, .hero .btn, .hero .passo, .selo, .chips, .secao, .mesas__nota, .prato, .mesa, .adm__nota, .redes, .apoio, .final__titulo, .final .btn, .final .passo'
  );

  if (semMovimento || !('IntersectionObserver' in window)) {
    // sem animação: conteúdo já visível (CSS padrão)
  } else {
    alvos.forEach(function (el, i) {
      el.classList.add('reveal');
      el.style.transitionDelay = (Math.min(i, 6) * 55) + 'ms';
    });

    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visivel');
        obs.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    alvos.forEach(function (el) { obs.observe(el); });
  }

  /* -------------------------------------------------------
     5. Fagulhas subindo (fundo da taberna)
     ------------------------------------------------------- */
  var canvas = document.getElementById('brasas');
  if (!canvas || semMovimento) return;

  var ctx = canvas.getContext('2d');
  var cores = ['#F4622A', '#FFC53D', '#D62828', '#2BA6E0'];
  var fagulhas = [];
  var L = 0, A = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);

  function dimensiona() {
    L = window.innerWidth;
    A = window.innerHeight;
    canvas.width = L * dpr;
    canvas.height = A * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var alvo = L < 640 ? 22 : 40;
    fagulhas = [];
    for (var i = 0; i < alvo; i++) fagulhas.push(nova(true));
  }

  function nova(inicial) {
    return {
      x: Math.random() * L,
      y: inicial ? Math.random() * A : A + 12,
      r: Math.random() * 1.8 + 0.6,
      vy: Math.random() * 0.42 + 0.14,
      deriva: (Math.random() - 0.5) * 0.28,
      fase: Math.random() * Math.PI * 2,
      alfa: Math.random() * 0.45 + 0.18,
      cor: cores[(Math.random() * cores.length) | 0]
    };
  }

  function quadro(t) {
    ctx.clearRect(0, 0, L, A);
    for (var i = 0; i < fagulhas.length; i++) {
      var f = fagulhas[i];
      f.y -= f.vy;
      f.x += Math.sin(t / 1400 + f.fase) * f.deriva;

      if (f.y < -12) fagulhas[i] = nova(false);

      ctx.globalAlpha = f.alfa;
      ctx.fillStyle = f.cor;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(quadro);
  }

  var tempo;
  window.addEventListener('resize', function () {
    clearTimeout(tempo);
    tempo = setTimeout(dimensiona, 180);
  });

  dimensiona();
  requestAnimationFrame(quadro);
})();
