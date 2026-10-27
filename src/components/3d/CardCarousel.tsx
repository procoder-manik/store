"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Kind, Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";
import type { Nudge } from "./HangerRail";

export type CarouselLayout = "arc" | "coverflow" | "diagonal" | "stack" | "wave";

const CW = 1.5, CH = 1.9;                  // photo size
const BH = CH + 0.62;                      // card height with its label strip
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const K = 1.08; // overall card size
const damp = THREE.MathUtils.damp;

/* ---------- where each card sits, by its distance t from the centre ---------- */
type Pose = { x: number; y: number; z: number; ry: number; rz: number; s: number; o: number };
function pose(layout: CarouselLayout, t: number): Pose {
  const a = Math.abs(t), side = Math.sign(t);
  if (layout === "arc") {
    const th = t * 0.4, R = 5.0;
    return { x: Math.sin(th) * R, y: -0.07 * a * a, z: (Math.cos(th) - 1) * R, ry: -th, rz: 0, s: K * (1.04 - Math.min(a, 3) * 0.08), o: clamp(1.25 - (a - 2.8) * 0.9, 0, 1) };
  }
  if (layout === "coverflow") {
    const s = Math.min(1, a);
    return { x: t * 0.74 + side * 1.05 * s, y: 0, z: -s * 0.95 - Math.max(0, a - 1) * 0.22, ry: -side * s * 0.98, rz: 0, s: K * (1.02 - Math.min(a, 3) * 0.04), o: clamp(1.25 - (a - 2.8) * 0.9, 0, 1) };
  }
  if (layout === "stack") {
    // A deck: the card you are on is on top, passed cards fly off to the left, the rest wait behind it.
    if (t < 0) return { x: t * 2.5 - 0.2, y: 0.12 * a, z: 0.15, ry: 0.55, rz: -t * 0.16, s: K, o: clamp(1 - a * 1.05, 0, 1) };
    return { x: t * 0.58, y: -t * 0.05, z: -t * 0.5, ry: -t * 0.04, rz: t * 0.055, s: K * (1 - Math.min(t, 4) * 0.05), o: clamp(1.2 - (t - 3.2) * 0.9, 0, 1) };
  }
  if (layout === "wave") {
    const ph = t * 0.85;
    return { x: t * 1.38, y: Math.sin(ph) * 0.58, z: Math.cos(ph) * 0.65 - 0.65, ry: clamp(-Math.sin(ph) * 0.4, -0.5, 0.5), rz: Math.cos(ph) * 0.06 * Math.sign(t || 1), s: K * (1 - Math.min(a, 4) * 0.05), o: clamp(1.25 - (a - 3.0) * 0.8, 0, 1) };
  }
  // diagonal: cards sweep along an S curve from the lower left corner to the upper right
  return { x: t * 1.4, y: Math.tanh(t * 0.55) * 0.8 + t * 0.1 - 0.05, z: -a * 0.45, ry: clamp(-t * 0.22, -0.55, 0.55), rz: clamp(-t * 0.09, -0.3, 0.3), s: K * (1.0 - Math.min(a, 4) * 0.07), o: clamp(1.25 - (a - 3.0) * 0.8, 0, 1) };
}

