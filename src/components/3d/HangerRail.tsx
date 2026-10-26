"use client";

import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Kind, Product } from "@/lib/demo-products";
import { formatPrice } from "@/lib/config";

const SPACING = 2;
const RAIL_Y = 1.35;
const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const damp = THREE.MathUtils.damp;

/* ---------- shared textures and materials ---------- */

type Shared = {
  weave: THREE.CanvasTexture; folds: THREE.CanvasTexture; quilt: THREE.CanvasTexture; glass: THREE.CanvasTexture;
  wood: THREE.MeshStandardMaterial; metal: THREE.MeshStandardMaterial; dark: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial; string: THREE.MeshStandardMaterial; glassMat: THREE.MeshBasicMaterial;
};

function canvasTex(size: number, draw: (c: CanvasRenderingContext2D, s: number) => void) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  draw(cv.getContext("2d") as CanvasRenderingContext2D, size);
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}

function makeShared(): Shared {
  const weave = canvasTex(128, (c, s) => {
    for (let y = 0; y < s; y += 4) for (let x = 0; x < s; x += 4) { c.fillStyle = ((x + y) / 4) % 2 ? "#a2a2a2" : "#666"; c.fillRect(x, y, 4, 4); }
  });
  weave.repeat.set(10, 10);

  const folds = canvasTex(256, (c, s) => {
    c.fillStyle = "#fff"; c.fillRect(0, 0, s, s);
    for (let i = 0; i < 9; i++) {
      const x = ((i + 0.5) / 9) * s + (Math.random() - 0.5) * 22;
      const g = c.createLinearGradient(x - 15, 0, x + 15, 0);
      g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.5, `rgba(0,0,0,${0.05 + Math.random() * 0.08})`); g.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = g; c.fillRect(x - 15, 0, 30, s);
    }
    const v = c.createRadialGradient(s / 2, s / 2, s * 0.3, s / 2, s / 2, s * 0.75);
    v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.14)");
    c.fillStyle = v; c.fillRect(0, 0, s, s);
  });
  folds.repeat.set(1 / 1.8, 1 / 1.5); folds.offset.set(0.5, 0.52);

  const quilt = canvasTex(128, (c, s) => {
    c.fillStyle = "#a0a0a0"; c.fillRect(0, 0, s, s);
    c.strokeStyle = "#4a4a4a"; c.lineWidth = 4; c.beginPath();
    c.moveTo(0, 0); c.lineTo(s, s); c.moveTo(s, 0); c.lineTo(0, s); c.stroke();
  });
  quilt.repeat.set(4, 5);

  const glass = canvasTex(256, (c, s) => {
    const g = c.createRadialGradient(s * 0.4, s * 0.35, s * 0.05, s / 2, s / 2, s * 0.6);
    g.addColorStop(0, "#f6f9fb"); g.addColorStop(1, "#aab7c2");
    c.fillStyle = g; c.fillRect(0, 0, s, s);
    c.fillStyle = "rgba(255,255,255,0.45)"; c.beginPath();
    c.moveTo(s * 0.15, s * 0.7); c.lineTo(s * 0.45, s * 0.1); c.lineTo(s * 0.58, s * 0.1); c.lineTo(s * 0.28, s * 0.7); c.fill();
  });
  glass.wrapS = glass.wrapT = THREE.ClampToEdgeWrapping;

  return {
    weave, folds, quilt, glass,
    wood: new THREE.MeshStandardMaterial({ color: "#b48a60", roughness: 0.55 }),
    metal: new THREE.MeshStandardMaterial({ color: "#9aa0aa", metalness: 0.7, roughness: 0.35 }),
    dark: new THREE.MeshStandardMaterial({ color: "#2b2d31", roughness: 0.5, metalness: 0.3 }),
    paper: new THREE.MeshStandardMaterial({ color: "#f4f1ea", roughness: 0.9 }),
    string: new THREE.MeshStandardMaterial({ color: "#e8e3d6", roughness: 0.9 }),
    glassMat: new THREE.MeshBasicMaterial({ map: glass, toneMapped: false }),
  };
}

function useShared() {
  const [sh, setSh] = useState<Shared | null>(null);
  useEffect(() => {
    const s = makeShared();
    setSh(s);
    return () => { Object.values(s).forEach((v) => v.dispose()); };
  }, []);
  return sh;
}

/* ---------- geometry ---------- */

