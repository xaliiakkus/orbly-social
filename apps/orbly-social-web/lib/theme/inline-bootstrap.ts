/** İlk paint öncesi tema — FOUC azaltır (zustand persist ile uyumlu) */
export const THEME_INLINE_BOOTSTRAP = `
(function(){
  try {
    var raw = localStorage.getItem('orbly-theme-v1');
    if (!raw) return;
    var data = JSON.parse(raw);
    var s = data.state || data;
    var presets = {
      'orbly-dark':{bg:'#000',accent:'#1d9bf0',text:'#e7e9ea',scheme:'dark'},
      ocean:{bg:'#020617',accent:'#0ea5e9',text:'#e7e9ea',scheme:'dark'},
      sunset:{bg:'#0c0a09',accent:'#f97316',text:'#e7e9ea',scheme:'dark'},
      forest:{bg:'#052e16',accent:'#22c55e',text:'#e7e9ea',scheme:'dark'},
      rose:{bg:'#1a0a0f',accent:'#f43f5e',text:'#e7e9ea',scheme:'dark'},
      violet:{bg:'#0f0a1a',accent:'#8b5cf6',text:'#e7e9ea',scheme:'dark'},
      light:{bg:'#fff',accent:'#1d9bf0',text:'#0f1419',scheme:'light'}
    };
    var p = presets[s.presetId] || presets['orbly-dark'];
    var accent = s.accentOverride || p.accent;
    var r = document.documentElement;
    r.style.setProperty('--color-bg-primary', p.bg);
    r.style.setProperty('--color-text-primary', p.text);
    r.style.setProperty('--color-accent', accent);
    r.style.colorScheme = p.scheme;
    if (s.reduceMotion) r.classList.add('reduce-motion');
  } catch (e) {}
})();
`;
