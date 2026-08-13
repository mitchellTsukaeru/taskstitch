const ANIMATION_DURATION_MS = 4000;

const STYLES = `
  :host {
    position: fixed;
    inset: 0;
    z-index: 2147483646;
    pointer-events: none;
  }

  .wrap {
    position: absolute;
    inset: 0;
    background: rgba(15, 14, 42, 0.78);
    -webkit-backdrop-filter: blur(2px);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: show ${ANIMATION_DURATION_MS}ms ease forwards;
  }

  @keyframes show {
    0% { opacity: 0; }
    8% { opacity: 1; }
    75% { opacity: 1; }
    100% { opacity: 0; }
  }

  .logo-wrap {
    position: relative;
    width: clamp(128px, 18vw, 210px);
    aspect-ratio: 1;
    filter: drop-shadow(0 18px 30px rgba(8, 7, 30, 0.35));
  }

  .logo-wrap::before {
    content: '';
    position: absolute;
    inset: 12%;
    border-radius: 36%;
    background: rgba(199, 210, 254, 0.09);
    transform: rotate(45deg) scale(0.7);
    animation: aura 2.8s ease-out 0.2s both;
  }

  .logo-mark {
    position: relative;
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
    animation: mark-enter 700ms cubic-bezier(0.22, 1, 0.36, 1) 120ms both;
  }

  .stitch-track,
  .stitch-line {
    fill: none;
    stroke-linecap: round;
    stroke-width: 12;
  }

  .stitch-track {
    stroke: #3730A3;
    opacity: 0.55;
  }

  .stitch-line {
    stroke: #38BDF8;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: stitch-line 1.8s cubic-bezier(0.65, 0, 0.35, 1) 550ms forwards;
  }

  .logo-node {
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: node-arrive 480ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  .node-one { animation-delay: 300ms; }
  .node-two { animation-delay: 1150ms; }
  .node-three { animation-delay: 1950ms; }

  .node-face {
    fill: #1E1B4B;
    stroke: #4F46E5;
    stroke-width: 5;
  }

  .node-glyph {
    fill: none;
    stroke: #C7D2FE;
    stroke-width: 6;
    stroke-linecap: round;
    opacity: 0;
    animation: glyph-appear 280ms ease-out forwards;
  }

  .glyph-one { animation-delay: 650ms; }
  .glyph-two { animation-delay: 1500ms; }
  .glyph-three {
    stroke-linejoin: round;
    stroke-dasharray: 1;
    stroke-dashoffset: 1;
    animation: check-draw 420ms ease-out 2300ms forwards;
  }

  @keyframes mark-enter {
    from { opacity: 0; transform: scale(0.82) rotate(-4deg); }
    to { opacity: 1; transform: scale(1) rotate(0); }
  }

  @keyframes stitch-line {
    to { stroke-dashoffset: 0; }
  }

  @keyframes node-arrive {
    0% { opacity: 0; transform: scale(0.45) rotate(-10deg); }
    65% { opacity: 1; transform: scale(1.08) rotate(2deg); }
    100% { opacity: 1; transform: scale(1) rotate(0); }
  }

  @keyframes glyph-appear {
    from { opacity: 0; transform: translateY(3px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes check-draw {
    0% { opacity: 1; stroke-dashoffset: 1; }
    100% { opacity: 1; stroke-dashoffset: 0; }
  }

  @keyframes aura {
    0% { opacity: 0; transform: rotate(45deg) scale(0.55); }
    45% { opacity: 1; }
    100% { opacity: 0.45; transform: rotate(45deg) scale(1); }
  }

  @media (prefers-reduced-motion: reduce) {
    .wrap { animation-duration: 600ms; }
    .logo-wrap::before,
    .logo-mark,
    .stitch-line,
    .logo-node,
    .node-glyph {
      animation: none;
    }
    .logo-mark,
    .logo-node,
    .node-glyph { opacity: 1; }
    .stitch-line,
    .glyph-three { stroke-dashoffset: 0; }
  }
`;

function buildLogoSVG(): string {
  return `<svg class="logo-mark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" aria-hidden="true">
    <path class="stitch-track" d="M52 52 C82 52 72 100 100 100 C128 100 118 148 148 148" pathLength="1"/>
    <path class="stitch-line" d="M52 52 C82 52 72 100 100 100 C128 100 118 148 148 148" pathLength="1"/>
    <g class="logo-node node-one">
      <rect class="node-face" x="32" y="32" width="40" height="40" rx="11"/>
      <path class="node-glyph glyph-one" d="M44 48 H60 M44 58 H55"/>
    </g>
    <g class="logo-node node-two">
      <rect class="node-face" x="80" y="80" width="40" height="40" rx="11"/>
      <path class="node-glyph glyph-two" d="M92 96 H108 M92 106 H103"/>
    </g>
    <g class="logo-node node-three">
      <rect class="node-face" x="128" y="128" width="40" height="40" rx="11"/>
      <path class="node-glyph glyph-three" d="M140 144 L147 151 L158 139" pathLength="1"/>
    </g>
  </svg>`;
}

export function showStartNotification(): Promise<void> {
  return new Promise((resolve) => {
    const host = document.createElement('mimik-notification');
    host.setAttribute('data-mimik-ignore', '');
    const shadow = host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = STYLES;
    shadow.appendChild(style);

    const wrap = document.createElement('div');
    wrap.className = 'wrap';
    wrap.setAttribute('role', 'status');
    wrap.setAttribute('aria-label', 'TaskStitch capture starting');

    const logoWrap = document.createElement('div');
    logoWrap.className = 'logo-wrap';
    logoWrap.innerHTML = buildLogoSVG();

    wrap.appendChild(logoWrap);
    shadow.appendChild(wrap);
    document.documentElement.appendChild(host);

    wrap.addEventListener('animationend', (event) => {
      if (event.target !== wrap) return;
      host.remove();
      resolve();
    });
  });
}