function roundedRect(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function extrude(s: THREE.Shape, depth: number, bevel = 0.012) {
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 16 });
  g.translate(0, 0, -depth / 2);
  return g;
}

function garmentShape(hoodie: boolean) {
  const s = new THREE.Shape();
  const [ox, oy] = hoodie ? [0.9, -0.4] : [0.8, 0.2];
  const ay = hoodie ? 0.18 : 0.22;
  const right: [number, number][] = [[0.52, 0.54], [ox, oy], [ox - 0.15, oy - 0.13], [0.43, ay], [0.42, -0.66]];
  s.moveTo(-0.18, 0.6);
  s.quadraticCurveTo(0, hoodie ? 0.5 : 0.43, 0.18, 0.6);
  right.forEach(([x, y]) => s.lineTo(x, y));
  s.quadraticCurveTo(0, -0.71, -0.42, -0.66);
  [...right].reverse().slice(1).forEach(([x, y]) => s.lineTo(-x, y));
  s.closePath();
  return s;
}

type Mode = "card" | Kind;

function buildGeos(mode: Mode): Record<string, THREE.BufferGeometry> {
  if (mode === "tee") return { main: extrude(garmentShape(false), 0.07, 0.014) };
  if (mode === "hoodie") {
    const hood = new THREE.Shape(); hood.absellipse(0, 0.52, 0.27, 0.25, 0, Math.PI * 2, false, 0);
    const pocket = new THREE.Shape(); pocket.moveTo(-0.27, 0.1); pocket.lineTo(0.27, 0.1); pocket.lineTo(0.22, -0.12); pocket.lineTo(-0.22, -0.12); pocket.closePath();
    return { main: extrude(garmentShape(true), 0.07, 0.014), hood: extrude(hood, 0.05), pocket: extrude(pocket, 0.02, 0.006) };
  }
  if (mode === "cover") return { body: extrude(roundedRect(0.98, 1.28, 0.05), 0.07), fold: extrude(roundedRect(1, 0.34, 0.05), 0.09) };
  if (mode === "decor") return { ring: new THREE.TorusGeometry(0.46, 0.035, 16, 56), disc: new THREE.CircleGeometry(0.43, 56) };
  return { body: extrude(roundedRect(1.06, 1.34, 0.04), 0.03, 0.006), photo: new THREE.PlaneGeometry(0.94, 1.175) };
}

function drawTag(name: string, price: string) {
  const w = 512, h = 256;
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const c = cv.getContext("2d") as CanvasRenderingContext2D;
  c.fillStyle = "#f7f4ec"; c.beginPath(); c.roundRect(6, 6, w - 12, h - 12, 24); c.fill();
  c.strokeStyle = "rgba(0,0,0,0.12)"; c.lineWidth = 3; c.stroke();
  c.globalCompositeOperation = "destination-out"; c.beginPath(); c.arc(46, h / 2, 13, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = "source-over";
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--font-display").trim() || "system-ui, sans-serif";
  c.fillStyle = "#17191e"; c.textBaseline = "alphabetic";
  c.font = `600 42px ${fam}`;
  let t = name;
  while (c.measureText(t).width > 380 && t.length > 3) t = t.slice(0, -1);
  if (t !== name) t = t.trimEnd() + "...";
  c.fillText(t, 92, 112);
  c.font = `700 58px ${fam}`;
  c.fillText(price, 92, 190);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function Thread({ a, b }: { a: [number, number]; b: [number, number] }) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 0.03]} rotation={[0, 0, Math.atan2(dy, dx)]}>
      <boxGeometry args={[Math.hypot(dx, dy), 0.007, 0.007]} />
      <meshBasicMaterial color="#8a8f98" />
    </mesh>
  );
}

/* ---------- one product on the rail ---------- */

type ItemProps = { p: Product; i: number; selected: boolean; dim: boolean; colorHex: string; onSelect: (id: string) => void; sh: Shared; rot: MutableRefObject<number> };

