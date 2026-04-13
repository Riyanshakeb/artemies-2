gsap.registerPlugin(ScrollTrigger);

const lenis = new Lenis({ duration: 1.05, smoothWheel: true });
requestAnimationFrame(function raf(t){ lenis.raf(t); requestAnimationFrame(raf); });

const bootLines = document.getElementById("bootLines");
const bootProgress = document.getElementById("bootProgress");
const bootPercent = document.getElementById("bootPercent");
const bootPanel = document.getElementById("bootPanel");
const bootSequence = document.getElementById("bootSequence");
const bootMessages = [
  "> Initializing ARTMIS-2...",
  "> Loading flight systems...",
  "> Calibrating navigation...",
  "> Establishing communication...",
  "> Guidance core synchronized.",
];

let bi = 0, bp = 0;
const typeTicker = setInterval(() => {
  if (bi < bootMessages.length) {
    const line = document.createElement("div");
    line.textContent = bootMessages[bi++];
    bootLines.appendChild(line);
  }
  if (Math.random() > 0.7) {
    bootPanel.classList.add("glitch");
    setTimeout(() => bootPanel.classList.remove("glitch"), 90);
  }
}, 450);
const progressTicker = setInterval(() => {
  bp += 2;
  bootProgress.style.width = `${bp}%`;
  bootPercent.textContent = `${bp}%`;
  if (bp >= 100) {
    clearInterval(typeTicker); clearInterval(progressTicker);
    gsap.to(bootSequence, { opacity: 0, scale: 1.08, duration: 1.2, pointerEvents: "none", onComplete: () => bootSequence.remove() });
  }
}, 75);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x04060c, 25, 150);
const camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 1000);
camera.position.set(0, 2.8, 11);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("scene"), antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableDamping: true, enabled: false, minDistance: 3, maxDistance: 22 });

scene.add(new THREE.AmbientLight(0x7f93ff, 0.92));
const sun = new THREE.DirectionalLight(0xffa66c, 2.2); sun.position.set(8, 5, 3); scene.add(sun);
const rim = new THREE.PointLight(0x6fa8ff, 2.5, 50); rim.position.set(-7, -3, -9); scene.add(rim);

const starsGeo = new THREE.BufferGeometry();
const count = 4200;
const arr = new Float32Array(count * 3);
for (let i = 0; i < count; i++) {
  arr[i * 3] = (Math.random() - 0.5) * 280;
  arr[i * 3 + 1] = (Math.random() - 0.5) * 200;
  arr[i * 3 + 2] = (Math.random() - 0.5) * 280;
}
starsGeo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
const stars = new THREE.Points(starsGeo, new THREE.PointsMaterial({ color: 0xdde8ff, size: 0.16, transparent: true, opacity: 0.85 }));
scene.add(stars);

const earth = new THREE.Mesh(new THREE.SphereGeometry(2.2, 64, 64), new THREE.MeshStandardMaterial({ color: 0x1f3f77, emissive: 0x0d2246, roughness: 0.95 }));
earth.position.set(-10, -3.8, -25); scene.add(earth);
const moon = new THREE.Mesh(new THREE.SphereGeometry(1.9, 48, 48), new THREE.MeshStandardMaterial({ color: 0x9ba0aa, roughness: 1, metalness: 0.04 }));
moon.position.set(10, 1.2, -30); scene.add(moon);

const rocket = new THREE.Group();
const body = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.55, 4.2, 32), new THREE.MeshStandardMaterial({ color: 0xe6edf8, metalness: 0.65, roughness: 0.2 }));
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.2, 32), new THREE.MeshStandardMaterial({ color: 0xff7a18, emissive: 0x652404, emissiveIntensity: 0.4 })); nose.position.y = 2.7;
const engine = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.8, 24), new THREE.MeshStandardMaterial({ color: 0x2e3442, metalness: 0.4, roughness: 0.5 })); engine.position.y = -2.35;

const moduleTop = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.2, 24), new THREE.MeshStandardMaterial({ color: 0xc9d2e5, metalness: .45, roughness: .3 }));
moduleTop.position.y = 1.4;
const serviceRing = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.05, 16, 40), new THREE.MeshStandardMaterial({ color: 0xffa56e }));
serviceRing.rotation.x = Math.PI / 2;

