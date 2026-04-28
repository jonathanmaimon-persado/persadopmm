/* Walkthrough v2 — high-fidelity Persado UI based on Figma reference.
   Total: 120s. 8 chapters. Cursor + captions + chapter HUD.
   Visual vocabulary: Proxima Nova, Persado blue (49,100,255), ink (0,25,102),
   white surfaces with rounded corners and subtle shadow, tag chips with
   hammer/shield icons, scoring circles, channel pills with icons. */

const { useState, useEffect, useMemo } = React;

// ── Tokens (sampled from METADATA.md) ───────────────────────────────────────
const C = {
  ink: 'rgb(0,25,102)', ink2: 'rgb(16,35,158)',
  blue: 'rgb(49,100,255)', blueDeep: 'rgb(10,69,238)',
  blue50: 'rgb(235,240,255)', blue25: 'rgb(245,247,255)', blue100: 'rgb(194,209,255)', blue80: 'rgb(173,198,255)',
  bg: 'rgb(250,250,250)', paper: 'rgb(255,255,255)',
  rule: 'rgb(217,217,217)', rule2: 'rgb(240,240,240)', rule3: 'rgb(191,191,191)',
  text: 'rgb(38,38,38)', text2: 'rgb(67,67,67)', muted: 'rgb(89,89,89)', muted2: 'rgb(140,140,140)',
  green: '#389e0d', greenBg: 'rgb(246,255,237)', greenBorder: '#b7eb8f',
  amber: '#d48806', amberBg: 'rgb(255,247,230)', amberBorder: '#ffd591',
  red: '#cf1322', redBg: '#fff1f0', redBorder: '#ffa39e',
  purple: '#722ed1', purpleBg: '#f9f0ff',
  emailHero: 'rgb(0,25,102)', emailHero2: 'rgb(16,35,158)',
};

const FONT = '"Proxima Nova","Inter",system-ui,sans-serif';
const MONO = '"JetBrains Mono",ui-monospace,monospace';

// ── Cursor ──────────────────────────────────────────────────────────────────
function Cursor({ x, y, clicking = false }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: 22, height: 22,
      pointerEvents: 'none', zIndex: 1000,
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
    }}>
      <svg viewBox="0 0 22 22" width="22" height="22">
        <path d="M3 2l13 8-6 1.5-2 6z" fill="#262626" stroke="#fff" strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
      {clicking && (
        <div style={{
          position: 'absolute', left: -10, top: -10,
          width: 42, height: 42, borderRadius: '50%',
          border: `2px solid ${C.blue}`,
          background: 'rgba(49,100,255,0.18)',
        }}/>
      )}
    </div>
  );
}

function AnimatedCursor({ path }) {
  const { localTime } = useSprite();
  let prev = path[0], next = path[path.length - 1];
  for (let i = 0; i < path.length - 1; i++) {
    if (localTime >= path[i].t && localTime <= path[i + 1].t) { prev = path[i]; next = path[i + 1]; break; }
    if (localTime > path[i + 1].t) prev = path[i + 1];
  }
  const span = next.t - prev.t;
  const t = span > 0 ? clamp((localTime - prev.t) / span, 0, 1) : 1;
  const eased = Easing.easeInOutCubic(t);
  const x = prev.x + (next.x - prev.x) * eased;
  const y = prev.y + (next.y - prev.y) * eased;
  const clicking = path.some(p => p.click && localTime >= p.t && localTime <= p.t + 0.3);
  return <Cursor x={x} y={y} clicking={clicking} />;
}

// ── Icons (hand-drawn from Persado iconset) ─────────────────────────────────
const Icon = {
  paperclip: (p = {}) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 16 16" fill="none">
      <path d="M11.5 6.5L6.5 11.5C5.4 12.6 3.6 12.6 2.5 11.5C1.4 10.4 1.4 8.6 2.5 7.5L8 2C8.7 1.3 9.8 1.3 10.5 2C11.2 2.7 11.2 3.8 10.5 4.5L5.5 9.5C5.2 9.8 4.8 9.8 4.5 9.5C4.2 9.2 4.2 8.8 4.5 8.5L8.5 4.5" stroke={p.color || '#fff'} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  upload: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 18 18" fill="none">
      <path d="M9 12V3M9 3L5 7M9 3L13 7M3 14H15" stroke={p.color || C.text} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  cloudUpload: (p = {}) => (
    <svg width={p.size || 36} height={p.size || 36} viewBox="0 0 36 36" fill="none">
      <path d="M11 25H8C5.2 25 3 22.8 3 20C3 17.5 4.8 15.5 7.2 15.1C7.7 11.4 10.9 8.5 14.7 8.5C17.7 8.5 20.4 10.4 21.4 13.1C21.9 13 22.4 13 23 13C26 13 28.5 15.5 28.5 18.5C28.5 18.7 28.5 18.8 28.5 19" stroke={C.blue} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 28V18M18 18L14 22M18 18L22 22" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  pdf: (p = {}) => (
    <svg width={p.size || 32} height={p.size || 32} viewBox="0 0 32 32" fill="none">
      <path d="M8 3H20L26 9V27C26 28.1 25.1 29 24 29H8C6.9 29 6 28.1 6 27V5C6 3.9 6.9 3 8 3Z" fill={C.red} fillOpacity="0.08" stroke={C.red} strokeWidth="1.4"/>
      <path d="M20 3V9H26" stroke={C.red} strokeWidth="1.4" strokeLinejoin="round"/>
      <text x="16" y="22" textAnchor="middle" fill={C.red} fontSize="7" fontWeight="700" fontFamily={FONT}>PDF</text>
    </svg>
  ),
  email: (p = {}) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3.5" width="12" height="9" rx="1.5" stroke={p.color || C.blue} strokeWidth="1.4"/>
      <path d="M2.5 4.5L8 8.5L13.5 4.5" stroke={p.color || C.blue} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
  webPage: (p = {}) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke={p.color || C.muted} strokeWidth="1.4"/>
      <path d="M2 6H14" stroke={p.color || C.muted} strokeWidth="1.4"/>
      <circle cx="3.8" cy="4.5" r="0.5" fill={p.color || C.muted}/>
      <circle cx="5.5" cy="4.5" r="0.5" fill={p.color || C.muted}/>
    </svg>
  ),
  facebook: (p = {}) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="2" fill="#1877F2"/>
      <path d="M9.5 14V9H11L11.3 7H9.5V5.7C9.5 5.2 9.7 4.7 10.5 4.7H11.4V3C11.4 3 10.6 2.9 9.9 2.9C8.4 2.9 7.5 3.8 7.5 5.4V7H6V9H7.5V14H9.5Z" fill="#fff"/>
    </svg>
  ),
  hammer: (p = {}) => (
    <svg width={p.size || 18} height={p.size || 18} viewBox="0 0 18 18" fill="none">
      <path d="M3 14L8 9L11 12L6 17L3 14Z" stroke={p.color || C.red} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M9 7L13 3L17 7L13 11L9 7Z" stroke={p.color || C.red} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M11 5L15 9" stroke={p.color || C.red} strokeWidth="1.4"/>
    </svg>
  ),
  doc: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <path d="M3 1.5H8L11 4.5V12C11 12.3 10.7 12.5 10.5 12.5H3C2.7 12.5 2.5 12.3 2.5 12V2C2.5 1.7 2.7 1.5 3 1.5Z" stroke={p.color || C.blue} strokeWidth="1.2"/>
      <path d="M8 1.5V4.5H11" stroke={p.color || C.blue} strokeWidth="1.2"/>
    </svg>
  ),
  picture: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2.5" width="11" height="9" rx="1" stroke={p.color || C.blue} strokeWidth="1.2"/>
      <circle cx="5" cy="6" r="1" fill={p.color || C.blue}/>
      <path d="M2 10L5.5 7L8 9L11 6L12.5 7.5" stroke={p.color || C.blue} strokeWidth="1.2" strokeLinejoin="round"/>
    </svg>
  ),
  template: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <rect x="1.5" y="2" width="11" height="10" rx="1" stroke={p.color || C.blue} strokeWidth="1.2"/>
      <path d="M1.5 5H12.5M5 5V12" stroke={p.color || C.blue} strokeWidth="1.2"/>
    </svg>
  ),
  arrowUp: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <path d="M7 11V3M7 3L3 7M7 3L11 7" stroke={p.color || '#fff'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  caretDown: (p = {}) => (
    <svg width={p.size || 10} height={p.size || 10} viewBox="0 0 10 10" fill="none">
      <path d="M2 4L5 7L8 4" stroke={p.color || C.muted} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  arrowLeft: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <path d="M9 3L5 7L9 11" stroke={p.color || C.ink} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  check: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <path d="M2 7.5L5.5 11L12 3.5" stroke={p.color || C.green} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  star: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <path d="M7 1L8.8 5L13 5.5L10 8.5L10.8 13L7 10.7L3.2 13L4 8.5L1 5.5L5.2 5L7 1Z" fill={p.color || C.purple} stroke={p.color || C.purple} strokeWidth="0.8" strokeLinejoin="round"/>
    </svg>
  ),
  sparkle: (p = {}) => (
    <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 16 16" fill="none">
      <path d="M8 1V5M8 11V15M1 8H5M11 8H15M3 3L5 5M11 11L13 13M13 3L11 5M3 13L5 11" stroke={p.color || C.purple} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  ),
  close: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 14 14" fill="none">
      <path d="M3 3L11 11M11 3L3 11" stroke={p.color || C.muted} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  ),
};