function Item({ p, i, selected, dim, colorHex, onSelect, sh, rot }: ItemProps) {
  const swing = useRef<THREE.Group>(null);
  const tagRef = useRef<THREE.Group>(null);
  const hover = useRef(false);
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  const [failed, setFailed] = useState(false);
  const [tagTex, setTagTex] = useState<THREE.CanvasTexture | null>(null);
  const mode: Mode = p.image && !failed ? "card" : p.kind;
  const target = useMemo(() => new THREE.Color(), []);

  useEffect(() => {
    if (!p.image) return;
    let alive = true;
    setFailed(false);
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(p.image, (t) => {
      if (!alive) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      const img = t.image as { width: number; height: number };
      const ca = 0.94 / 1.175, ia = img.width / img.height;
      if (ia > ca) { t.repeat.set(ca / ia, 1); t.offset.set((1 - ca / ia) / 2, 0); }
      else { t.repeat.set(1, ia / ca); t.offset.set(0, (1 - ia / ca) / 2); }
      setTex(t);
    }, undefined, () => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [p.image]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);

  useEffect(() => {
    let alive = true;
    let t: THREE.CanvasTexture | null = null;
    (document.fonts?.ready ?? Promise.resolve()).then(() => { if (alive) { t = drawTag(p.name, formatPrice(p.basePrice)); setTagTex(t); } });
    return () => { alive = false; t?.dispose(); };
  }, [p.name, p.basePrice]);

  const geos = useMemo(() => buildGeos(mode), [mode]);
  useEffect(() => () => { Object.values(geos).forEach((g) => g.dispose()); }, [geos]);

  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    color: p.colors[0].hex,
    roughness: mode === "decor" ? 0.4 : 0.88,
    metalness: mode === "decor" ? 0.5 : 0,
    side: THREE.DoubleSide,
    bumpMap: mode === "cover" ? sh.quilt : mode === "tee" || mode === "hoodie" ? sh.weave : null,
    bumpScale: mode === "cover" ? 1.4 : 0.5,
    map: mode === "tee" || mode === "hoodie" ? sh.folds : null,
  }), [mode, p.colors, sh]);
  useEffect(() => () => mat.dispose(), [mat]);

  const photoMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, color: tex ? 0xffffff : 0xe3e1dc, toneMapped: false }), [tex]);
  useEffect(() => () => photoMat.dispose(), [photoMat]);
  const tagMat = useMemo(() => new THREE.MeshBasicMaterial({ map: tagTex, transparent: true, toneMapped: false }), [tagTex]);
  useEffect(() => () => tagMat.dispose(), [tagMat]);

  useFrame((state, dt) => {
    const g = swing.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const sway = Math.sin(t * 1.1 + i * 1.3) * 0.025 + (hover.current ? Math.sin(t * 7) * 0.03 : 0);
    g.rotation.z = damp(g.rotation.z, selected ? 0 : sway, 4, dt);
    g.rotation.y = damp(g.rotation.y, selected ? rot.current + Math.sin(t * 0.6) * 0.12 : 0, 6, dt);
    g.position.z = damp(g.position.z, selected ? 1.2 : dim ? -0.35 : 0, 5, dt);
    g.position.y = damp(g.position.y, selected ? RAIL_Y - 0.12 : RAIL_Y, 5, dt);
    g.scale.setScalar(damp(g.scale.x, selected ? 1.42 : dim ? 0.92 : 1, 5, dt));
    if (tagRef.current) tagRef.current.scale.setScalar(damp(tagRef.current.scale.x, selected ? 0.001 : 1, 8, dt));
    if (mode !== "card") mat.color.lerp(target.set(selected ? colorHex : p.colors[0].hex), Math.min(1, dt * 8));
  });

  const hit = {
    onClick: (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); if (e.delta <= 6) onSelect(p.id); },
    onPointerOver: () => { hover.current = true; },
    onPointerOut: () => { hover.current = false; },
  };

  const decor = mode === "decor";
  const anchor: [number, number] = decor ? [0.386, -0.45] : [0.47, -0.31];
  const hole: [number, number] = [anchor[0] + 0.03, anchor[1] - 0.3];

  return (
    <group position={[i * SPACING, 0, 0]}>
      <group ref={swing} position={[0, RAIL_Y, 0]}>
        <mesh rotation={[0, Math.PI / 2, 0]} material={sh.metal}><torusGeometry args={[0.045, 0.009, 8, 24]} /></mesh>
        <mesh position={[0, -0.09, 0]} material={sh.metal}><cylinderGeometry args={[0.009, 0.009, 0.14, 8]} /></mesh>

        {!decor && (
          <>
            <mesh position={[-0.22, -0.228, 0]} rotation={[0, 0, 0.3]} material={sh.wood} castShadow><boxGeometry args={[0.46, 0.026, 0.03]} /></mesh>
            <mesh position={[0.22, -0.228, 0]} rotation={[0, 0, -0.3]} material={sh.wood} castShadow><boxGeometry args={[0.46, 0.026, 0.03]} /></mesh>
          </>
        )}

        {(mode === "card" || mode === "cover") && (
          <>
            <mesh position={[0, -0.31, 0]} material={sh.wood} castShadow><boxGeometry args={[0.96, 0.03, 0.035]} /></mesh>
            <mesh position={[-0.3, -0.345, 0]} material={sh.dark} castShadow><boxGeometry args={[0.07, 0.1, 0.06]} /></mesh>
            <mesh position={[0.3, -0.345, 0]} material={sh.dark} castShadow><boxGeometry args={[0.07, 0.1, 0.06]} /></mesh>
          </>
        )}

        {mode === "card" && (
          <group position={[0, -0.99, 0]}>
            <mesh geometry={geos.body} material={sh.paper} castShadow {...hit} />
            <mesh geometry={geos.photo} material={photoMat} position={[0, 0.045, 0.024]} {...hit} />
          </group>
        )}

        {mode === "cover" && (
          <group position={[0, -0.96, 0]}>
            <mesh geometry={geos.body} material={mat} castShadow {...hit} />
            <mesh geometry={geos.fold} material={mat} position={[0, 0.47, 0.05]} castShadow {...hit} />
          </group>
        )}

        {(mode === "tee" || mode === "hoodie") && (
          <group position={[0, -0.77, 0]}>
            <mesh geometry={geos.main} material={mat} castShadow {...hit} />
            {mode === "hoodie" && (
              <>
                <mesh geometry={geos.hood} material={mat} position={[0, 0, -0.07]} />
                <mesh geometry={geos.pocket} material={mat} position={[0, -0.3, 0.05]} {...hit} />
                <mesh position={[-0.07, 0.3, 0.06]} material={sh.string}><cylinderGeometry args={[0.008, 0.008, 0.28, 8]} /></mesh>
                <mesh position={[0.07, 0.3, 0.06]} material={sh.string}><cylinderGeometry args={[0.008, 0.008, 0.28, 8]} /></mesh>
              </>
            )}
          </group>
        )}

        {decor && (
          <>
            <Thread a={[0, -0.16]} b={[-0.194, -0.283]} />
            <Thread a={[0, -0.16]} b={[0.194, -0.283]} />
            <group position={[0, -0.7, 0]}>
              <mesh geometry={geos.ring} material={mat} castShadow {...hit} />
              <mesh geometry={geos.disc} material={sh.glassMat} position={[0, 0, -0.005]} {...hit} />
            </group>
          </>
        )}

        <Thread a={anchor} b={hole} />
        <group ref={tagRef} position={[hole[0], hole[1], 0.08]} rotation={[0, 0, -0.1]}>
          <mesh position={[0.2225, 0, 0]} material={tagMat}><planeGeometry args={[0.62, 0.31]} /></mesh>
        </group>
      </group>
    </group>
  );
}