const finGeo = new THREE.BoxGeometry(0.08, 0.95, 0.72);
for (let i = 0; i < 4; i++) {
  const fin = new THREE.Mesh(finGeo, new THREE.MeshStandardMaterial({ color: 0xff9f50 }));
  const a = (i / 4) * Math.PI * 2;
  fin.position.set(Math.cos(a) * 0.48, -1.6, Math.sin(a) * 0.48);
  fin.rotation.y = a;
  rocket.add(fin);
}
const plume = new THREE.Mesh(new THREE.ConeGeometry(0.35, 1.6, 16), new THREE.MeshBasicMaterial({ color: 0xff7a18, transparent: true, opacity: 0 }));
plume.position.y = -3.35; plume.rotation.x = Math.PI;
const chute = new THREE.Mesh(new THREE.SphereGeometry(1.1, 24, 16, 0, Math.PI), new THREE.MeshBasicMaterial({ color: 0xff7a18, wireframe: true, transparent: true, opacity: 0 }));
chute.rotation.x = Math.PI; chute.position.y = 3.8;

rocket.add(body, nose, engine, moduleTop, serviceRing, plume, chute);
rocket.position.set(0, -0.8, 0);
scene.add(rocket);

const parts = [nose, moduleTop, serviceRing, engine];
let exploded = false;
document.getElementById("explodeBtn").addEventListener("click", () => {
  exploded = !exploded;
  const offsets = exploded ? [1.6, 2.5, 1.8, -1.8] : [0, 0, 0, 0];
  parts.forEach((p, i) => gsap.to(p.position, { y: (i === 0 ? 2.7 : i === 1 ? 1.4 : i === 2 ? 0 : -2.35) + offsets[i], duration: .8 }));
});

const orbitRing = new THREE.Mesh(new THREE.TorusGeometry(6.8, 0.02, 16, 220), new THREE.MeshBasicMaterial({ color: 0xff7a18, transparent: true, opacity: 0 }));
orbitRing.rotation.x = Math.PI / 2.4; orbitRing.position.copy(moon.position); scene.add(orbitRing);

const curve = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-10, -4, -25),
  new THREE.Vector3(-1, 3, -21),
  new THREE.Vector3(7, 2, -15),
  new THREE.Vector3(10, 1, -30),
  new THREE.Vector3(3, 4, -16),
  new THREE.Vector3(-7, 2, -10),
  new THREE.Vector3(0, -1, 1),
]);
const points = curve.getPoints(260);
const trajectoryGeo = new THREE.BufferGeometry().setFromPoints(points);
const trajectoryLine = new THREE.Line(trajectoryGeo, new THREE.LineBasicMaterial({ color: 0x76a8ff, transparent: true, opacity: 0.15 }));
scene.add(trajectoryLine);

const phaseLabel = document.getElementById("phaseLabel");
const warpFx = document.getElementById("warpFx");
const reentryFx = document.getElementById("reentryFx");

let phase = 1;
const setPhase = (n, label) => { phase = n; phaseLabel.textContent = `// PHASE ${String(n).padStart(2, "0")}: ${label}`; };

const statAltitude = document.getElementById("statAltitude");
const statSpeed = document.getElementById("statSpeed");
const statDistance = document.getElementById("statDistance");
const bars = [...document.querySelectorAll(".telemetry-bars i")];
function setStats(stage) {
  statAltitude.textContent = `${Math.round(stage * 58 + Math.random() * 20)} km`;
  statSpeed.textContent = `${(2.2 + stage * 1.4 + Math.random()).toFixed(1)} km/s`;
  statDistance.textContent = `${Math.round(stage * 58200 + Math.random() * 9000).toLocaleString()} km`;
  bars.forEach((b, i) => b.style.opacity = String(Math.max(0.25, ((i + stage) % 5) / 5 + 0.2)));
}
setStats(1);

const countdown = document.getElementById("countdown");
let t = 10;
const ci = setInterval(() => {
  t--; countdown.textContent = `T-${Math.max(t, 0)}`;
  if (t <= 0) { clearInterval(ci); countdown.textContent = "LIFTOFF"; gsap.to(plume.material, { opacity: 0.95, duration: 0.4, repeat: -1, yoyo: true }); }
}, 1000);

