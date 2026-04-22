import { useEffect } from 'react';
import * as THREE from 'three';

const CSS = `
:root{
  --gold:#d4af37;--gold-l:#f5d060;
  --acc:#d4af37;
  --bg:#060b18;--bg2:#080e1f;
  --text:rgba(255,255,255,0.88);--muted:rgba(255,255,255,0.38);
}
html{scroll-behavior:smooth}
body{background:radial-gradient(ellipse at 50% 48%,#0d1c38 0%,#060b18 52%,#020609 100%);color:var(--text);font-family:'DM Sans',sans-serif;-webkit-font-smoothing:antialiased;overflow-x:hidden}
#nebula{position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(ellipse at 48% 46%,rgba(15,45,95,0.32) 0%,transparent 50%),radial-gradient(ellipse at 20% 78%,rgba(75,28,8,0.16) 0%,transparent 38%),radial-gradient(ellipse at 78% 20%,rgba(38,12,75,0.13) 0%,transparent 32%)}
#bg{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
nav{position:fixed;top:0;left:0;right:0;z-index:50;display:flex;align-items:center;justify-content:space-between;padding:18px 44px;transition:background 0.4s,backdrop-filter 0.4s,border-color 0.4s;border-bottom:1px solid transparent;}
nav.scrolled{background:rgba(6,11,24,0.85);backdrop-filter:blur(20px);border-bottom-color:rgba(255,255,255,0.05)}
.lp-logo{display:flex;align-items:center;gap:10px;text-decoration:none}
.lp-logo-k{width:34px;height:34px;border-radius:9px;background:linear-gradient(135deg,var(--gold),var(--gold-l));display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-weight:900;font-size:17px;color:#0a0f1e}
.lp-logo-name{font-family:'Playfair Display',serif;font-weight:700;font-size:17px;color:#fff;letter-spacing:-0.02em}
.lp-nav-links{display:flex;gap:4px}
.lp-nl{padding:7px 15px;border-radius:8px;font-size:13px;font-weight:500;color:var(--muted);text-decoration:none;transition:color 0.2s,background 0.2s}
.lp-nl:hover{color:#fff;background:rgba(255,255,255,0.06)}
.lp-nav-cta{padding:9px 20px;border-radius:9px;font-size:13px;font-weight:700;text-decoration:none;background:linear-gradient(135deg,var(--gold),var(--gold-l));color:#0a0f1e;box-shadow:0 4px 18px rgba(212,175,55,0.28);transition:transform 0.2s,box-shadow 0.2s}
.lp-nav-cta:hover{transform:translateY(-1px);box-shadow:0 8px 28px rgba(212,175,55,0.44)}
#hero{position:relative;z-index:1;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 24px}
#drag-layer{position:absolute;inset:0;cursor:grab;z-index:1}
#drag-layer:active{cursor:grabbing}
.hero-content{position:relative;z-index:2;pointer-events:none;max-width:780px}
.glow-v{position:absolute;width:700px;height:700px;border-radius:50%;background:radial-gradient(circle,rgba(100,50,10,0.12) 0%,transparent 68%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:0}
.badge{display:inline-flex;align-items:center;gap:8px;padding:6px 16px;border-radius:100px;background:rgba(212,175,55,0.08);border:1px solid rgba(212,175,55,0.2);color:var(--gold);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:32px;opacity:0;animation:lp-fadeUp 0.8s 0.2s ease forwards}
.badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:lp-dotPulse 2.5s ease infinite}
.hero-content h1{font-family:'Playfair Display',serif;font-size:clamp(44px,7.5vw,90px);font-weight:900;color:#fff;line-height:1.02;letter-spacing:-0.04em;margin-bottom:22px;opacity:0;animation:lp-fadeUp 0.8s 0.35s ease forwards}
.gold-shine{background:linear-gradient(90deg,var(--gold),var(--gold-l),var(--gold));background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:lp-shimmer 3s linear infinite}
.hero-sub{font-size:clamp(15px,2vw,18px);color:var(--muted);max-width:480px;margin:0 auto 38px;line-height:1.78;opacity:0;animation:lp-fadeUp 0.8s 0.5s ease forwards}
.hero-ctas{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;opacity:0;animation:lp-fadeUp 0.8s 0.65s ease forwards;pointer-events:all}
.lp-btn-gold{padding:15px 34px;border-radius:12px;font-size:15px;font-weight:700;text-decoration:none;background:linear-gradient(135deg,var(--gold),var(--gold-l));color:#0a0f1e;box-shadow:0 8px 32px rgba(212,175,55,0.35);transition:transform 0.2s,box-shadow 0.2s}
.lp-btn-gold:hover{transform:translateY(-2px);box-shadow:0 14px 44px rgba(212,175,55,0.5)}
.lp-btn-ghost{padding:15px 28px;border-radius:12px;font-size:15px;font-weight:500;text-decoration:none;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.55);transition:background 0.2s,border-color 0.2s}
.lp-btn-ghost:hover{background:rgba(255,255,255,0.07);border-color:rgba(255,255,255,0.18)}
.hero-fine{font-size:12px;color:rgba(255,255,255,0.17);margin-top:18px;opacity:0;animation:lp-fadeUp 0.8s 0.8s ease forwards}
.scroll-cue{position:absolute;bottom:34px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:8px;z-index:2;opacity:0;animation:lp-fadeUp 1s 1.1s ease forwards;pointer-events:none}
.scroll-line{width:1px;height:52px;background:linear-gradient(to bottom,rgba(212,175,55,0.7),transparent);animation:lp-sPulse 2s ease infinite}
.scroll-lbl{font-size:9px;color:rgba(255,255,255,0.18);letter-spacing:0.18em;text-transform:uppercase}
#globe-section{position:relative;z-index:1;height:220vh}
.globe-sticky{position:sticky;top:0;height:100vh;display:flex;align-items:center;padding:0 6%;pointer-events:none}
.globe-text-col{position:relative;width:34%;max-width:380px;z-index:2;padding:28px 24px 28px 0}
.globe-phase{position:absolute;top:0;left:0;width:100%;opacity:0;transform:translateY(16px);transition:opacity 0.7s ease,transform 0.7s ease}
.globe-phase.active{opacity:1;transform:translateY(0)}
.lp-eyebrow{font-size:11px;font-weight:700;color:var(--gold);letter-spacing:0.14em;text-transform:uppercase;display:flex;align-items:center;gap:8px;margin-bottom:14px}
.lp-eyebrow::before{content:'';width:20px;height:1px;background:var(--gold)}
.globe-h{font-family:'Playfair Display',serif;font-size:clamp(32px,4.5vw,54px);font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1.06;margin-bottom:18px}
.globe-p{font-size:15px;color:var(--muted);line-height:1.78;max-width:340px}
.g-stats{display:flex;flex-direction:column;gap:28px}
.g-stat-n{font-family:'Playfair Display',serif;font-size:56px;font-weight:900;line-height:1;background:linear-gradient(135deg,var(--gold),var(--gold-l));-webkit-background-clip:text;-webkit-text-fill-color:transparent}
.g-stat-l{font-size:13px;color:var(--muted);margin-top:3px}
.lp-solid{position:relative;z-index:2;background:var(--bg);border-top:none;}
.lp-solid::before{content:'';position:absolute;top:-130px;left:0;right:0;height:130px;background:linear-gradient(to bottom,transparent,var(--bg));pointer-events:none;}
.lp-inner{max-width:920px;margin:0 auto;padding:96px 6%}
.lp-section-h{font-family:'Playfair Display',serif;font-size:clamp(30px,4vw,50px);font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1.08;margin-bottom:60px}
.lp-steps{border-top:1px solid rgba(255,255,255,0.06)}
.lp-step{display:grid;grid-template-columns:88px 1fr;gap:28px;padding:38px 0;border-bottom:1px solid rgba(255,255,255,0.06);opacity:0;transform:translateY(22px);transition:opacity 0.7s ease,transform 0.7s ease}
.lp-step.visible{opacity:1;transform:translateY(0)}
.lp-step-n{font-family:'Playfair Display',serif;font-size:64px;font-weight:900;color:rgba(212,175,55,0.1);line-height:1;padding-top:2px;transition:color 0.35s}
.lp-step:hover .lp-step-n{color:rgba(212,175,55,0.22)}
.lp-step-title{font-size:20px;font-weight:700;color:#fff;margin-bottom:9px}
.lp-step-desc{font-size:14px;color:var(--muted);line-height:1.75;max-width:560px}
.lp-p-grid{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.06);border-radius:22px;overflow:hidden;margin-top:56px}
.lp-p-col{padding:52px 44px;background:var(--bg2);opacity:0;transform:translateY(22px);transition:opacity 0.7s ease,transform 0.7s ease}
.lp-p-col:last-child{background:linear-gradient(150deg,rgba(80,50,0,0.14) 0%,rgba(212,175,55,0.05) 100%)}
.lp-p-col.visible{opacity:1;transform:translateY(0)}
.lp-p-badge{display:inline-block;padding:4px 10px;border-radius:6px;font-size:10px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:24px}
.lp-p-badge-free{background:rgba(255,255,255,0.05);color:var(--muted)}
.lp-p-badge-pro{background:rgba(212,175,55,0.12);color:var(--gold)}
.lp-p-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:900;color:#fff;margin-bottom:10px}
.lp-p-amt{display:flex;align-items:flex-start;gap:3px;font-family:'Playfair Display',serif;font-weight:900;color:#fff;line-height:1;margin-bottom:4px}
.lp-p-amt .lp-sup{font-size:22px;font-weight:400;color:var(--muted);margin-top:10px}
.lp-p-amt .lp-num{font-size:56px}
.lp-p-amt .lp-sub{font-family:'DM Sans',sans-serif;font-size:16px;font-weight:400;color:var(--muted);align-self:flex-end;margin-bottom:10px}
.lp-p-period{font-size:13px;color:var(--muted);margin-bottom:34px}
.lp-p-list{list-style:none;border-top:1px solid rgba(255,255,255,0.05);margin-bottom:34px}
.lp-p-list li{padding:11px 0;font-size:13px;color:rgba(255,255,255,0.38);border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px}
.lp-p-list li.on{color:rgba(255,255,255,0.75)}
.lp-p-list li::before{content:'';flex-shrink:0;width:15px;height:15px;border-radius:50%;border:1px solid rgba(255,255,255,0.1)}
.lp-p-list li.on::before{border-color:rgba(212,175,55,0.4);background:rgba(212,175,55,0.08);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 15 15'%3E%3Cpath d='M2.5 7.5l3.5 3.5 7-7' stroke='%23d4af37' stroke-width='1.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:center}
.lp-btn-free{display:block;padding:13px;border-radius:10px;text-align:center;text-decoration:none;font-size:14px;font-weight:600;border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.45);transition:background 0.2s,border-color 0.2s}
.lp-btn-free:hover{background:rgba(255,255,255,0.05);border-color:rgba(255,255,255,0.18)}
.lp-btn-pro{display:block;padding:13px;border-radius:10px;text-align:center;text-decoration:none;font-size:14px;font-weight:700;background:linear-gradient(135deg,var(--gold),var(--gold-l));color:#0a0f1e;box-shadow:0 6px 24px rgba(212,175,55,0.28);transition:transform 0.2s,box-shadow 0.2s}
.lp-btn-pro:hover{transform:translateY(-2px);box-shadow:0 12px 36px rgba(212,175,55,0.45)}
.lp-footer{position:relative;z-index:2;background:var(--bg);border-top:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;padding:32px 6%}
.lp-f-links{display:flex;gap:20px}
.lp-f-link{font-size:12px;color:rgba(255,255,255,0.22);text-decoration:none;transition:color 0.2s}
.lp-f-link:hover{color:rgba(255,255,255,0.45)}
.lp-f-copy{font-size:11px;color:rgba(255,255,255,0.14)}
@keyframes lp-fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
@keyframes lp-shimmer{0%{background-position:0% center}100%{background-position:200% center}}
@keyframes lp-dotPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(212,175,55,0.5)}50%{opacity:0.7;box-shadow:0 0 0 7px rgba(212,175,55,0)}}
@keyframes lp-sPulse{0%,100%{opacity:0.5;transform:scaleY(1)}50%{opacity:1;transform:scaleY(0.82)}}
@media(max-width:768px){
  nav{padding:14px 20px}.lp-nav-links{display:none}
  .globe-text-col{width:90%;max-width:none}
  .globe-sticky{padding:0 5%;align-items:flex-start;padding-top:90px}
  .lp-p-grid{grid-template-columns:1fr}
  .lp-step{grid-template-columns:64px 1fr;gap:16px}
  .lp-inner{padding:72px 5%}
}
`;