/* ---------- rail, controls, scene ---------- */

type Ref<T> = MutableRefObject<T>;

function Controls({ target, max, rot, locked, dragged }: { target: Ref<number>; max: number; rot: Ref<number>; locked: Ref<boolean>; dragged: Ref<boolean> }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";
    let down = false, lastX = 0, vel = 0, moved = 0, timer: number | undefined;
    const snap = (extra = 0) => { target.current = clamp(Math.round((target.current + extra) / SPACING) * SPACING, -max, 0); };
    const pd = (e: PointerEvent) => { down = true; lastX = e.clientX; vel = 0; moved = 0; dragged.current = false; el.style.cursor = "grabbing"; };
    const pm = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (moved > 6) dragged.current = true;
      if (locked.current) { rot.current += dx * 0.012; return; }
      vel = dx * 0.012;
      target.current = clamp(target.current + dx * 0.012, -max, 0);
    };
    const pu = () => { if (!down) return; down = false; el.style.cursor = "grab"; if (!locked.current) snap(vel * 8); };
    const wh = (e: WheelEvent) => {
      if (locked.current) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const next = clamp(target.current - d * 0.004, -max, 0);
      if (next === target.current) return;
      e.preventDefault();
      target.current = next;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => snap(), 160);
    };
    el.addEventListener("pointerdown", pd);
    window.addEventListener("pointermove", pm);
    window.addEventListener("pointerup", pu);
    el.addEventListener("wheel", wh, { passive: false });
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("pointerdown", pd);
      window.removeEventListener("pointermove", pm);
      window.removeEventListener("pointerup", pu);
      el.removeEventListener("wheel", wh);
    };
  }, [gl, target, max, rot, locked, dragged]);
  return null;
}