/* ---------- card artwork ---------- */
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => clamp(v + amt, 0, 255).toString(16).padStart(2, "0");
  return `#${c(n >> 16)}${c((n >> 8) & 255)}${c(n & 255)}`;
};
function artSvg(kind: Kind, color: string) {
  const dark = shade(color, -30), light = shade(color, 24);
  const body: Record<Kind, string> = {
    tee: `<path d="M68 36 Q100 62 132 36 L176 56 L196 104 L162 118 L150 96 L150 216 Q100 226 50 216 L50 96 L38 118 L4 104 L24 56 Z" fill="${color}"/><path d="M68 36 Q100 62 132 36 Q100 50 68 36 Z" fill="${dark}"/>`,
    hoodie: `<ellipse cx="100" cy="50" rx="36" ry="30" fill="${dark}"/><path d="M70 54 Q100 74 130 54 L174 72 L198 196 L170 202 L152 118 L152 224 Q100 234 48 224 L48 118 L30 202 L2 196 L26 72 Z" fill="${color}"/><path d="M74 54 Q100 80 126 54 Q100 34 74 54 Z" fill="rgba(0,0,0,0.38)"/><path d="M70 168 L130 168 L140 206 L60 206 Z" fill="${light}" opacity="0.55"/>`,
    cover: `<rect x="30" y="150" width="140" height="38" rx="9" fill="${dark}"/><rect x="26" y="114" width="148" height="40" rx="9" fill="${color}"/><rect x="34" y="80" width="132" height="38" rx="9" fill="${light}"/><rect x="40" y="46" width="120" height="38" rx="9" fill="${color}"/>`,
    decor: `<path d="M100 18 L70 68 M100 18 L130 68" stroke="#8a8f98" stroke-width="2"/><circle cx="100" cy="132" r="74" fill="${color}"/><circle cx="100" cy="132" r="64" fill="#dfe6ec"/><path d="M62 160 L96 84 L108 84 L74 160 Z" fill="rgba(255,255,255,0.55)"/>`,
  };
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#eceef1"/></linearGradient></defs><rect width="200" height="250" fill="url(#b)"/><g transform="translate(0,8)">${body[kind]}</g></svg>`;
}

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function labelTexture(name: string, price: string) {
  const w = 600, h = 150;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const c = cv.getContext("2d") as CanvasRenderingContext2D;
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--ff-display").trim() || "system-ui, sans-serif";
  c.fillStyle = "#17191e"; c.textBaseline = "alphabetic";
  c.font = `600 44px ${fam}`;
  let t = name;
  while (c.measureText(t).width > w - 40 && t.length > 3) t = t.slice(0, -1);
  if (t !== name) t = t.trimEnd() + "...";
  c.fillText(t, 8, 62);
  c.fillStyle = "#5e6470"; c.font = `500 40px ${fam}`;
  c.fillText(price, 8, 118);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function softShadow() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 128;
  const c = cv.getContext("2d") as CanvasRenderingContext2D;
  const g = c.createRadialGradient(64, 64, 8, 64, 64, 62);
  g.addColorStop(0, "rgba(0,0,0,0.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
  c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(cv);
}

/* ---------- one card ---------- */
type CardProps = { p: Product; i: number; layout: CarouselLayout; pos: MutableRefObject<number>; target: MutableRefObject<number>; selected: boolean; locked: boolean; offX: number; shadow: THREE.Texture; onPick: (i: number) => void };

function Card({ p, i, layout, pos, target, selected, locked, offX, shadow, onPick }: CardProps) {
  const g = useRef<THREE.Group>(null);
  const [photo, setPhoto] = useState<THREE.Texture | null>(null);
  const [label, setLabel] = useState<THREE.CanvasTexture | null>(null);
  const sel = useRef(1);
  const xOff = useRef(0);

  useEffect(() => {
    let alive = true;
    let made: THREE.Texture | null = null;
    const art = () => {
      const cv = document.createElement("canvas");
      cv.width = 480; cv.height = 600;
      const ctx = cv.getContext("2d") as CanvasRenderingContext2D;
      ctx.fillStyle = "#eef0f3"; ctx.fillRect(0, 0, 480, 600);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
      const img = new Image();
      img.onload = () => { if (!alive) return; ctx.drawImage(img, 0, 0, 480, 600); t.needsUpdate = true; };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(artSvg(p.kind, p.colors[0].hex))}`;
      made = t; setPhoto(t);
    };
    if (!p.image) { art(); return () => { alive = false; made?.dispose(); }; }
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(p.image, (t) => {
      if (!alive) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
      const img = t.image as { width: number; height: number };
      const ca = CW / CH, ia = img.width / img.height;
      if (ia > ca) { t.repeat.set(ca / ia, 1); t.offset.set((1 - ca / ia) / 2, 0); } else { t.repeat.set(1, ia / ca); t.offset.set(0, (1 - ia / ca) / 2); }
      made = t; setPhoto(t);
    }, undefined, () => { if (alive) art(); });
    return () => { alive = false; made?.dispose(); };
  }, [p.image, p.kind, p.colors]);

  useEffect(() => {
    let alive = true;
    let t: THREE.CanvasTexture | null = null;
    (document.fonts?.ready ?? Promise.resolve()).then(() => { if (alive) { t = labelTexture(p.name, formatPrice(p.basePrice)); setLabel(t); } });
    return () => { alive = false; t?.dispose(); };
  }, [p.name, p.basePrice]);

  const geo = useMemo(() => new THREE.ExtrudeGeometry(roundedRect(CW + 0.16, BH, 0.07), { depth: 0.035, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2, curveSegments: 10 }), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const body = useMemo(() => new THREE.MeshBasicMaterial({ color: "#f8f5ef", transparent: true, toneMapped: false }), []);
  const photoMat = useMemo(() => new THREE.MeshBasicMaterial({ map: photo, color: photo ? 0xffffff : 0xe8e8e8, toneMapped: false, transparent: true }), [photo]);
  const labelMat = useMemo(() => new THREE.MeshBasicMaterial({ map: label, transparent: true, toneMapped: false }), [label]);
  const shadowMat = useMemo(() => new THREE.MeshBasicMaterial({ map: shadow, transparent: true, depthWrite: false, toneMapped: false }), [shadow]);
  useEffect(() => () => { body.dispose(); }, [body]);
  useEffect(() => () => photoMat.dispose(), [photoMat]);
  useEffect(() => () => labelMat.dispose(), [labelMat]);
  useEffect(() => () => shadowMat.dispose(), [shadowMat]);

  useFrame((state, dt) => {
    const grp = g.current;
    if (!grp) return;
    const t = i - pos.current;
    const ps = pose(layout, t);
    sel.current = damp(sel.current, selected ? 1.16 : 1, 6, dt);
    xOff.current = damp(xOff.current, offX, 4, dt);
    const dim = locked && !selected ? 0.4 : 1;
    const float = Math.sin(state.clock.elapsedTime * 1.1 + i * 0.9) * 0.025;
    grp.position.set(ps.x + xOff.current, ps.y + float + 0.14, ps.z + (selected ? 0.5 : 0));
    grp.rotation.set(0, ps.ry, ps.rz);
    grp.scale.setScalar(ps.s * sel.current);
    grp.visible = ps.o > 0.01;
    const o = ps.o * dim;
    body.opacity = o; photoMat.opacity = o; labelMat.opacity = o; shadowMat.opacity = o * 0.45;
  });

  const hit = {
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta <= 6) onPick(i); },
    onPointerOver: () => { document.body.style.cursor = "pointer"; },
    onPointerOut: () => { document.body.style.cursor = ""; },
  };
  const photoY = BH / 2 - 0.08 - CH / 2;
  const labelY = -BH / 2 + 0.12 + 0.18;
  return (
    <group ref={g}>
      <mesh material={shadowMat} position={[0.04, -0.14, -0.1]}><planeGeometry args={[CW + 0.7, BH + 0.7]} /></mesh>
      <mesh geometry={geo} material={body} position={[0, 0, -0.02]} {...hit} />
      <mesh material={photoMat} position={[0, photoY, 0.03]} {...hit}><planeGeometry args={[CW, CH]} /></mesh>
      <mesh material={labelMat} position={[0, labelY, 0.03]}><planeGeometry args={[CW, 0.375]} /></mesh>
    </group>
  );
}

/* ---------- scene ---------- */
type Props = { products: Product[]; selectedId: string | null; colorHex: string; onSelect: (id: string | null) => void; dark: boolean; nudge: Nudge; onIndex: (i: number) => void; layout: CarouselLayout };

function Rig({ products, selectedId, onSelect, nudge, onIndex, layout, dragged }: Omit<Props, "dark" | "colorHex"> & { dragged: MutableRefObject<boolean> }) {
  const gl = useThree((s) => s.gl);
  const width = useThree((s) => s.size.width);
  const n = products.length;
  const pos = useRef(0);
  const target = useRef(0);
  const locked = useRef(false);
  const last = useRef(-1);
  const shadow = useMemo(() => softShadow(), []);
  useEffect(() => () => shadow.dispose(), [shadow]);
  locked.current = !!selectedId;

  // Start in the middle so there are cards on both sides.
  useEffect(() => { const mid = layout === "stack" ? 0 : Math.floor((n - 1) / 2); target.current = mid; pos.current = mid; }, [products, n, layout]);
  useEffect(() => { const i = products.findIndex((p) => p.id === selectedId); if (i >= 0) target.current = i; }, [selectedId, products]);
  useEffect(() => { if (nudge.n) target.current = clamp(Math.round(target.current) + nudge.dir, 0, n - 1); }, [nudge, n]);

  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y"; el.style.cursor = "grab";
    let down = false, lastX = 0, vel = 0, moved = 0, timer: number | undefined;
    const snap = (extra = 0) => { target.current = clamp(Math.round(target.current + extra), 0, n - 1); };
    const pd = (e: PointerEvent) => { down = true; lastX = e.clientX; vel = 0; moved = 0; dragged.current = false; el.style.cursor = "grabbing"; };
    const pm = (e: PointerEvent) => {
      if (!down || locked.current) return;
      const dx = e.clientX - lastX; lastX = e.clientX; moved += Math.abs(dx);
      if (moved > 6) dragged.current = true;
      vel = -dx * 0.012;
      target.current = clamp(target.current - dx * 0.012, 0, n - 1);
    };
    const pu = () => { if (!down) return; down = false; el.style.cursor = "grab"; if (!locked.current) snap(vel * 6); };
    const wh = (e: WheelEvent) => {
      if (locked.current) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const next = clamp(target.current + d * 0.004, 0, n - 1);
      if (next === target.current) return;
      e.preventDefault(); target.current = next;
      window.clearTimeout(timer); timer = window.setTimeout(() => snap(), 160);
    };
    el.addEventListener("pointerdown", pd); window.addEventListener("pointermove", pm); window.addEventListener("pointerup", pu); el.addEventListener("wheel", wh, { passive: false });
    return () => { window.clearTimeout(timer); el.removeEventListener("pointerdown", pd); window.removeEventListener("pointermove", pm); window.removeEventListener("pointerup", pu); el.removeEventListener("wheel", wh); };
  }, [gl, n, dragged]);

  useFrame((s, dt) => {
    pos.current = damp(pos.current, target.current, 5, dt);
    const idx = clamp(Math.round(pos.current), 0, Math.max(0, n - 1));
    if (idx !== last.current) { last.current = idx; onIndex(idx); }
    s.camera.position.x = damp(s.camera.position.x, s.pointer.x * 0.35, 3, dt);
    s.camera.position.y = damp(s.camera.position.y, s.pointer.y * 0.2, 3, dt);
    s.camera.lookAt(0, 0, 0);
  });

  const offX = selectedId && width >= 900 ? -1.1 : 0;
  return (
    <>
      {products.map((p, i) => (
        <Card key={p.id} p={p} i={i} layout={layout} pos={pos} target={target} selected={p.id === selectedId} locked={!!selectedId} offX={offX} shadow={shadow}
          onPick={(k) => { if (selectedId || Math.abs(k - target.current) < 0.5) onSelect(products[k].id); else target.current = k; }} />
      ))}
    </>
  );
}

export default function CardCarousel(props: Props) {
  const dragged = useRef(false);
  return (
    <Canvas flat camera={{ position: [0, 0, 6.0], fov: 38 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} onPointerMissed={() => { if (!dragged.current) props.onSelect(null); }}>
      <ambientLight intensity={props.dark ? 0.75 : 1.15} />
      <directionalLight position={[-2, 3, 5]} intensity={props.dark ? 1.2 : 1.5} />
      <Rig {...props} dragged={dragged} />
    </Canvas>
  );
}
