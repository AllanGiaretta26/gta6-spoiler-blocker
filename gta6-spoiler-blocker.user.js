// ==UserScript==
// @name         GTA 6 Spoiler Blocker
// @namespace    local.gta6-spoiler-blocker
// @version      1.1.0
// @description  Esconde cards, posts e vídeos que mencionam GTA 6 no YouTube, X/Twitter e Reddit.
// @match        *://*.youtube.com/*
// @match        *://x.com/*
// @match        *://*.x.com/*
// @match        *://twitter.com/*
// @match        *://*.twitter.com/*
// @match        *://*.reddit.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  // ===== Termos (edite à vontade) =====
  const TERMS = ['GTA 6', 'GTA6', 'GTA VI', 'GTAVI', 'Grand Theft Auto 6', 'Grand Theft Auto VI',
    'Vice City', 'Lucia', 'Jason Duval'];

  // ===== Seletores (mudam com frequência: edite aqui) =====
  // Player de Shorts (/shorts/): um único player reaproveitado; se bater, esconde, pausa e pula.
  const SHORTS_PLAYER = 'ytd-reel-video-renderer-cow, ytd-reel-video-renderer';
  const SHORTS_NEXT = '#navigation-button-down button';
  const SITES = {
    // yt-lockup-view-model, ytm-shorts-lockup-view-model-v2 e yt-official-card-view-model: layout novo, visto em nov/2026
    'youtube.com': 'ytd-rich-item-renderer, ytd-video-renderer, ytd-compact-video-renderer, ytd-reel-item-renderer, ' +
      'yt-lockup-view-model, ytm-shorts-lockup-view-model-v2, yt-official-card-view-model, ' + SHORTS_PLAYER,
    'x.com': '[data-testid="cellInnerDiv"]',
    'twitter.com': '[data-testid="cellInnerDiv"]',
    'reddit.com': 'shreddit-post',
  };

  const HID = 'data-gta-hidden'; // atributo, não classe: o YouTube reescreve o class do player de Shorts
  const MARK = 'data-gta-checked';

  const site = Object.keys(SITES).find(d => location.hostname === d || location.hostname.endsWith('.' + d));
  if (!site) return;
  const SEL = SITES[site];
  try { document.querySelector(SEL); } catch { return; } // seletor inválido: não faz nada

  // Uma RegExp só: escapa cada termo, espaço vira opcional ("GTA6" = "GTA 6"), \b nas pontas.
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const RE = new RegExp('\\b(?:' + TERMS.map(t => esc(t.trim()).replace(/\s+/g, '[\\s-]*')).join('|') + ')\\b', 'i');

  // O player de Shorts fica escondido até ser avaliado (o vídeo começa antes do título carregar).
  const unchecked = SHORTS_PLAYER.split(',').map(s => `${s.trim()}:not([${MARK}])`).join(',');
  GM_addStyle(`[${HID}],${unchecked}{display:none!important}`);

  const attrs = el => ['title', 'aria-label', 'alt', 'post-title'].map(a => el.getAttribute(a) || '').join(' ');
  const textOf = card => card.textContent + ' ' + attrs(card) + ' ' +
    [...card.querySelectorAll('[title],[aria-label],img[alt]')].map(attrs).join(' ');

  let navigating = false;
  const check = card => {
    const isShort = card.matches(SHORTS_PLAYER);
    if (isShort && navigating) return; // ainda trocando de short: mantém escondido
    // No player o texto interno demora a trocar; o título da aba (com as hashtags) é confiável.
    const hit = RE.test(isShort ? document.title : textOf(card));
    card.setAttribute(MARK, '');
    card.toggleAttribute(HID, hit); // toggle: YouTube recicla cards
    if (!isShort) return;
    card.querySelectorAll('video').forEach(v => {
      if (hit) v.pause();
      else if (held.delete(v)) v.play().catch(() => {}); // short limpo: devolve o play que seguramos
    });
    const next = hit && document.querySelector(SHORTS_NEXT);
    if (next) next.click();
  };

  // Vídeo dentro de player escondido não toca: o áudio também é spoiler.
  const held = new WeakSet();
  document.addEventListener('play', e => {
    if (e.target.closest(`[${HID}],${unchecked}`)) { held.add(e.target); e.target.pause(); }
  }, true);

  // Lote de 200 ms com janela fixa (não reinicia), para não travar em páginas que mutam sem parar.
  const pending = new Set();
  let timer = 0;
  const flush = () => { timer = 0; pending.forEach(check); pending.clear(); };
  const queue = card => { pending.add(card); timer ||= setTimeout(flush, 200); };
  const scan = force => document.querySelectorAll(SEL).forEach(c => (force || !c.hasAttribute(MARK)) && queue(c));

  new MutationObserver(muts => {
    for (const m of muts) for (const n of m.addedNodes) {
      const el = n.nodeType === 1 ? n : n.parentElement;
      // Conteúdo novo dentro de um card: reavalia o card e os cards que o contêm (podem ser aninhados).
      for (let c = el && el.closest(SEL); c; c = c.parentElement && c.parentElement.closest(SEL)) queue(c);
      if (n.nodeType === 1) n.querySelectorAll(SEL).forEach(queue);
    }
  }).observe(document.body, { childList: true, subtree: true });

  // Navegação interna do YouTube reaproveita os nós: esconde o player de Shorts já no início
  // (o vídeo novo toca antes do título mudar) e reavalia tudo no fim.
  window.addEventListener('yt-navigate-start', () => {
    navigating = true;
    document.querySelectorAll(SHORTS_PLAYER).forEach(r => r.setAttribute(HID, ""));
  });
  window.addEventListener('yt-navigate-finish', () => setTimeout(() => { // título do Short atualiza logo depois
    navigating = false;
    scan(true);
  }, 100));
  scan(false);
})();