const tl = gsap.timeline({ scrollTrigger: { trigger: "#story", start: "top top", end: "bottom bottom", scrub: 1.2 } });
tl
.to(rocket.position, { y: 7, z: -5, duration: 1.2 })
.to(camera.position, { y: 5, z: 9, duration: 1.2 }, "<")
.to(earth.position, { x: -8, y: -8, z: -37, duration: 1 })
.to(rocket.rotation, { z: 0.15, duration: 0.8 })
.to(rocket.position, { x: 6, y: 2.2, z: -16, duration: 1.2 })
.to(warpFx, { opacity: 0.9, duration: 0.6 })
.to(stars.material, { size: 0.34, duration: 0.5 }, "<")
.to(warpFx, { opacity: 0, duration: 0.6 })
.to(moon.position, { z: -12, x: 4, y: 1.5, duration: 1.2 })
.to(orbitRing.material, { opacity: 0.9, duration: 0.8 })
.to(rocket.position, {
  x: 4, y: 1.2, z: -10, duration: 1,
  onUpdate: () => {
    const tt = performance.now() * 0.0013;
    rocket.position.x = 4 + Math.cos(tt) * 2.5;
    rocket.position.y = 1.2 + Math.sin(tt) * 1.1;
  }
})
.to(rocket.position, { x: -5, y: 3, z: -2, duration: 1.3 })
.to(rocket.rotation, { x: -0.62, z: -0.2, duration: 0.6 }, "<")
.to(reentryFx, { opacity: 1, duration: 0.7 })
.to(sun, { intensity: 3.4, duration: 0.6 }, "<")
.to(camera.position, { x: 0, y: 2, z: 5.6, duration: 0.6 }, "<")
.to(rocket.position, { x: 0, y: -1.4, z: 1, duration: 1 })
.to(chute.material, { opacity: 0.85, duration: 0.4 })
.to(plume.material, { opacity: 0.1, duration: 1 }, "<")
.to(reentryFx, { opacity: 0, duration: 0.7 });

[...document.querySelectorAll(".story-section")].forEach((section, idx) => {
  ScrollTrigger.create({
    trigger: section,
    start: "top center",
    end: "bottom center",
    onEnter: () => { setStats(idx + 1); setPhase(idx + 2, section.dataset.label); },
    onEnterBack: () => { setStats(idx + 1); setPhase(idx + 2, section.dataset.label); },
  });
});

const inspectionPanel = document.getElementById("inspectionPanel");
document.getElementById("inspectBtn").addEventListener("click", () => {
  const open = inspectionPanel.classList.toggle("open");
  inspectionPanel.setAttribute("aria-hidden", String(!open));
  controls.enabled = open;
});
inspectionPanel.querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    const i = Number(item.dataset.focus || 0);
    gsap.to(rocket.rotation, { y: i * 0.9, x: 0.1 * (i + 1), duration: 0.6 });
    gsap.to(controls.target, { x: [0, 0.6, -0.4][i], y: [0, 0.2, 0.5][i], z: 0, duration: 0.6 });
  });
});

const reticle = document.getElementById("reticle");
addEventListener("pointermove", (e) => { reticle.style.left = `${e.clientX}px`; reticle.style.top = `${e.clientY}px`; });

document.querySelectorAll(".feature-card, .magnetic-btn, .ghost-btn").forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const dy = (e.clientY - (r.top + r.height / 2)) / r.height;
    gsap.to(el, { x: dx * 10, y: dy * 10, duration: 0.25, overwrite: true });
  });
  el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.35 }));
});

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

function animate() {
  const t = performance.now() * 0.0006;
  stars.rotation.y = t * 0.03;
  earth.rotation.y += 0.0012;
  moon.rotation.y += 0.0008;

  const p = curve.getPoint((Math.sin(t * 0.3) + 1) / 2);
  trajectoryLine.material.opacity = 0.08 + Math.abs(Math.sin(t * 2)) * 0.25;
  orbitRing.rotation.z += 0.002;
  if (!controls.enabled && phase >= 6) {
    rocket.lookAt(p);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