// ── Top app shell ───────────────────────────────────────────────────────────
function AppShell({ title, breadcrumbTrail, rightActions, children, sidebar }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg, fontFamily: FONT, display: 'flex' }}>
      {/* Side nav rail */}
      <div style={{ width: 64, background: C.paper, borderRight: `1px solid ${C.rule2}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: 24 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontFamily: MONO, fontSize: 18 }}>P</div>
        {[true, false, false, false].map((active, i) => (
          <div key={i} style={{
            width: 40, height: 40, borderRadius: 8,
            background: active ? C.blue50 : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: active ? C.blue : C.rule3 }}/>
          </div>
        ))}
      </div>
      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ height: 56, background: C.paper, borderBottom: `1px solid ${C.rule2}`, display: 'flex', alignItems: 'center', padding: '0 24px', gap: 12, flex: '0 0 56px' }}>
          {breadcrumbTrail && breadcrumbTrail.map((b, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span style={{ color: C.muted2, fontSize: 14 }}>/</span>}
              <span style={{ fontSize: 14, color: i === breadcrumbTrail.length - 1 ? C.ink : C.muted, fontWeight: i === breadcrumbTrail.length - 1 ? 600 : 400 }}>{b}</span>
            </React.Fragment>
          ))}
          <span style={{ flex: 1 }}/>
          {rightActions}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.rule, color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>WS</div>
        </div>
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {sidebar}
          <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>{children}</div>
        </div>
      </div>
    </div>
  );
}

// Composer chips with red badges
function ComposerChip({ icon, label, badge, active }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px',
      background: '#fff', border: `1px solid ${active ? C.blue : C.rule}`, borderRadius: 100,
      fontSize: 13, color: active ? C.blue : C.text, position: 'relative', fontWeight: 500,
    }}>
      {icon}
      {label}
      {badge != null && (
        <span style={{
          position: 'absolute', top: -6, right: -6,
          minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
          background: C.red, color: '#fff', fontSize: 11, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid #fff',
        }}>{badge}</span>
      )}
    </div>
  );
}

// Composer panel (left side)
function ComposerPanel({ project = 'Sapphire Reserve Q4', briefText, badges = [0, 0, 0], highlightAttach = false, brief2T = 0 }) {
  return (
    <div style={{
      width: 460, background: C.paper, borderRight: `1px solid ${C.rule2}`,
      padding: 24, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon.arrowLeft />
        <span style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>{project}</span>
        <Icon.caretDown />
      </div>
      <div style={{
        flex: '0 0 auto', borderRadius: 14, background: '#fff',
        border: `1px solid ${highlightAttach ? C.blue : C.blue100}`,
        padding: 18, position: 'relative',
        boxShadow: highlightAttach ? `0 0 0 5px ${C.blue50}` : 'none',
        transition: 'all 200ms',
      }}>
        <div style={{ minHeight: 96, fontSize: 14, color: briefText ? C.text : C.muted2, lineHeight: 1.5 }}>
          {briefText || 'Share your campaign details, goals, audience, key messages, and any content considerations.'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 15, background: C.blue,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: highlightAttach ? `scale(${1 + 0.08 * Math.sin(brief2T * 6)})` : 'scale(1)',
          }}>
            <Icon.paperclip color="#fff" />
          </div>
          <div style={{ width: 30, height: 30, borderRadius: 15, background: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.arrowUp color="#fff" />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <ComposerChip icon={<Icon.doc />} label="Content Brief" badge={badges[0] || null} />
        <ComposerChip icon={<Icon.picture />} label="Assets" badge={badges[1] || null} />
        <ComposerChip icon={<Icon.template />} label="Template" badge={badges[2] || null} />
      </div>
    </div>
  );
}

// Channel tabs
function ChannelTabs({ active = 0 }) {
  const items = [
    { lbl: 'Email', icon: <Icon.email color={active === 0 ? C.blue : C.muted} /> },
    { lbl: 'Web Page', icon: <Icon.webPage color={active === 1 ? C.blue : C.muted} /> },
    { lbl: 'Facebook/Instagram Ad', icon: <Icon.facebook /> },
  ];
  return (
    <div style={{ display: 'flex', gap: 0 }}>
      {items.map((it, i) => (
        <div key={i} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px',
          background: active === i ? C.blue50 : 'transparent',
          border: `1px solid ${active === i ? C.blue100 : 'transparent'}`,
          borderRadius: 8, marginRight: 8,
          fontSize: 14, color: active === i ? C.blue : C.muted, fontWeight: 500,
        }}>{it.icon}{it.lbl}</div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 1 — Composer / starting state (0–10s)
// ════════════════════════════════════════════════════════════════════════════
function Scene1() {
  const { localTime } = useSprite();
  const sceneT = localTime;
  const fadeIn = clamp(sceneT / 0.5, 0, 1);

  return (
    <div style={{ position: 'absolute', inset: 0, opacity: fadeIn }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'New campaign']}
        rightActions={
          <div style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.rule}`, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: C.text }}>
            <Icon.sparkle size={14} color={C.purple} /> Examples
          </div>
        }
        sidebar={<ComposerPanel highlightAttach={sceneT > 5} brief2T={sceneT} />}
      >
        {/* Empty Brief Outline state */}
        <div style={{ padding: '32px 40px' }}>
          <ChannelTabs active={0} />
          <div style={{ marginTop: 28, padding: '40px 36px', background: C.paper, borderRadius: 16, border: `1px solid ${C.rule2}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: C.ink, marginBottom: 8 }}>Brief Outline</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.55, marginBottom: 28 }}>
              A more complete brief leads to better results. Drop a brief in the composer or upload a document — Persado will detect and structure the fields automatically.
            </div>
            {/* Empty state placeholders for the structure */}
            {[
              { icon: '⊞', label: 'Campaign Overview', sub: ['Campaign Goal', 'Deliverables', 'Audience', 'Key Message'] },
              { icon: '✉', label: 'Email', sub: ['Subject Line', 'Preheader', 'Layout & Structure', 'Primary Link', 'Timing & Urgency'] },
            ].map((g, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: C.blue50, border: `1px solid ${C.blue100}`, borderRadius: 8, fontSize: 14, fontWeight: 600, color: C.ink }}>
                  <span style={{ color: C.blue, fontSize: 16 }}>{g.icon}</span> {g.label}
                </div>
                {g.sub.map((s, j) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px 12px 38px', borderBottom: `1px solid ${C.rule2}`, fontSize: 13, color: C.muted }}>
                    <span>{s}</span>
                    <span style={{ width: 84, height: 6, borderRadius: 3, background: C.rule2 }}/>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
      <AnimatedCursor path={[
        { t: 0, x: 960, y: 540 },
        { t: 2, x: 1100, y: 480 },
        { t: 4, x: 600, y: 450 },
        { t: 6, x: 175, y: 410 },
        { t: 8.5, x: 175, y: 480, click: true },
        { t: 10, x: 175, y: 480 },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 2 — Upload modal: file uploads + AI detects fields (10–22s)
// ════════════════════════════════════════════════════════════════════════════
function Scene2() {
  const { localTime } = useSprite();
  const sceneT = localTime;

  // Modal opens 0–0.4
  const modalT = clamp(sceneT / 0.4, 0, 1);
  // File enters dropzone 1.5–2.5 (drag in)
  const dragInT = clamp((sceneT - 1.5) / 1.0, 0, 1);
  // Upload progress 2.5–5.0
  const upT = clamp((sceneT - 2.5) / 2.5, 0, 1);
  const uploadDone = sceneT >= 5;
  // Detection scanning 5.5–10
  const scanT = clamp((sceneT - 5.5) / 4.0, 0, 1);
  const detected = sceneT >= 10;

  // dimmed background screen
  const bgComposer = (
    <AppShell
      breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'New campaign']}
      sidebar={<ComposerPanel highlightAttach={false} />}
    >
      <div style={{ padding: '32px 40px' }}>
        <ChannelTabs active={0} />
        <div style={{ marginTop: 28, padding: '40px 36px', background: C.paper, borderRadius: 16, border: `1px solid ${C.rule2}`, opacity: 0.5 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: C.ink }}>Brief Outline</div>
        </div>
      </div>
    </AppShell>
  );

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      {bgComposer}
      {/* Backdrop */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,15,60,0.42)', opacity: modalT, backdropFilter: 'blur(2px)' }}/>

      {/* Modal */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${0.94 + 0.06 * modalT})`,
        opacity: modalT,
        width: 720, background: C.paper, borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,15,60,0.25)',
        fontFamily: FONT, overflow: 'hidden',
      }}>
        {/* Modal head */}
        <div style={{ padding: '20px 28px', borderBottom: `1px solid ${C.rule2}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon.doc size={20} color={C.ink}/>
          <span style={{ fontSize: 18, fontWeight: 700, color: C.ink }}>Upload Content Brief</span>
          <span style={{ flex: 1 }}/>
          <Icon.close />
        </div>

        {/* Body */}
        <div style={{ padding: 28 }}>
          {!uploadDone && (
            <div style={{
              border: `2px dashed ${dragInT > 0.4 ? C.blue : C.blue100}`,
              background: dragInT > 0.4 ? C.blue50 : C.blue25,
              borderRadius: 12, padding: '40px 32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
              transition: 'all 300ms',
              transform: dragInT > 0.4 ? 'scale(1.01)' : 'scale(1)',
            }}>
              {sceneT < 2.5 ? (
                <>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,15,60,0.08)' }}>
                    <Icon.cloudUpload />
                  </div>
                  <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>Click or drag your files to upload</div>
                  <div style={{ fontSize: 12, color: C.muted2 }}>Maximum size: 50MB per file. Limit: 5 files total</div>
                </>
              ) : (
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', background: '#fff', borderRadius: 10, border: `1px solid ${C.rule2}` }}>
                    <Icon.pdf />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>SapphireReserve_Q4_Brief.pdf</div>
                      <div style={{ fontSize: 12, color: C.muted2, marginTop: 2 }}>2.4 MB · {upT < 1 ? `${Math.round(upT * 100)}% uploaded` : 'Upload complete'}</div>
                      <div style={{ marginTop: 8, height: 5, background: C.rule2, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${upT * 100}%`, height: '100%', background: C.blue, transition: 'none' }}/>
                      </div>
                    </div>
                    {upT >= 1 && (
                      <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon.check size={12} color="#fff"/>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {uploadDone && (
            <div style={{
              borderRadius: 12, border: `1px solid ${C.blue100}`, padding: 20, background: C.blue25,
            }}>
              {/* File row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#fff', borderRadius: 10, border: `1px solid ${C.rule2}`, marginBottom: 18 }}>
                <Icon.pdf />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>SapphireReserve_Q4_Brief.pdf</div>
                  <div style={{ fontSize: 12, color: C.muted2, marginTop: 2 }}>2.4 MB · Uploaded</div>
                </div>
                <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon.check size={12} color="#fff"/>
                </span>
              </div>
              {/* Detection state */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  border: `3px solid ${C.blue100}`, borderTopColor: C.blue,
                  animation: 'spin 0.9s linear infinite',
                  display: detected ? 'none' : 'block',
                }}/>
                {detected && (
                  <span style={{ width: 28, height: 28, borderRadius: '50%', background: C.green, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon.check size={14} color="#fff"/>
                  </span>
                )}
                <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>
                  {detected ? '6 brief fields detected' : 'Persado is reading your brief…'}
                </div>
                <span style={{ flex: 1 }}/>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 600, color: C.purple, padding: '3px 10px', background: C.purpleBg, borderRadius: 100 }}>
                  <Icon.star size={11} color={C.purple}/> AI ASSISTANT
                </span>
              </div>
              {/* Detection items appearing one-by-one */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {[
                  ['Email channel', 0],
                  ['Chase Sapphire Cardmembers', 0.5],
                  ['Offer: 75,000 bonus points', 1.0],
                  ['Spend: $4,000 / 3 months', 1.5],
                  ['Brand: Sapphire Reserve', 2.0],
                  ['Compliance: Financial Services', 2.5],
                ].map(([lbl, dly]) => {
                  const visible = scanT * 4 >= dly + 0.5;
                  const t = clamp((scanT * 4 - dly - 0.5) / 0.4, 0, 1);
                  return (
                    <span key={lbl} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '5px 12px', background: '#fff', border: `1px solid ${C.blue100}`, borderRadius: 100,
                      fontSize: 12, color: C.ink, fontWeight: 500,
                      opacity: visible ? Easing.easeOutQuad(t) : 0,
                      transform: `translateY(${visible ? (1 - Easing.easeOutBack(t)) * 6 : 6}px)`,
                    }}>
                      <Icon.check size={11} color={C.blue}/> {lbl}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.rule2}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <span style={{ height: 36, padding: '0 18px', borderRadius: 8, border: `1px solid ${C.rule3}`, fontSize: 13, color: C.text, display: 'inline-flex', alignItems: 'center' }}>Discard</span>
          <span style={{
            height: 36, padding: '0 18px', borderRadius: 8,
            background: detected ? C.blue : C.rule, color: detected ? '#fff' : C.muted2,
            fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
            boxShadow: detected && sceneT > 11 ? `0 0 0 5px ${C.blue50}` : 'none',
          }}>
            {detected ? 'Apply to Brief' : 'Upload'} {detected && '→'}
          </span>
        </div>
      </div>
      <AnimatedCursor path={[
        { t: 0, x: 175, y: 480 },
        { t: 1.5, x: 960, y: 540 },
        { t: 5, x: 960, y: 540 },
        { t: 8, x: 800, y: 700 },
        { t: 11.4, x: 1180, y: 940 },
        { t: 11.8, x: 1180, y: 940, click: true },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 3 — Brief Outline auto-populates (22–38s)
// ════════════════════════════════════════════════════════════════════════════
const BRIEF_FIELDS = [
  { group: 'Campaign Overview', icon: '⊞', items: [
    ['Campaign Goal', 'Drive applications and engagement among existing Sapphire Reserve cardmembers for the new bonus points offer.'],
    ['Deliverables', 'Email, web landing page, Facebook/Instagram ad'],
    ['Audience', 'Existing Chase Sapphire Reserve cardmembers, primarily affluent travelers aged 30–55, prior travel-redemption history.'],
    ['Key Message', '75,000 bonus points after $4,000 in spend within the first 3 months. Travel-first benefits.'],
  ]},
  { group: 'Email', icon: '✉', items: [
    ['Subject Line', '—'],
    ['Preheader', '—'],
    ['Primary Link', 'https://chase.com/sapphire-reserve/bonus'],
    ['Timing & Urgency', '4–6 week campaign window, billing-cycle aligned. Heavier promo first 2 weeks.'],
    ['Unsubscribe Requirements', 'CAN-SPAM compliant, footer link required'],
  ]},
];

function BriefRow({ label, value, populated, locked, focused, sceneT, popDelay, dimmed }) {
  const t = clamp((sceneT - popDelay) / 0.5, 0, 1);
  const isShown = sceneT >= popDelay;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '14px 18px 14px 38px', borderBottom: `1px solid ${C.rule2}`,
      background: focused ? C.blue25 : 'transparent',
      borderLeft: focused ? `3px solid ${C.blue}` : '3px solid transparent',
      transition: 'all 200ms', position: 'relative',
      opacity: dimmed ? 0.4 : 1,
    }}>
      <div style={{ width: 200, fontSize: 13, color: C.text, fontWeight: 500, flexShrink: 0, paddingRight: 16 }}>{label}</div>
      <div style={{ flex: 1, fontSize: 13, color: populated ? C.text : C.muted2, lineHeight: 1.5 }}>
        {populated && isShown && (
          <span style={{ opacity: t, display: 'inline-block' }}>{value}</span>
        )}
        {populated && isShown && t < 1 && (
          <span style={{ display: 'inline-block', width: 8, height: 14, background: C.blue, marginLeft: 2, verticalAlign: -2, animation: 'blink 0.8s steps(2) infinite' }}/>
        )}
        {(!populated || !isShown) && '—'}
      </div>
      {populated && isShown && t > 0.6 && (
        <span style={{
          marginLeft: 12, padding: '2px 8px', borderRadius: 100,
          background: C.purpleBg, color: C.purple, fontSize: 10, fontWeight: 600,
          display: 'inline-flex', alignItems: 'center', gap: 4, opacity: (t - 0.6) * 2.5,
        }}>
          <Icon.star size={9} color={C.purple}/> AI
        </span>
      )}
    </div>
  );
}

function Scene3() {
  const { localTime } = useSprite();
  const sceneT = localTime;

  // Item populate timeline (start times)
  const POPS = [
    1.0, 2.5, 4.0, 5.5,    // Campaign Overview x4
    7.0, 8.0,              // Email Subject/Preheader (these stay '—')
    9.0, 10.5, 12.0,       // Primary Link, Timing, Unsubscribe
  ];

  // Banner timing
  const bannerT = clamp(sceneT / 0.6, 0, 1);
  const briefSummary = "Persado read SapphireReserve_Q4_Brief.pdf and structured the fields below. Review or edit anything that's not quite right.";

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'New campaign']}
        rightActions={
          <span style={{
            height: 34, padding: '0 14px', borderRadius: 8,
            background: C.blue50, border: `1px solid ${C.blue100}`,
            fontSize: 13, color: C.blue, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <Icon.sparkle size={12} color={C.blue}/> Brief from PDF · Applied
          </span>
        }
        sidebar={<ComposerPanel briefText={"Generate variants from the uploaded brief, optimized for Email primary."} badges={[1, 0, 0]} />}
      >
        <div style={{ padding: '24px 40px', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <ChannelTabs active={0} />
            <span style={{
              height: 38, padding: '0 18px', borderRadius: 8,
              background: sceneT > 14 ? C.blue : C.blue100, color: sceneT > 14 ? '#fff' : '#fff',
              fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: sceneT > 14 ? `0 0 0 5px ${C.blue50}` : 'none',
            }}>
              Submit Brief →
            </span>
          </div>
          {/* AI banner */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 20px', borderRadius: 10,
            background: C.purpleBg, border: '1px solid #d3adf7', marginBottom: 20,
            opacity: bannerT, transform: `translateY(${(1 - bannerT) * 8}px)`,
          }}>
            <Icon.sparkle size={18} color={C.purple}/>
            <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{briefSummary}</div>
            <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Edit detected fields ↗</span>
          </div>

          <div style={{ background: C.paper, borderRadius: 14, border: `1px solid ${C.rule2}`, overflow: 'hidden' }}>
            {BRIEF_FIELDS.map((g, gi) => (
              <div key={gi}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: C.blue50, borderBottom: `1px solid ${C.blue100}`, fontSize: 14, fontWeight: 600, color: C.ink }}>
                  <span style={{ color: C.blue, fontSize: 16 }}>{g.icon}</span> {g.group}
                </div>
                {g.items.map(([lbl, val], i) => {
                  // Cumulative idx
                  const idx = (gi === 0 ? i : 4 + i);
                  const popDelay = POPS[idx] || 99;
                  const populated = val !== '—';
                  return (
                    <BriefRow key={i} label={lbl} value={val} populated={populated} sceneT={sceneT} popDelay={popDelay} />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </AppShell>
      <AnimatedCursor path={[
        { t: 0, x: 1180, y: 940 },
        { t: 2, x: 900, y: 350 },
        { t: 6, x: 900, y: 480 },
        { t: 10, x: 900, y: 700 },
        { t: 14, x: 1820, y: 165 },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 4 — Inline edit toolbar / Shorten field (38–55s)
// ════════════════════════════════════════════════════════════════════════════
function Scene4() {
  const { localTime } = useSprite();
  const sceneT = localTime;

  const oldText = 'Existing Chase Sapphire Reserve cardmembers, primarily affluent travelers aged 30–55, prior travel-redemption history.';
  const newText = 'Sapphire Reserve cardmembers, ages 30–55, frequent travelers.';

  const showToolbar = sceneT >= 2;
  const toolbarT = clamp((sceneT - 2) / 0.4, 0, 1);
  const shortenClick = sceneT >= 6.5;
  const reflowT = clamp((sceneT - 7.0) / 1.2, 0, 1);
  const generateClick = sceneT >= 14;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'New campaign']}
        rightActions={
          <span style={{
            height: 34, padding: '0 14px', borderRadius: 8,
            background: C.greenBg, border: `1px solid ${C.greenBorder}`,
            fontSize: 13, color: C.green, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
          }}>
            <Icon.check size={12} color={C.green}/> Brief saved
          </span>
        }
        sidebar={<ComposerPanel briefText={"Generate variants from the uploaded brief, optimized for Email primary."} badges={[1, 0, 0]} />}
      >
        <div style={{ padding: '24px 40px', height: '100%', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <ChannelTabs active={0} />
            <span style={{
              height: 38, padding: '0 18px', borderRadius: 8,
              background: C.blue, color: '#fff',
              fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: sceneT > 13 && sceneT < 15 ? `0 0 0 5px ${C.blue50}` : 'none',
              transform: generateClick && sceneT < 14.4 ? 'scale(0.96)' : 'scale(1)',
            }}>Submit Brief →</span>
          </div>

          <div style={{ background: C.paper, borderRadius: 14, border: `1px solid ${C.rule2}`, overflow: 'visible' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: C.blue50, borderBottom: `1px solid ${C.blue100}`, fontSize: 14, fontWeight: 600, color: C.ink }}>
              <span style={{ color: C.blue, fontSize: 16 }}>⊞</span> Campaign Overview
            </div>

            {/* Campaign Goal */}
            <div style={{ display: 'flex', padding: '14px 18px 14px 38px', borderBottom: `1px solid ${C.rule2}` }}>
              <div style={{ width: 200, fontSize: 13, color: C.text, fontWeight: 500, flexShrink: 0, paddingRight: 16 }}>Campaign Goal</div>
              <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>Drive applications and engagement among existing Sapphire Reserve cardmembers for the new bonus points offer.</div>
            </div>

            {/* Deliverables */}
            <div style={{ display: 'flex', padding: '14px 18px 14px 38px', borderBottom: `1px solid ${C.rule2}` }}>
              <div style={{ width: 200, fontSize: 13, color: C.text, fontWeight: 500, flexShrink: 0, paddingRight: 16 }}>Deliverables</div>
              <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>Email, web landing page, Facebook/Instagram ad</div>
            </div>

            {/* Audience — focused, with toolbar */}
            <div style={{
              display: 'flex', padding: '16px 18px 16px 38px', borderBottom: `1px solid ${C.rule2}`,
              background: C.blue25, borderLeft: `3px solid ${C.blue}`, position: 'relative',
            }}>
              <div style={{ width: 197, fontSize: 13, color: C.text, fontWeight: 600, flexShrink: 0, paddingRight: 16 }}>Audience</div>
              <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5, position: 'relative' }}>
                {reflowT < 1 && (
                  <div style={{
                    opacity: 1 - reflowT * 0.5,
                    textDecoration: reflowT > 0.2 ? 'line-through' : 'none',
                    color: reflowT > 0.2 ? C.muted2 : C.text,
                  }}>{oldText}</div>
                )}
                {reflowT > 0.5 && (
                  <div style={{ marginTop: reflowT < 1 ? 8 : 0, color: C.text, opacity: (reflowT - 0.5) * 2 }}>
                    {newText}
                    {reflowT < 1 && <span style={{ display: 'inline-block', width: 7, height: 14, background: C.blue, marginLeft: 2, verticalAlign: -2, animation: 'blink 0.8s steps(2) infinite' }}/>}
                  </div>
                )}
                {reflowT >= 1 && (
                  <span style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 100, background: C.purpleBg, color: C.purple, fontSize: 10, fontWeight: 600 }}>
                    <Icon.star size={9} color={C.purple}/> SHORTENED · 14 → 8 words
                  </span>
                )}
              </div>

              {/* Floating inline toolbar */}
              {showToolbar && (
                <div style={{
                  position: 'absolute', right: 32, top: '50%',
                  transform: `translateY(-50%) scale(${0.92 + 0.08 * toolbarT})`,
                  background: '#1f1f1f', borderRadius: 10, padding: '8px 6px',
                  display: 'flex', gap: 4, alignItems: 'center',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.32)',
                  opacity: toolbarT,
                  zIndex: 5,
                }}>
                  {[
                    { lbl: 'Rewrite', icon: '✎' },
                    { lbl: 'Shorten', icon: '↔', highlight: sceneT > 5 && sceneT < 7 },
                    { lbl: 'Expand', icon: '↗' },
                    { lbl: 'Tone', icon: '◔' },
                    { lbl: 'Translate', icon: '⌘' },
                  ].map((it, j) => (
                    <span key={j} style={{
                      fontSize: 12, color: it.highlight ? '#fff' : '#bfbfbf',
                      fontWeight: it.highlight ? 600 : 400,
                      padding: '6px 10px', borderRadius: 6,
                      background: it.highlight ? 'rgba(49,100,255,0.35)' : 'transparent',
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      transform: shortenClick && it.lbl === 'Shorten' && sceneT < 6.8 ? 'scale(0.94)' : 'scale(1)',
                    }}>
                      <span style={{ color: it.highlight ? C.blue80 : C.muted2 }}>{it.icon}</span> {it.lbl}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Key Message */}
            <div style={{ display: 'flex', padding: '14px 18px 14px 38px', borderBottom: `1px solid ${C.rule2}` }}>
              <div style={{ width: 200, fontSize: 13, color: C.text, fontWeight: 500, flexShrink: 0, paddingRight: 16 }}>Key Message</div>
              <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>75,000 bonus points after $4,000 in spend within the first 3 months. Travel-first benefits.</div>
            </div>

            {/* Email group head */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', background: C.blue50, borderBottom: `1px solid ${C.blue100}`, fontSize: 14, fontWeight: 600, color: C.ink }}>
              <Icon.email color={C.blue}/> Email
            </div>
            {[
              ['Primary Link', 'https://chase.com/sapphire-reserve/bonus'],
              ['Timing & Urgency', '4–6 week campaign window, billing-cycle aligned. Heavier promo first 2 weeks.'],
              ['Unsubscribe Requirements', 'CAN-SPAM compliant, footer link required'],
            ].map(([l, v], i) => (
              <div key={i} style={{ display: 'flex', padding: '14px 18px 14px 38px', borderBottom: i < 2 ? `1px solid ${C.rule2}` : 'none' }}>
                <div style={{ width: 200, fontSize: 13, color: C.text, fontWeight: 500, flexShrink: 0, paddingRight: 16 }}>{l}</div>
                <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </AppShell>
      <AnimatedCursor path={[
        { t: 0, x: 1820, y: 165 },
        { t: 1.5, x: 800, y: 470 },
        { t: 2, x: 800, y: 470, click: true },
        { t: 5.8, x: 1620, y: 470 },
        { t: 6.4, x: 1620, y: 470, click: true },
        { t: 12, x: 1620, y: 470 },
        { t: 13.6, x: 1820, y: 165 },
        { t: 14, x: 1820, y: 165, click: true },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Generate modal: choose channel & generate (55–65s)
// ════════════════════════════════════════════════════════════════════════════
function ChannelCard({ icon, lbl, sub, selected, hovered }) {
  return (
    <div style={{
      flex: 1, padding: '20px 18px', borderRadius: 12,
      background: selected ? C.blue25 : '#fff',
      border: `${selected ? 2 : 1}px solid ${selected ? C.blue : (hovered ? C.blue100 : C.rule)}`,
      boxShadow: selected ? `0 4px 16px rgba(49,100,255,0.16)` : (hovered ? `0 2px 8px rgba(0,15,60,0.08)` : 'none'),
      transform: hovered ? 'translateY(-2px)' : 'none',
      transition: 'all 200ms',
      cursor: 'pointer',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: selected ? C.blue50 : '#fafafa',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{icon}</div>
        {selected && (
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon.check size={12} color="#fff"/>
          </span>
        )}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: C.ink, marginBottom: 4 }}>{lbl}</div>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{sub}</div>
    </div>
  );
}

function Scene5() {
  const { localTime } = useSprite();
  const sceneT = localTime;
  const modalT = clamp(sceneT / 0.4, 0, 1);
  const generateClick = sceneT >= 8;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'New campaign']}
        sidebar={<ComposerPanel briefText={"Generate variants from the uploaded brief, optimized for Email primary."} badges={[1, 0, 0]} />}
      >
        <div style={{ padding: '24px 40px', opacity: 0.5, height: '100%', overflow: 'hidden' }}>
          <ChannelTabs active={0} />
        </div>
      </AppShell>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,15,60,0.42)', opacity: modalT, backdropFilter: 'blur(2px)' }}/>

      {/* Generate modal */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        transform: `translate(-50%, -50%) scale(${0.96 + 0.04 * modalT})`,
        opacity: modalT,
        width: 880, background: C.paper, borderRadius: 18,
        boxShadow: '0 24px 80px rgba(0,15,60,0.28)', overflow: 'hidden',
      }}>
        <div style={{ padding: '24px 32px', borderBottom: `1px solid ${C.rule2}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon.sparkle size={20} color={C.purple}/>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Generate Variants</span>
            <span style={{ flex: 1 }}/>
            <Icon.close />
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 6 }}>Create and test variants for specific channels. We'll validate brand fit before returning results.</div>
        </div>
        <div style={{ padding: 32 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.ink, marginBottom: 12 }}>Choose channels</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <ChannelCard icon={<Icon.email size={20} color={C.blue}/>} lbl="Email" sub="Subject line, preheader, body, CTAs" selected />
            <ChannelCard icon={<Icon.webPage size={20} color={C.muted}/>} lbl="Web Page" sub="Hero, sections, CTAs" hovered={sceneT > 3 && sceneT < 5}/>
            <ChannelCard icon={<Icon.facebook size={20}/>} lbl="Facebook/Instagram Ad" sub="Headline, primary text, captions" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 24, padding: '14px 18px', background: C.purpleBg, borderRadius: 10 }}>
            <Icon.star size={16} color={C.purple}/>
            <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
              <b>Variants will be reviewed by a brand content strategist</b> before they come back to you. Typical turnaround: 3–5 business days.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: C.text }}>
              <span style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${C.blue}`, background: C.blue, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon.check size={9} color="#fff"/>
              </span>
              Optimize for cardmember-tone & financial compliance
            </div>
            <span style={{ flex: 1 }}/>
            <span style={{ fontSize: 13, color: C.muted }}>2 variants per channel · est. 4 days</span>
          </div>
        </div>
        <div style={{ padding: '16px 28px', borderTop: `1px solid ${C.rule2}`, display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <span style={{ height: 38, padding: '0 18px', borderRadius: 8, border: `1px solid ${C.rule3}`, fontSize: 13, color: C.text, display: 'inline-flex', alignItems: 'center' }}>Save as Draft</span>
          <span style={{
            height: 38, padding: '0 22px', borderRadius: 8,
            background: C.blue, color: '#fff', fontSize: 14, fontWeight: 500,
            display: 'inline-flex', alignItems: 'center', gap: 8,
            boxShadow: sceneT > 7.5 && sceneT < 9 ? `0 0 0 5px ${C.blue50}` : 'none',
            transform: generateClick && sceneT < 8.4 ? 'scale(0.96)' : 'scale(1)',
          }}>
            <Icon.sparkle size={14} color="#fff"/> Generate Variants
          </span>
        </div>
      </div>

      <AnimatedCursor path={[
        { t: 0, x: 1820, y: 165 },
        { t: 1.5, x: 960, y: 540 },
        { t: 4, x: 1100, y: 510 },
        { t: 7, x: 1320, y: 720 },
        { t: 8, x: 1320, y: 720, click: true },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 6 — Variants returned (65–82s)
// ════════════════════════════════════════════════════════════════════════════
function ScoreCircle({ value, color, label, size = 56, highlight }) {
  // Compute arc for partial fill (out of 100)
  const radius = size / 2 - 4;
  const circ = 2 * Math.PI * radius;
  const isNumeric = typeof value === 'number';
  const pct = isNumeric ? value / 100 : 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        position: 'relative', width: size, height: size,
        transform: highlight ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 250ms',
        filter: highlight ? `drop-shadow(0 0 0 ${color}33)` : 'none',
      }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={C.rule2} strokeWidth="3"/>
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${circ * pct} ${circ}`} strokeLinecap="round"/>
        </svg>
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isNumeric ? 16 : 12, fontWeight: 700, color,
        }}>{value}</div>
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, color: C.text2, textAlign: 'center', lineHeight: 1.2, maxWidth: 80 }}>{label}</div>
    </div>
  );
}

function Scene6() {
  const { localTime } = useSprite();
  const sceneT = localTime;

  // Loading 0–4s, then variants
  const loading = sceneT < 4;
  const variantT = clamp((sceneT - 4) / 0.8, 0, 1);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'Variants']}
        rightActions={
          !loading && (
            <>
              <span style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.rule}`, fontSize: 13, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Reanalyze</span>
              <span style={{ height: 34, padding: '0 16px', borderRadius: 8, background: C.green, color: '#fff', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Icon.check size={12} color="#fff"/> Approve Variant 1
              </span>
            </>
          )
        }
      >
        <div style={{ padding: '24px 32px', height: '100%', overflow: 'hidden' }}>
          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
            <Icon.arrowLeft />
            <span style={{ fontSize: 20, fontWeight: 700, color: C.ink }}>Sapphire Reserve Q4 — Bonus Points</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: C.blue50, border: `1px solid ${C.blue100}`, color: C.blue, fontSize: 11, fontWeight: 600 }}>
              <Icon.email size={11} color={C.blue}/> Email
            </span>
            {!loading && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: C.purpleBg, border: '1px solid #d3adf7', color: C.purple, fontSize: 11, fontWeight: 600, opacity: variantT }}>
                <Icon.star size={10} color={C.purple}/> Brand-validated
              </span>
            )}
          </div>

          {loading && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 22px', background: C.blue25, border: `1px solid ${C.blue100}`, borderRadius: 12, marginBottom: 22 }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', border: `3px solid ${C.blue100}`, borderTopColor: C.blue, animation: 'spin 0.9s linear infinite' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Generating variants…</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Brand content strategist validating brand fit</div>
                </div>
                <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>{Math.round(clamp(sceneT / 4, 0, 1) * 100)}%</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {[1, 2].map(n => (
                  <div key={n} style={{ border: `1px solid ${C.rule2}`, borderRadius: 14, padding: 24, background: '#fff' }}>
                    <div className="skel" style={{ height: 14, width: '40%', marginBottom: 18 }}/>
                    <div className="skel" style={{ height: 22, width: '85%', marginBottom: 12 }}/>
                    <div className="skel" style={{ height: 12, width: '95%', marginBottom: 8 }}/>
                    <div className="skel" style={{ height: 12, width: '70%', marginBottom: 24 }}/>
                    <div style={{ display: 'flex', gap: 18 }}>
                      <div className="skel" style={{ width: 56, height: 56, borderRadius: '50%' }}/>
                      <div className="skel" style={{ width: 56, height: 56, borderRadius: '50%' }}/>
                      <div className="skel" style={{ width: 56, height: 56, borderRadius: '50%' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && (
            <div style={{ opacity: variantT, transform: `translateY(${(1 - variantT) * 12}px)` }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '14px 22px',
                background: C.purpleBg, border: '1px solid #d3adf7', borderRadius: 12, marginBottom: 22,
              }}>
                <Icon.star size={18} color={C.purple}/>
                <div style={{ flex: 1, fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                  <b>2 variants returned · validated by brand content strategist.</b> Performance projections are versus a typical control variant for this audience.
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                {[
                  { n: 1, head: '26 destinations. One extraordinary year ahead.', sub: 'Your refreshed benefits are here — plus 75,000 bonus points after $4,000 in spend in your first three months.', scores: [
                      { lbl: 'Compliance Risk', val: 'Low', col: C.green },
                      { lbl: 'Performance Prediction', val: 79, col: C.green },
                      { lbl: 'Brand Alignment', val: 4, col: C.blue },
                  ], emo: ['Anticipation', 'Exclusivity', 'Quantified'], focused: true },
                  { n: 2, head: 'Earn 75,000 bonus points. Travel further this year.', sub: 'Get rewarded for the trips you\'re already planning. A limited-time offer for cardmembers.', scores: [
                      { lbl: 'Compliance Risk', val: 'Med.', col: C.amber },
                      { lbl: 'Performance Prediction', val: 74, col: C.amber },
                      { lbl: 'Brand Alignment', val: 4, col: C.blue },
                  ], emo: ['Reward', 'Action-driven'] },
                ].map((v, vi) => (
                  <div key={v.n} style={{
                    background: '#fff', borderRadius: 14, padding: 22,
                    border: `${v.focused ? 2 : 1}px solid ${v.focused ? C.blue : C.rule2}`,
                    boxShadow: v.focused ? `0 8px 24px rgba(49,100,255,0.14)` : 'none',
                    transform: `translateY(${(1 - clamp((sceneT - 4 - vi * 0.2) / 0.6, 0, 1)) * 16}px)`,
                    opacity: clamp((sceneT - 4 - vi * 0.2) / 0.6, 0, 1),
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: C.blue50, color: C.blue, fontWeight: 700, fontSize: 13,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{v.n}</div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>Variant {v.n}</div>
                      <span style={{ flex: 1 }}/>
                      <div style={{ display: 'flex', gap: 16 }}>
                        {v.scores.map((s, si) => (
                          <ScoreCircle key={si} value={s.val} color={s.col} label={s.lbl} highlight={v.focused && si === 1 && sceneT > 9 && sceneT < 12}/>
                        ))}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted2, fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Subject Line</div>
                    <div style={{ fontSize: 17, color: C.ink, fontWeight: 600, lineHeight: 1.3, marginBottom: 12 }}>{v.head}</div>
                    <div style={{ fontSize: 11, color: C.muted2, fontWeight: 600, marginBottom: 4, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Preheader</div>
                    <div style={{ fontSize: 13, color: C.text, lineHeight: 1.55, marginBottom: 14 }}>{v.sub}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {v.emo.map((e, ei) => (
                        <span key={ei} style={{ padding: '3px 10px', borderRadius: 100, background: '#fafafa', border: `1px solid ${C.rule}`, fontSize: 11, color: C.text2, fontWeight: 500 }}>
                          <b>{ei === 0 ? 'Emotional:' : 'Style:'}</b> {e}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppShell>
      <AnimatedCursor path={[
        { t: 0, x: 1320, y: 720 },
        { t: 4, x: 960, y: 540 },
        { t: 8, x: 600, y: 480 },
        { t: 11, x: 800, y: 290 },
        { t: 16, x: 600, y: 290 },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 7 — Compliance analysis deep-dive (82–102s)
// ════════════════════════════════════════════════════════════════════════════
function ObservationCard({ severity, quote, codes, expanded, sceneT, expandDelay }) {
  const sevColors = {
    high: { bg: C.redBg, bd: C.redBorder, t: C.red },
    med:  { bg: C.amberBg, bd: C.amberBorder, t: C.amber },
    low:  { bg: C.greenBg, bd: C.greenBorder, t: C.green },
  };
  const c = sevColors[severity];
  const expandT = clamp((sceneT - expandDelay) / 0.5, 0, 1);
  return (
    <div style={{
      borderRadius: 10, border: `1px solid ${c.bd}`, padding: '12px 14px',
      background: '#fff', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon.hammer size={14} color={c.t}/>
        </div>
        <div style={{ flex: 1, fontSize: 12, color: C.text, fontWeight: 600, fontStyle: 'italic' }}>"{quote}"</div>
        <Icon.caretDown />
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8, marginLeft: 36 }}>
        {codes.map((code, i) => (
          <span key={i} style={{ padding: '2px 8px', borderRadius: 100, background: '#fafafa', border: `1px solid ${C.rule}`, fontSize: 10, color: C.text2, fontWeight: 500 }}>{code}</span>
        ))}
      </div>
      {expanded && expandT > 0 && (
        <div style={{ marginTop: 12, marginLeft: 36, opacity: expandT, transform: `translateY(${(1 - expandT) * 6}px)` }}>
          <div style={{ display: 'inline-flex', padding: '3px 10px', borderRadius: 100, background: c.bg, color: c.t, fontSize: 10, fontWeight: 700, marginBottom: 8 }}>HIGH RISK</div>
          <div style={{ fontSize: 12, color: C.text, lineHeight: 1.55 }}>
            <b>UDAAP:</b> The bonus offer is a trigger term. The specific spending requirement (e.g. "spend $4,000 in 90 days") is a material term and must appear in the immediate context.
          </div>
          <div style={{ marginTop: 10, padding: '10px 12px', background: C.greenBg, border: `1px solid ${C.greenBorder}`, borderRadius: 8, fontSize: 12, color: C.text, lineHeight: 1.5 }}>
            <b style={{ color: C.green }}>✓ Compliant alternative:</b> "Earn 75,000 bonus points after spending $4,000 in the first 3 months. Terms apply."
          </div>
        </div>
      )}
    </div>
  );
}

function Scene7() {
  const { localTime } = useSprite();
  const sceneT = localTime;
  const expandFirst = sceneT >= 4;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'Variant 1']}
        rightActions={
          <>
            <span style={{ height: 34, padding: '0 14px', borderRadius: 8, background: C.blue, color: '#fff', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>Reanalyze</span>
            <span style={{ height: 34, padding: '0 14px', borderRadius: 8, background: C.green, color: '#fff', fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon.check size={12} color="#fff"/> Complete Analysis
            </span>
          </>
        }
      >
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          {/* Left observations panel */}
          <div style={{ width: 420, background: '#fff', borderRight: `1px solid ${C.rule2}`, padding: '20px 22px', overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <Icon.arrowLeft/>
              <span style={{ fontSize: 16, fontWeight: 700, color: C.ink }}>Variant 1</span>
              <Icon.caretDown />
              <span style={{ flex: 1 }}/>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: C.blue50, border: `1px solid ${C.blue100}`, color: C.blue, fontSize: 11, fontWeight: 600 }}>
                <Icon.email size={11} color={C.blue}/> Email
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 24, borderBottom: `1px solid ${C.rule2}`, marginBottom: 18 }}>
              {['Inputs', 'Analysis'].map((t, i) => (
                <span key={i} style={{ padding: '10px 0', fontSize: 14, color: i === 1 ? C.blue : C.muted, fontWeight: i === 1 ? 600 : 400, borderBottom: i === 1 ? `2px solid ${C.blue}` : 'none' }}>{t}</span>
              ))}
            </div>

            {/* Section: Compliance */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>Compliance</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.red, padding: '2px 8px', borderRadius: 100, background: C.redBg, border: `1px solid ${C.redBorder}` }}>HIGH</span>
              <span style={{ flex: 1 }}/>
              <span style={{ fontSize: 11, color: C.muted }}>3 observations</span>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginBottom: 14, padding: '10px 12px', background: C.redBg, border: `1px solid ${C.redBorder}`, borderRadius: 8 }}>
              This message may present a compliance risk and should be reviewed to confirm it meets marketing regulations.
            </div>

            <ObservationCard severity="high" quote="Earn 75,000 bonus points after $4,000 in spend." codes={['UDAAP', 'TILA / Reg Z']} expanded={expandFirst} sceneT={sceneT} expandDelay={4} />
            <ObservationCard severity="med" quote="One extraordinary year ahead." codes={['Brand voice']} sceneT={sceneT} expandDelay={99} />
            <ObservationCard severity="low" quote="Refreshed benefits are here…" codes={['Tone']} sceneT={sceneT} expandDelay={99} />

            <div style={{ marginTop: 18, padding: '10px 12px', background: C.blue25, border: `1px solid ${C.blue100}`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ width: 18, height: 18, borderRadius: '50%', background: C.blue, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>i</span>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>
                Analysis is based on the variant copy. Submit to Compliance to confirm regulatory alignment before deployment.
              </div>
            </div>

            {/* Performance section (collapsed) */}
            {[
              { lbl: 'Performance', score: 79, col: C.green },
              { lbl: 'Brand Alignment', score: 4, col: C.blue },
              { lbl: 'Readability', score: '8th', col: C.green },
              { lbl: 'Spell Check', score: 'OK', col: C.green },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 0', borderTop: `1px solid ${C.rule2}` }}>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: C.text }}>{s.lbl}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: s.col }}>{s.score}</span>
                <Icon.caretDown />
              </div>
            ))}
          </div>

          {/* Right document with inline highlighted observations */}
          <div style={{ flex: 1, padding: '20px 32px', overflow: 'auto', background: C.bg }}>
            {/* Score header */}
            <div style={{ display: 'flex', gap: 28, padding: '16px 22px', background: '#fff', borderRadius: 12, border: `1px solid ${C.rule2}`, marginBottom: 18, alignItems: 'center' }}>
              <ScoreCircle value="High" color={C.red} label="Compliance Risk" size={50} highlight={sceneT > 1 && sceneT < 4}/>
              <ScoreCircle value={79} color={C.green} label="Performance Prediction" size={50}/>
              <ScoreCircle value={4} color={C.blue} label="Brand Alignment" size={50}/>
              <span style={{ flex: 1 }}/>
              <span style={{ fontSize: 12, color: C.muted2 }}>Methodology ↗</span>
            </div>

            {/* Document */}
            <div style={{ background: '#fff', borderRadius: 12, border: `1px solid ${C.rule2}`, padding: '28px 32px' }}>
              <div style={{ fontSize: 13, color: C.muted2, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Subject Line</div>
              <div style={{ fontSize: 22, color: C.ink, fontWeight: 600, lineHeight: 1.3, marginBottom: 18 }}>26 destinations. One extraordinary year ahead.</div>
              <div style={{ fontSize: 13, color: C.muted2, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Preheader</div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.55, marginBottom: 22 }}>Your refreshed benefits are here — plus 75,000 bonus points after $4,000 in spend in your first three months.</div>
              <div style={{ height: 1, background: C.rule2, margin: '8px 0 22px' }}/>
              <div style={{ fontSize: 13, color: C.muted2, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 4 }}>Body</div>
              <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7 }}>
                Dear Cardmember,<br/><br/>
                Your Sapphire Reserve year is about to get even more rewarding. We're excited to share three updates that mean more points, more access, and more reasons to travel.<br/><br/>
                <span style={{
                  background: sceneT > 1 ? `linear-gradient(${C.redBg}, ${C.redBg})` : 'none',
                  borderBottom: sceneT > 1 ? `2px solid ${C.red}` : 'none',
                  padding: '2px 4px',
                  transition: 'all 300ms',
                }}>
                  Earn 75,000 bonus points after $4,000 in spend.
                  {sceneT > 1.5 && (
                    <span style={{
                      display: 'inline-flex', verticalAlign: 'middle', marginLeft: 6,
                      width: 22, height: 22, borderRadius: '50%', background: C.red, color: '#fff',
                      fontSize: 11, fontWeight: 700, alignItems: 'center', justifyContent: 'center',
                    }}>2</span>
                  )}
                </span>
                {' '}— it's our way of saying thanks for being part of the Sapphire Reserve community.<br/><br/>
                You'll also enjoy <span style={{ background: sceneT > 1 ? C.amberBg : 'none', borderBottom: sceneT > 1 ? `2px solid ${C.amber}` : 'none', padding: '2px 4px' }}>$300 in annual travel credits</span>, complimentary access to over 1,300 Priority Pass lounges worldwide, and 3X points on travel and dining.<br/><br/>
                Wherever this year takes you, your card is ready.
              </div>
            </div>
          </div>
        </div>
      </AppShell>
      <AnimatedCursor path={[
        { t: 0, x: 600, y: 290 },
        { t: 1.5, x: 870, y: 235 },
        { t: 4, x: 320, y: 510 },
        { t: 4.4, x: 320, y: 510, click: true },
        { t: 11, x: 320, y: 670 },
        { t: 14, x: 1100, y: 600 },
        { t: 18.5, x: 1810, y: 60 },
      ]} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SCENE 8 — Approve, final asset, deploy (102–120s)
// ════════════════════════════════════════════════════════════════════════════
function FinalEmail({ assetT }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 14, overflow: 'hidden',
      border: `1px solid ${C.rule2}`,
      boxShadow: '0 18px 48px rgba(0,15,60,0.16)',
      opacity: assetT,
      transform: `translateY(${(1 - assetT) * 24}px) scale(${0.96 + 0.04 * assetT})`,
      maxWidth: 640,
    }}>
      {/* Email client toolbar */}
      <div style={{ height: 36, background: '#f4f5f7', borderBottom: `1px solid ${C.rule2}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8 }}>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ff5f56' }}/>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#ffbd2e' }}/>
        <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#27c93f' }}/>
        <span style={{ flex: 1 }}/>
        <span style={{ fontSize: 11, color: C.muted2 }}>Email Preview · Desktop</span>
      </div>

      {/* From/subject */}
      <div style={{ padding: '14px 24px', borderBottom: `1px solid ${C.rule2}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 }}>SR</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Sapphire Reserve</div>
            <div style={{ fontSize: 11, color: C.muted2 }}>noreply@chase.com  →  cardmember@example.com</div>
          </div>
          <span style={{ fontSize: 11, color: C.muted2 }}>9:42 AM</span>
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: C.ink, marginTop: 8 }}>26 destinations. One extraordinary year ahead.</div>
      </div>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${C.emailHero} 0%, ${C.emailHero2} 100%)`,
        padding: '36px 40px', color: '#fff', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative pattern */}
        <svg style={{ position: 'absolute', right: -20, top: -20, opacity: 0.12 }} width="220" height="220" viewBox="0 0 220 220">
          <circle cx="110" cy="110" r="100" stroke="#fff" strokeWidth="1" fill="none"/>
          <circle cx="110" cy="110" r="70" stroke="#fff" strokeWidth="1" fill="none"/>
          <circle cx="110" cy="110" r="40" stroke="#fff" strokeWidth="1" fill="none"/>
          <path d="M30 110L190 110M110 30L110 190" stroke="#fff" strokeWidth="0.5"/>
        </svg>
        <div style={{ fontSize: 11, letterSpacing: '0.16em', opacity: 0.7, marginBottom: 10, fontWeight: 600 }}>CHASE SAPPHIRE RESERVE®</div>
        <div style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.15, maxWidth: 460, whiteSpace: 'pre-line' }}>
          26 destinations.{'\n'}One extraordinary{'\n'}year ahead.
        </div>
        <div style={{ marginTop: 18, display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 12px', background: 'rgba(255,255,255,0.15)', borderRadius: 100, backdropFilter: 'blur(4px)', fontSize: 11, fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#86efac' }}/> Limited-time offer
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '28px 40px' }}>
        <div style={{ fontSize: 14, color: C.text, lineHeight: 1.7, marginBottom: 20 }}>
          Your refreshed benefits are here — plus <b>75,000 bonus points</b> after $4,000 in spend within your first three months. That's a $1,125 head start on your next trip.
        </div>

        {/* Benefits grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          {[
            { ic: '✦', h: '75,000 bonus pts', s: 'After $4,000 in spend' },
            { ic: '⌖', h: '$300 travel credit', s: 'Annual statement credit' },
            { ic: '◈', h: 'Priority Pass', s: '1,300+ lounges worldwide' },
            { ic: '⊕', h: '3X points', s: 'Travel & dining' },
          ].map((b, i) => (
            <div key={i} style={{ padding: '12px 14px', background: '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 18, color: C.ink, marginBottom: 4 }}>{b.ic}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>{b.h}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{b.s}</div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{
            display: 'inline-block', padding: '14px 36px',
            background: C.ink, color: '#fff', fontSize: 13, fontWeight: 600,
            borderRadius: 6, letterSpacing: '0.05em',
          }}>VIEW DESTINATIONS →</span>
        </div>

        <div style={{ paddingTop: 18, borderTop: `1px solid ${C.rule2}`, fontSize: 10, color: C.muted2, lineHeight: 1.5 }}>
          Earn 75,000 bonus points after spending $4,000 in the first 3 months. Limited-time offer for eligible Chase Sapphire Reserve cardmembers. See terms and conditions. Earn 3X points on travel and dining purchases worldwide.
        </div>
      </div>
    </div>
  );
}

function Scene8() {
  const { localTime } = useSprite();
  const sceneT = localTime;
  const approved = sceneT >= 0.5;
  const assetT = clamp((sceneT - 1.0) / 1.2, 0, 1);

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AppShell
        breadcrumbTrail={['Workspace', 'Sapphire Reserve Q4', 'Variant 1 ✓ Approved']}
        rightActions={
          <>
            <span style={{ height: 34, padding: '0 14px', borderRadius: 8, border: `1px solid ${C.rule}`, fontSize: 13, color: C.text, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon.upload size={13}/> Export
            </span>
            <span style={{
              height: 34, padding: '0 16px', borderRadius: 8, background: C.blue, color: '#fff',
              fontSize: 13, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6,
            }}>Deploy →</span>
          </>
        }
      >
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
          <div style={{ flex: 1, padding: '28px 36px', background: C.bg, overflow: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 14px', borderRadius: 100,
                background: C.greenBg, border: `1px solid ${C.greenBorder}`, color: C.green, fontSize: 13, fontWeight: 600,
                transform: approved && sceneT < 1.5 ? 'scale(1.1)' : 'scale(1)',
                transition: 'transform 400ms',
              }}>
                <Icon.check size={13} color={C.green}/> Approved by Wes  ·  9:42 AM
              </span>
              <span style={{ flex: 1 }}/>
              <span style={{ fontSize: 12, color: C.muted, fontWeight: 500 }}>Production-ready · 8.4 KB · Tested across 28 inboxes</span>
            </div>

            <FinalEmail assetT={assetT}/>

            <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', opacity: assetT, maxWidth: 640 }}>
              {['HTML · ESP-ready', 'Mobile-tested', 'Compliance-cleared', 'Brand-aligned', 'Dark-mode safe'].map(t => (
                <span key={t} style={{ padding: '4px 12px', borderRadius: 6, background: '#fff', border: `1px solid ${C.rule2}`, fontSize: 11, color: C.text2, fontWeight: 500 }}>{t}</span>
              ))}
            </div>
          </div>

          {/* Deploy panel */}
          <div style={{ width: 380, background: '#fff', borderLeft: `1px solid ${C.rule2}`, padding: '24px 22px', opacity: assetT, overflow: 'auto' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: C.ink, marginBottom: 6 }}>Deploy to</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Send the production-ready asset directly to your stack.</div>

            {[
              { name: 'Salesforce Marketing Cloud', sub: 'Email Studio · Cloud Pages', selected: true, hover: sceneT > 13 && sceneT < 16 },
              { name: 'Adobe Campaign', sub: 'v8 · cardmember-prod', selected: false },
              { name: 'Braze', sub: 'US-04 · Cardmember segment', selected: false },
              { name: 'Iterable', sub: 'Templates · Sapphire', selected: false },
              { name: 'Asset Library', sub: 'Save for later use', selected: false },
            ].map((d, i) => (
              <div key={i} style={{
                padding: '12px 14px', borderRadius: 10, marginBottom: 8,
                border: `1px solid ${(d.selected || d.hover) ? C.blue : C.rule2}`,
                background: (d.selected || d.hover) ? C.blue25 : '#fff',
                display: 'flex', alignItems: 'center', gap: 12,
                transform: d.hover ? 'translateX(-2px)' : 'none', transition: 'all 200ms',
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: '50%',
                  border: `2px solid ${d.selected ? C.blue : C.rule3}`,
                  background: d.selected ? C.blue : '#fff',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {d.selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }}/>}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{d.name}</div>
                  <div style={{ fontSize: 11, color: C.muted2, marginTop: 1 }}>{d.sub}</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 22, padding: 16, background: C.blue25, border: `1px solid ${C.blue100}`, borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon.sparkle size={14} color={C.blue}/>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.ink, letterSpacing: '0.04em' }}>BRIEF IN, READY OUT</span>
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                <b>3–5 business days</b> typical end-to-end. Same flow runs for banners, direct mail, and social — whatever the brief specifies.
              </div>
            </div>
          </div>
        </div>
      </AppShell>
      <AnimatedCursor path={[
        { t: 0, x: 1810, y: 60 },
        { t: 0.4, x: 1810, y: 60, click: true },
        { t: 2.5, x: 720, y: 540 },
        { t: 8, x: 720, y: 540 },
        { t: 12, x: 1620, y: 380 },
        { t: 16, x: 1620, y: 420 },
        { t: 19, x: 1820, y: 60 },
      ]} />
    </div>
  );
}

// ── Caption bar ─────────────────────────────────────────────────────────────
const CAPTIONS = [
  { t: 0,    end: 10,  text: "Okay, so this is Create from Brief. Let me walk you through how a campaign actually moves through it — I'll take a brief, drop it in, and show you what comes out." },
  { t: 10,   end: 22,  text: "Most teams already have briefs they're writing — emails, slide decks, internal templates. So what we do here is just upload one. The system reads it." },
  { t: 22,   end: 38,  text: "And here's what's interesting — it's not just attaching a file. It's pulling out the structure: campaign goal, audience, key message, channel-specific fields. All editable." },
  { t: 38,   end: 55,  text: "If something's off — say I want this audience description tighter — there's rewrite, shorten, expand right here. Let me shorten that. And once the brief's where I want it…" },
  { t: 55,   end: 65,  text: "Generate. I can pick channels, and a brand content strategist validates everything before it comes back." },
  { t: 65,   end: 82,  text: "While it's working — variants come back already brand-validated. Each one's scored. Performance prediction. Compliance risk. Brand alignment." },
  { t: 82,   end: 102, text: "And it's not a black box. Click into compliance and you see what was flagged — UDAAP, the trigger term — alongside a compliant alternative. The reasoning's exposed." },
  { t: 102,  end: 120, text: "Approve. And what I get back is a production-ready email. Coded. ESP-ready. Three to five business days end-to-end. Same flow runs for every channel in the brief." },
];

function CaptionBar() {
  const t = useTime();
  const cur = CAPTIONS.find(c => t >= c.t && t < c.end);
  if (!cur) return null;
  const since = t - cur.t;
  const opacity = clamp(since / 0.25, 0, 1);
  return (
    <div style={{
      position: 'absolute', left: 80, right: 80, bottom: 60,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none', zIndex: 500, opacity,
    }}>
      <div style={{
        background: 'rgba(0,12,40,0.88)', color: '#fff',
        padding: '14px 28px', borderRadius: 12,
        fontSize: 22, fontWeight: 500, lineHeight: 1.4, maxWidth: 1500,
        textAlign: 'center', backdropFilter: 'blur(10px)',
        fontFamily: FONT,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>{cur.text}</div>
    </div>
  );
}

// ── Chapter HUD ─────────────────────────────────────────────────────────────
const CHAPTERS = [
  { t: 0, name: 'Composer · starting point' },
  { t: 10, name: 'Upload brief · AI detects fields' },
  { t: 22, name: 'Brief auto-structures' },
  { t: 38, name: 'Inline edit · shorten' },
  { t: 55, name: 'Generate · pick channels' },
  { t: 65, name: 'Variants return · brand-validated' },
  { t: 82, name: 'Compliance deep-dive' },
  { t: 102, name: 'Approve · ship' },
];

function ChapterHUD() {
  const t = useTime();
  let idx = 0;
  for (let i = CHAPTERS.length - 1; i >= 0; i--) if (t >= CHAPTERS[i].t) { idx = i; break; }
  const ch = CHAPTERS[idx];
  const fmt = (s) => `${String(Math.floor(s/60)).padStart(1,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
  return (
    <div style={{
      position: 'absolute', left: 32, top: 32,
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(0,12,40,0.78)', color: '#fff',
      padding: '8px 14px 8px 10px', borderRadius: 100,
      fontFamily: FONT, fontSize: 13,
      backdropFilter: 'blur(10px)', zIndex: 500,
      boxShadow: '0 6px 18px rgba(0,0,0,0.3)',
    }}>
      <span style={{
        fontFamily: MONO, fontWeight: 700,
        background: C.blue, color: '#fff', padding: '3px 10px', borderRadius: 100, fontSize: 11, letterSpacing: '0.04em',
      }}>CH {String(idx + 1).padStart(2, '0')} / 08</span>
      <span style={{ fontWeight: 600 }}>{ch.name}</span>
      <span style={{ opacity: 0.55, fontFamily: MONO, fontSize: 11 }}>{fmt(t)} / 2:00</span>
    </div>
  );
}

// ── Mount ───────────────────────────────────────────────────────────────────
function Walkthrough() {
  return (
    <>
      <Sprite start={0} end={10}><Scene1 /></Sprite>
      <Sprite start={10} end={22}><Scene2 /></Sprite>
      <Sprite start={22} end={38}><Scene3 /></Sprite>
      <Sprite start={38} end={55}><Scene4 /></Sprite>
      <Sprite start={55} end={65}><Scene5 /></Sprite>
      <Sprite start={65} end={82}><Scene6 /></Sprite>
      <Sprite start={82} end={102}><Scene7 /></Sprite>
      <Sprite start={102} end={120}><Scene8 /></Sprite>
      <ChapterHUD />
      <CaptionBar />
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <Stage width={1920} height={1080} duration={120} background="#fff" autoplay={true} loop={true} persistKey="createdemoV2">
    <Walkthrough />
  </Stage>
);