export default function LandingPage() {
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = CSS;
    document.head.appendChild(styleEl);

    const cfg = { starCount: 228, globeSpeed: 2.3, globeDots: 4561 };

    const canvas = document.getElementById('bg');
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 500);
    camera.position.z = 18;

    let W = window.innerWidth, H = window.innerHeight;
    function onResize() {
      W = window.innerWidth; H = window.innerHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    }
    onResize();
    window.addEventListener('resize', onResize);

    function createDiamondTex() {
      const s = 64, c = 32;
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = s;
      const ctx = cvs.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(c, 3); ctx.lineTo(s - 4, c); ctx.lineTo(c, s - 3); ctx.lineTo(4, c);
      ctx.closePath();
      const g = ctx.createRadialGradient(c, c, 0, c, c, 28);
      g.addColorStop(0, 'rgba(255,252,245,1)');
      g.addColorStop(0.45, 'rgba(255,248,235,0.65)');
      g.addColorStop(1, 'rgba(255,248,235,0)');
      ctx.fillStyle = g;
      ctx.fill();
      return new THREE.CanvasTexture(cvs);
    }
    const diamondTex = createDiamondTex();

    let galaxyMesh;
    function buildGalaxy() {
      if (galaxyMesh) scene.remove(galaxyMesh);
      const N = cfg.starCount;
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = Math.pow(Math.random(), 0.45) * 28;
        const arm = Math.floor(Math.random() * 3);
        const angle = (arm / 3) * Math.PI * 2 + r * 0.28 + (Math.random() - 0.5) * 1.4;
        pos[i * 3] = r * Math.cos(angle) + (Math.random() - 0.5) * 1.5;
        pos[i * 3 + 2] = r * Math.sin(angle) * 0.32 + (Math.random() - 0.5) * 0.8;
        if (Math.random() < 0.32) {
          pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
        } else {
          pos[i * 3 + 1] = (Math.random() - 0.5) * Math.max(0.3, 4.0 - r * 0.12);
        }
        const bright = 0.3 + Math.random() * 0.7;
        col[i * 3] = 1.0 * bright; col[i * 3 + 1] = 0.97 * bright; col[i * 3 + 2] = 0.88 * bright;
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      galaxyMesh = new THREE.Points(geo, new THREE.PointsMaterial({
        map: diamondTex, size: 0.22, vertexColors: true, sizeAttenuation: true,
        transparent: true, opacity: 1, alphaTest: 0.02,
        blending: THREE.AdditiveBlending, depthWrite: false,
      }));
      galaxyMesh.rotation.x = 0.2;
      scene.add(galaxyMesh);
    }
    buildGalaxy();

    const GLOBE_R = 8.5;
    const GLOBE_X = 4.5;
    const GLOBE_FINAL_Y = -3.5;
    let globeGroup, glowSprite;

    function buildGlowSprite() {
      if (glowSprite) scene.remove(glowSprite);
      const s = 512;
      const cvs = document.createElement('canvas');
      cvs.width = cvs.height = s;
      const ctx = cvs.getContext('2d');
      const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
      g.addColorStop(0, 'rgba(255,240,180,0.2)');
      g.addColorStop(0.35, 'rgba(212,175,55,0.12)');
      g.addColorStop(0.65, 'rgba(160,100,20,0.05)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, s, s);
      glowSprite = new THREE.Mesh(
        new THREE.PlaneGeometry(GLOBE_R * 3.8, GLOBE_R * 3.8),
        new THREE.MeshBasicMaterial({
          map: new THREE.CanvasTexture(cvs),
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
        })
      );
      scene.add(glowSprite);
    }
    buildGlowSprite();

    function loadLandMask() {
      return new Promise((resolve) => {
        const MW = 512, MH = 256;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          try {
            const cvs = document.createElement('canvas');
            cvs.width = MW; cvs.height = MH;
            const ctx = cvs.getContext('2d');
            ctx.drawImage(img, 0, 0, MW, MH);
            resolve({ data: ctx.getImageData(0, 0, MW, MH).data, w: MW, h: MH });
          } catch (e) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = 'https://unpkg.com/three-globe/example/img/earth-day.jpg';
        setTimeout(() => resolve(null), 5000);
      });
    }

    function isLand(u, v, mask) {
      const x = Math.floor(((u % 1) + 1) % 1 * mask.w);
      const y = Math.floor(Math.min(v, 0.999) * mask.h);
      const i = (y * mask.w + x) * 4;
      const r = mask.data[i], g = mask.data[i + 1], b = mask.data[i + 2];
      return !(b > r * 1.05 && b > 100);
    }

    let isMounted = true;

    async function buildGlobe() {
      if (globeGroup) scene.remove(globeGroup);
      globeGroup = new THREE.Group();
      globeGroup.position.set(GLOBE_X, -22, 0);

      [[GLOBE_R * 1.018, 0xd4af37, 0.07], [GLOBE_R * 1.06, 0xc89020, 0.03], [GLOBE_R * 1.20, 0x1a0800, 0.06]].forEach(([r, c, o]) => {
        globeGroup.add(new THREE.Mesh(
          new THREE.SphereGeometry(r, 32, 32),
          new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.BackSide })
        ));
      });

      const lp = [];
      const SEG = 90;
      [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75].forEach(lat => {
        const phi = (90 - lat) * Math.PI / 180;
        for (let i = 0; i < SEG; i++) {
          const t1 = (i / SEG) * Math.PI * 2, t2 = ((i + 1) / SEG) * Math.PI * 2;
          lp.push(
            GLOBE_R * Math.sin(phi) * Math.cos(t1), GLOBE_R * Math.cos(phi), GLOBE_R * Math.sin(phi) * Math.sin(t1),
            GLOBE_R * Math.sin(phi) * Math.cos(t2), GLOBE_R * Math.cos(phi), GLOBE_R * Math.sin(phi) * Math.sin(t2)
          );
        }
      });
      for (let lon = 0; lon < 360; lon += 20) {
        const theta = lon * Math.PI / 180;
        for (let i = 0; i < SEG / 2; i++) {
          const p1 = (i / (SEG / 2)) * Math.PI, p2 = ((i + 1) / (SEG / 2)) * Math.PI;
          lp.push(
            GLOBE_R * Math.sin(p1) * Math.cos(theta), GLOBE_R * Math.cos(p1), GLOBE_R * Math.sin(p1) * Math.sin(theta),
            GLOBE_R * Math.sin(p2) * Math.cos(theta), GLOBE_R * Math.cos(p2), GLOBE_R * Math.sin(p2) * Math.sin(theta)
          );
        }
      }
      const lGeo = new THREE.BufferGeometry();
      lGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(lp), 3));
      globeGroup.add(new THREE.LineSegments(lGeo, new THREE.LineBasicMaterial({
        color: 0xd4af37, transparent: true, opacity: 0.18, blending: THREE.AdditiveBlending, depthWrite: false,
      })));

      const mask = await loadLandMask();
      if (!isMounted) return;

      const TARGET = cfg.globeDots;
      const posArr = [];
      if (mask) {
        const TOTAL = 32000;
        const allLand = [];
        for (let i = 0; i < TOTAL; i++) {
          const phi = Math.acos(1 - 2 * (i + 0.5) / TOTAL);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;
          const u = ((theta % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) / (Math.PI * 2);
          const v = phi / Math.PI;
          if (isLand(u, v, mask)) {
            allLand.push(
              GLOBE_R * Math.sin(phi) * Math.cos(theta),
              GLOBE_R * Math.cos(phi),
              GLOBE_R * Math.sin(phi) * Math.sin(theta)
            );
          }
        }
        const numLand = allLand.length / 3;
        const stride = numLand / Math.min(TARGET, numLand);
        for (let i = 0; i < Math.min(TARGET, numLand); i++) {
          const src = Math.floor(i * stride) * 3;
          posArr.push(allLand[src], allLand[src + 1], allLand[src + 2]);
        }
      } else {
        for (let i = 0; i < TARGET; i++) {
          const phi = Math.acos(1 - 2 * (i + 0.5) / TARGET);
          const theta = Math.PI * (1 + Math.sqrt(5)) * i;
          posArr.push(
            GLOBE_R * Math.sin(phi) * Math.cos(theta),
            GLOBE_R * Math.cos(phi),
            GLOBE_R * Math.sin(phi) * Math.sin(theta)
          );
        }
      }
      const dGeo = new THREE.BufferGeometry();
      dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(posArr), 3));
      globeGroup.add(new THREE.Points(dGeo, new THREE.PointsMaterial({
        color: 0xd4af37, size: 0.055, sizeAttenuation: true, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })));

      const hotspots = [[51, 10], [40, -3], [55, 37], [39, 116], [35, 139], [-33, 151], [1, 103], [37, -95], [45, -73], [-23, -46], [19, 73], [-1, 37], [30, 31], [60, 25], [52, 4]];
      const hPos = [];
      hotspots.forEach(([lat, lon]) => {
        const phi = (90 - lat) * Math.PI / 180, theta = (lon + 180) * Math.PI / 180;
        hPos.push(GLOBE_R * Math.sin(phi) * Math.cos(theta), GLOBE_R * Math.cos(phi), GLOBE_R * Math.sin(phi) * Math.sin(theta));
      });
      const hGeo = new THREE.BufferGeometry();
      hGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(hPos), 3));
      globeGroup.add(new THREE.Points(hGeo, new THREE.PointsMaterial({
        color: 0xf5d060, size: 0.22, sizeAttenuation: true, transparent: true, opacity: 1,
        blending: THREE.AdditiveBlending, depthWrite: false,
      })));

      scene.add(globeGroup);
    }
    buildGlobe();

    let dragRotX = 0, dragRotY = 0, curRotX = 0, curRotY = 0;
    let isDrag = false, lastMX = 0, lastMY = 0, mX = 0, mY = 0;

    const dragLayer = document.getElementById('drag-layer');
    const heroContent = document.getElementById('hero-content');

    const onMouseDown = e => { isDrag = true; lastMX = e.clientX; lastMY = e.clientY; };
    const onMouseUp = () => { isDrag = false; };
    const onMouseMove = e => {
      if (isDrag) {
        dragRotY += (e.clientX - lastMX) * 0.004;
        dragRotX += (e.clientY - lastMY) * 0.004;
        lastMX = e.clientX; lastMY = e.clientY;
      }
      mX = (e.clientX / W - 0.5) * 2; mY = (e.clientY / H - 0.5) * 2;
      if (window.scrollY < H * 0.3 && heroContent) {
        heroContent.style.transform = `translate(${(e.clientX / W - 0.5) * 20 * 0.22}px,${(e.clientY / H - 0.5) * 12 * 0.16}px)`;
      } else if (heroContent) {
        heroContent.style.transform = '';
      }
    };

    if (dragLayer) dragLayer.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);

    let globeTargetY = -22, globeScrollRot = 0;

    const onScroll = () => {
      const sy = window.scrollY;
      const nav = document.getElementById('lp-nav');
      if (nav) nav.classList.toggle('scrolled', sy > 60);

      const RISE_START = 60;
      const RISE_RANGE = H * 0.72;
      const t = Math.min(Math.max((sy - RISE_START) / RISE_RANGE, 0), 1);
      const ease = 1 - Math.pow(1 - t, 3);
      globeTargetY = -22 + ease * (22 + GLOBE_FINAL_Y);

      const extraScroll = Math.max(0, sy - RISE_START - RISE_RANGE);
      globeScrollRot = extraScroll * 0.0006;

      const gSec = document.getElementById('globe-section');
      if (!gSec) return;
      const gTop = gSec.offsetTop, gH = gSec.offsetHeight;
      const gp0 = document.getElementById('gp0'), gp1 = document.getElementById('gp1');
      if (sy >= gTop) {
        const gProgress = Math.min((sy - gTop) / (gH * 0.55), 1);
        if (gp0) gp0.classList.toggle('active', gProgress < 0.65);
        if (gp1) gp1.classList.toggle('active', gProgress >= 0.65);
      } else {
        if (gp0) gp0.classList.toggle('active', t > 0.25);
        if (gp1) gp1.classList.remove('active');
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.lp-step, .lp-p-col').forEach(el => io.observe(el));

    const clock = new THREE.Clock();
    let rafId;
    let active = true;

    function animate() {
      if (!active) return;
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      curRotX += (-mY * 0.18 + dragRotX - curRotX) * 0.04;
      curRotY += (mX * 0.28 + dragRotY - curRotY) * 0.04;
      if (galaxyMesh) { galaxyMesh.rotation.x = 0.2 + curRotX; galaxyMesh.rotation.y = curRotY + t * 0.011; }
      if (globeGroup) {
        globeGroup.position.y += (globeTargetY - globeGroup.position.y) * 0.05;
        globeGroup.rotation.y = t * 0.05 * cfg.globeSpeed + globeScrollRot;
        globeGroup.rotation.x = Math.sin(t * 0.07) * 0.04;
      }
      if (glowSprite && globeGroup) {
        glowSprite.position.set(globeGroup.position.x, globeGroup.position.y, globeGroup.position.z - 1.5);
      }
      renderer.render(scene, camera);
    }
    animate();

    return () => {
      active = false;
      isMounted = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      if (dragLayer) dragLayer.removeEventListener('mousedown', onMouseDown);
      io.disconnect();
      renderer.dispose();
      document.head.removeChild(styleEl);
    };
  }, []);

  return (
    <>
      <canvas id="bg"></canvas>
      <div id="nebula"></div>

      <nav id="lp-nav">
        <a href="/" className="lp-logo">
          <div className="lp-logo-k">K</div>
          <span className="lp-logo-name">Kaloma</span>
        </a>
        <div className="lp-nav-links">
          <a href="/" className="lp-nl">Home</a>
          <a href="/#how" className="lp-nl">How it works</a>
          <a href="/#pricing" className="lp-nl">Pricing</a>
        </div>
        <a href="/search" className="lp-nav-cta">Get Started →</a>
      </nav>

      <div id="hero">
        <div id="drag-layer"></div>
        <div className="glow-v"></div>
        <div className="hero-content" id="hero-content">
          <div className="badge">
            <div className="badge-dot"></div>
            6 agents · 40+ sources · 100+ countries
          </div>
          <h1>Find the scholarships<br /><span className="gold-shine">you actually deserve.</span></h1>
          <p className="hero-sub">Six AI agents scan universities, governments, foundations, and industry bodies — surfacing funding matched precisely to you.</p>
          <div className="hero-ctas">
            <a href="/search" className="lp-btn-gold">Start for Free →</a>
            <a href="/#how" className="lp-btn-ghost">How it works</a>
          </div>
          <p className="hero-fine">Free account · No credit card · Results in ~15 seconds</p>
        </div>
        <div className="scroll-cue">
          <div className="scroll-line"></div>
          <div className="scroll-lbl">Scroll</div>
        </div>
      </div>

      <div id="globe-section">
        <div className="globe-sticky">
          <div className="globe-text-col">
            <div className="globe-phase" id="gp0">
              <div className="lp-eyebrow">Global reach</div>
              <h2 className="globe-h">Scholarships.<br /><em>Everywhere.</em></h2>
              <p className="globe-p">Our AI doesn't just search the obvious places. Six agents scan across 100+ countries in parallel — uncovering opportunities most applicants never find.</p>
            </div>
            <div className="globe-phase" id="gp1" style={{ top: 0 }}>
              <div className="g-stats">
                <div><div className="g-stat-n">100+</div><div className="g-stat-l">Countries with active opportunities</div></div>
                <div><div className="g-stat-n">40+</div><div className="g-stat-l">Sources scanned in parallel</div></div>
                <div><div className="g-stat-n">~15s</div><div className="g-stat-l">From search to matched results</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-solid" id="how">
        <div className="lp-inner">
          <div className="lp-eyebrow">How it works</div>
          <h2 className="lp-section-h">From profile to applications<br />in minutes.</h2>
          <div className="lp-steps">
            <div className="lp-step" style={{ transitionDelay: '0s' }}>
              <div className="lp-step-n">01</div>
              <div>
                <div className="lp-step-title">Build your profile</div>
                <div className="lp-step-desc">Study level, field, nationality, GPA, achievements. Takes about 2 minutes. The more detail you give, the more precisely our agents match you.</div>
              </div>
            </div>
            <div className="lp-step" style={{ transitionDelay: '0.12s' }}>
              <div className="lp-step-n">02</div>
              <div>
                <div className="lp-step-title">AI finds your matches</div>
                <div className="lp-step-desc">Six specialized agents fan out across 40+ sources simultaneously. Each result is scored by win probability, deadline proximity, and fit to your exact profile.</div>
              </div>
            </div>
            <div className="lp-step" style={{ transitionDelay: '0.24s' }}>
              <div className="lp-step-n">03</div>
              <div>
                <div className="lp-step-title">Apply with confidence</div>
                <div className="lp-step-desc">Draft your essay with AI assistance, set deadline reminders, and track every application from a single dashboard. One scholarship changes everything.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="lp-solid" id="pricing">
        <div className="lp-inner" style={{ paddingTop: 72 }}>
          <div className="lp-eyebrow">Pricing</div>
          <h2 className="lp-section-h">Start free.<br />Go Pro when you're ready.</h2>
          <div className="lp-p-grid">
            <div className="lp-p-col" style={{ transitionDelay: '0s' }}>
              <span className="lp-p-badge lp-p-badge-free">Free</span>
              <div className="lp-p-name">Explorer</div>
              <div className="lp-p-amt"><span className="lp-sup">$</span><span className="lp-num">0</span></div>
              <div className="lp-p-period">forever free</div>
              <ul className="lp-p-list">
                <li className="on">1 AI-matched search</li>
                <li className="on">3 results per search</li>
                <li className="on">Save scholarships</li>
                <li className="on">Share scholarship links</li>
                <li>Essay Assistant</li>
                <li>Deadline reminders</li>
                <li>Unlimited searches</li>
              </ul>
              <a href="/search" className="lp-btn-free">Get started free</a>
            </div>
            <div className="lp-p-col" style={{ transitionDelay: '0.1s' }}>
              <span className="lp-p-badge lp-p-badge-pro">Most Popular</span>
              <div className="lp-p-name">Pro</div>
              <div className="lp-p-amt"><span className="lp-sup">$</span><span className="lp-num">3.99</span><span className="lp-sub">/mo</span></div>
              <div className="lp-p-period">or $8.99 / year — save 81%</div>
              <ul className="lp-p-list">
                <li className="on">Unlimited AI-matched searches</li>
                <li className="on">All results unlocked</li>
                <li className="on">✦ Essay Assistant — AI drafts</li>
                <li className="on">🔔 Deadline reminders (30/7/1 day)</li>
                <li className="on">… Best Match — ranked by win %</li>
                <li className="on">Full match scores &amp; reasons</li>
                <li className="on">Save, track &amp; share</li>
              </ul>
              <a href="/search" className="lp-btn-pro">Upgrade to Pro →</a>
            </div>
          </div>
        </div>
      </div>

      <footer className="lp-footer">
        <a href="/" className="lp-logo" style={{ gap: 8 }}>
          <div className="lp-logo-k" style={{ width: 28, height: 28, fontSize: 14, borderRadius: 7 }}>K</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: 'rgba(255,255,255,0.28)' }}>Kaloma</span>
        </a>
        <div className="lp-f-links">
          <a href="/" className="lp-f-link">Home</a>
          <a href="/#how" className="lp-f-link">How it works</a>
          <a href="/#pricing" className="lp-f-link">Pricing</a>
        </div>
        <p className="lp-f-copy">© 2026 Kaloma. All rights reserved.</p>
      </footer>
    </>
  );
}