export type Nudge = { n: number; dir: 1 | -1 };
type Props = {
  products: Product[]; selectedId: string | null; colorHex: string; onSelect: (id: string | null) => void;
  dark: boolean; nudge: Nudge; onIndex: (i: number) => void;
};

function Track({ products, selectedId, colorHex, onSelect, nudge, onIndex, sh, dragged }: Omit<Props, "dark"> & { sh: Shared; dragged: Ref<boolean> }) {
  const group = useRef<THREE.Group>(null);
  const target = useRef(0);
  const rot = useRef(0);
  const locked = useRef(false);
  const last = useRef(-1);
  const lastSel = useRef(0);
  const prevSel = useRef<string | null>(null);
  const width = useThree((s) => s.size.width);
  const off = width >= 900 ? -1.1 : 0;
  const max = Math.max(0, (products.length - 1) * SPACING);
  locked.current = !!selectedId;

  useEffect(() => { target.current = 0; lastSel.current = 0; }, [products]);
  useEffect(() => {
    const i = products.findIndex((p) => p.id === selectedId);
    if (i >= 0) { lastSel.current = i; target.current = -i * SPACING + off; }
    else if (prevSel.current) target.current = clamp(-lastSel.current * SPACING, -max, 0);
    prevSel.current = selectedId;
    rot.current = 0;
  }, [selectedId, products, off, max]);
  useEffect(() => {
    if (!nudge.n) return;
    const cur = Math.round(-target.current / SPACING);
    target.current = -clamp(cur + nudge.dir, 0, products.length - 1) * SPACING;
  }, [nudge, products.length]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x = damp(g.position.x, target.current, 4, dt);
    const idx = clamp(Math.round(-g.position.x / SPACING), 0, Math.max(0, products.length - 1));
    if (idx !== last.current) { last.current = idx; onIndex(idx); }
  });

  return (
    <>
      <Controls target={target} max={max} rot={rot} locked={locked} dragged={dragged} />
      <group ref={group}>
        {products.map((p, i) => (
          <Item key={p.id} p={p} i={i} selected={p.id === selectedId} dim={!!selectedId && p.id !== selectedId} colorHex={colorHex} onSelect={onSelect} sh={sh} rot={rot} />
        ))}
      </group>
    </>
  );
}

function CameraRig() {
  useFrame((s, dt) => {
    s.camera.position.x = damp(s.camera.position.x, s.pointer.x * 0.4, 3, dt);
    s.camera.position.y = damp(s.camera.position.y, 0.35 + s.pointer.y * 0.2, 3, dt);
    s.camera.lookAt(0, 0.45, 0);
  });
  return null;
}

function Scene({ dark, dragged, ...rest }: Props & { dragged: Ref<boolean> }) {
  const sh = useShared();
  return (
    <>
      <ambientLight intensity={dark ? 0.55 : 0.85} />
      <hemisphereLight args={["#ffffff", "#8d939e", dark ? 0.35 : 0.5]} />
      <directionalLight
        position={[-3, 4.5, 5]} intensity={dark ? 1.8 : 2.3} castShadow
        shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={5} shadow-camera-bottom={-5}
        shadow-camera-near={0.5} shadow-camera-far={20} shadow-bias={-0.0004}
      />
      <CameraRig />
      <mesh position={[0, RAIL_Y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.028, 0.028, 300, 16]} />
        <meshStandardMaterial color={dark ? "#59606c" : "#b5bbc6"} metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.4, -0.95]} receiveShadow>
        <planeGeometry args={[60, 12]} />
        <shadowMaterial opacity={dark ? 0.5 : 0.2} />
      </mesh>
      {sh && <Track {...rest} sh={sh} dragged={dragged} />}
    </>
  );
}

export default function HangerRail(props: Props) {
  const dragged = useRef(false);
  return (
    <Canvas shadows flat camera={{ position: [0, 0.35, 5.4], fov: 38 }} dpr={[1, 1.75]} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }} onPointerMissed={() => { if (!dragged.current) props.onSelect(null); }}>
      <Scene {...props} dragged={dragged} />
    </Canvas>
  );
}
