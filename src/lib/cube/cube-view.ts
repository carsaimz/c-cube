/**
 * C-Cube — Vista 3D do cubo (three.js puro, sem dependências React).
 *
 * Responsabilidades:
 *  - Renderizar o cubo (peças arredondadas + adesivos com textura).
 *  - Fila de movimentos com animações suaves (easing) e commit exato.
 *  - Gestos: arrastar sobre um adesivo roda a camada; arrastar fora orbita a câmara.
 *  - Detecção de cubo resolvido (matrizes inteiras exatas).
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {
  type Axis,
  type Mat3,
  type Move,
  type Vec3,
  cubieAligned,
  matMul,
  rotateLogicalPos,
  rotationMatrix,
} from "./engine";
import type { Theme } from "./themes";

export interface CubeViewCallbacks {
  onMoveStart: (m: Move) => void;
  onMoveCommitted: (m: Move) => void;
  /** gesto do utilizador (arrastar num adesivo) — a store valida e re-enfileira */
  onUserGestureMove: (m: Move) => void;
  onQueueEmpty: () => void;
  /** utilizador rodou/zoomou a câmara (usado no tutorial) */
  onOrbit?: () => void;
}

interface Cubie {
  pos: Vec3;
  stickerDirs: Vec3[];
  M: Mat3;
  group: THREE.Group;
}

interface AnimState {
  move: Move;
  cubies: Cubie[];
  start: number;
  duration: number;
}

interface CamTween {
  fromPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  start: number;
  duration: number;
}

const HALF_PI = Math.PI / 2;
const AXIS_VEC: Record<Axis, THREE.Vector3> = {
  x: new THREE.Vector3(1, 0, 0),
  y: new THREE.Vector3(0, 1, 0),
  z: new THREE.Vector3(0, 0, 1),
};
const AXIS_INDEX: Record<Axis, 0 | 1 | 2> = { x: 0, y: 1, z: 2 };

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function defaultDuration(m: Move, queueLen: number): number {
  switch (m.source) {
    case "user":
      return 200;
    case "undo":
    case "redo":
      return 170;
    case "scramble":
      return 95;
    case "autosolve":
      return queueLen > 24 ? 65 : 85;
  }
}

export class CubeView {
  private container: HTMLElement;
  private cb: CubeViewCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private cubeGroup = new THREE.Group();
  private pivot = new THREE.Group();
  private cubies: Cubie[] = [];
  private stickerMeshes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private queue: Move[] = [];
  private anim: AnimState | null = null;
  private queueWasActive = false;
  private size = 3;
  private theme: Theme;
  private spacing = 1.04;
  private textureCache = new Map<string, THREE.Texture>();
  private stickerGeometry: THREE.PlaneGeometry;
  private bodyGeometry: RoundedBoxGeometry;
  private hitboxGeometry: THREE.BoxGeometry;
  private hitboxMaterial: THREE.MeshBasicMaterial;
  private hitMeshes: THREE.Mesh[] = [];
  private shadowMesh: THREE.Mesh | null = null;
  private shadowTexture: THREE.Texture | null = null;
  private resizeObserver: ResizeObserver;
  private clockStart = performance.now();
  private pulseStart = -1;
  private idle = true;
  private disposed = false;
  private blind = false;
  private blindTexture: THREE.CanvasTexture | null = null;
  private framed = false;
  private frameShift = 0; // px atuais do desvio vertical (animado)
  private frameShiftTarget = 0;
  private camTween: CamTween | null = null;
  private defaultCamPos = new THREE.Vector3();
  private orbitDirty = false;
  private drag: {
    x0: number;
    y0: number;
    cubie: Cubie;
    normal: Vec3;
    point: THREE.Vector3;
    decided: boolean;
  } | null = null;

  constructor(container: HTMLElement, theme: Theme, size: number, cb: CubeViewCallbacks) {
    this.container = container;
    this.cb = cb;
    this.theme = theme;
    this.size = size;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.touchAction = "none";
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);
    this.scene.add(this.camera);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enablePan = false;
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.85;
    this.controls.autoRotateSpeed = 1.1;
    // deteção de órbita real (para o tutorial): 'change' dispara também com
    // auto-rotação idle, por isso só conta se houver movimento entre o
    // início ('start') e o fim ('end') do gesto do utilizador.
    this.controls.addEventListener("start", () => {
      this.orbitDirty = false;
    });
    this.controls.addEventListener("change", () => {
      this.orbitDirty = true;
    });
    this.controls.addEventListener("end", () => {
      if (this.orbitDirty) {
        this.orbitDirty = false;
        this.cb.onOrbit?.();
      }
    });

    const ambient = new THREE.AmbientLight(0xffffff, 0.85);
    const hemi = new THREE.HemisphereLight(0xdfe8ff, 0x14161d, 0.5);
    const key = new THREE.DirectionalLight(0xffffff, 1.15);
    key.position.set(6, 9, 7);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-7, -4, -6);
    const rim = new THREE.DirectionalLight(0xffffff, 0.45);
    rim.position.set(-4, 6, -8);
    this.scene.add(ambient, hemi, key, fill, rim);
    this.scene.add(this.cubeGroup);
    this.cubeGroup.add(this.pivot);

    this.stickerGeometry = new THREE.PlaneGeometry(0.84, 0.84);
    this.bodyGeometry = new RoundedBoxGeometry(0.94, 0.94, 0.94, 3, 0.09);
    // hitbox invisível: permite arrastar toda a superfície da peça (incluindo vãos)
    this.hitboxGeometry = new THREE.BoxGeometry(0.99, 0.99, 0.99);
    this.hitboxMaterial = new THREE.MeshBasicMaterial({ visible: false });

    this.buildCube();
    this.fitCamera();

    this.renderer.domElement.addEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.addEventListener("dblclick", this.onDblClick);
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("pointerup", this.onPointerUp);
    window.addEventListener("pointercancel", this.onPointerUp);

    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.onResize();

    this.renderer.setAnimationLoop(this.tick);
  }

  // ---------------------------------------------------------------- construir

  private makeStickerTexture(faceIndex: number): THREE.Texture {
    const key = `${this.theme.id}-${faceIndex}`;
    const cached = this.textureCache.get(key);
    if (cached) return cached;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const g = canvas.getContext("2d");
    const color = this.theme.faces[faceIndex];
    if (g) {
      const r = 62;
      const m = 10;
      g.clearRect(0, 0, 256, 256);
      // gradiente radial suave (brilho no topo-esquerda)
      const grad = g.createRadialGradient(96, 78, 20, 128, 128, 190);
      grad.addColorStop(0, lighten(color, 0.22));
      grad.addColorStop(0.55, color);
      grad.addColorStop(1, lighten(color, -0.14));
      g.fillStyle = grad;
      roundRect(g, m, m, 256 - 2 * m, 256 - 2 * m, r);
      g.fill();
      // contorno interior discreto
      g.strokeStyle = "rgba(0,0,0,0.18)";
      g.lineWidth = 5;
      roundRect(g, m + 3, m + 3, 256 - 2 * m - 6, 256 - 2 * m - 6, r - 4);
      g.stroke();
      // reflexo superior
      g.fillStyle = "rgba(255,255,255,0.13)";
      roundRect(g, m + 14, m + 12, 256 - 2 * m - 28, 70, 44);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.textureCache.set(key, tex);
    return tex;
  }

  private clearCache(): void {
    for (const t of this.textureCache.values()) t.dispose();
    this.textureCache.clear();
  }

  private disposeCubeObjects(): void {
    for (const c of this.cubies) {
      c.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh) {
          const mat = mesh.material as THREE.Material;
          if (mat && !Array.isArray(mat) && mat !== (this.hitboxMaterial as THREE.Material)) mat.dispose();
        }
      });
      this.cubeGroup.remove(c.group);
    }
    this.cubies = [];
    this.stickerMeshes = [];
    this.hitMeshes = [];
  }

  private buildCube(): void {
    this.disposeCubeObjects();
    const n = this.size;
    const c = (n - 1) / 2;
    const plasticMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(this.theme.plastic),
      roughness: 0.34,
      metalness: 0.22,
    });
    for (let x = 0; x < n; x++) {
      for (let y = 0; y < n; y++) {
        for (let z = 0; z < n; z++) {
          const onSurface = x === 0 || x === n - 1 || y === 0 || y === n - 1 || z === 0 || z === n - 1;
          if (!onSurface) continue;
          const group = new THREE.Group();
          const body = new THREE.Mesh(this.bodyGeometry, plasticMat);
          group.add(body);
          const hitbox = new THREE.Mesh(this.hitboxGeometry, this.hitboxMaterial);
          group.add(hitbox);
          const pos: Vec3 = [x, y, z];
          const stickerDirs: Vec3[] = [];
          const dirs: Vec3[] = [
            [1, 0, 0],
            [-1, 0, 0],
            [0, 1, 0],
            [0, -1, 0],
            [0, 0, 1],
            [0, 0, -1],
          ];
          dirs.forEach((d, faceIndex) => {
            const onBoundary =
              (d[0] === 1 && x === n - 1) ||
              (d[0] === -1 && x === 0) ||
              (d[1] === 1 && y === n - 1) ||
              (d[1] === -1 && y === 0) ||
              (d[2] === 1 && z === n - 1) ||
              (d[2] === -1 && z === 0);
            if (!onBoundary) return;
            stickerDirs.push(d);
            const faceIndex2 =
              d[0] === 1 ? 0 : d[0] === -1 ? 1 : d[1] === 1 ? 2 : d[1] === -1 ? 3 : d[2] === 1 ? 4 : 5;
            const mat = new THREE.MeshStandardMaterial({
              map: this.makeStickerTexture(faceIndex2),
              roughness: 0.38,
              metalness: 0.05,
            });
            if (this.theme.glow > 0) {
              mat.emissive = new THREE.Color(0xffffff);
              mat.emissiveMap = mat.map ?? null;
              mat.emissiveIntensity = this.theme.glow;
            }
            const sticker = new THREE.Mesh(this.stickerGeometry, mat);
            const v = new THREE.Vector3(d[0], d[1], d[2]);
            sticker.position.set(d[0] * 0.476, d[1] * 0.476, d[2] * 0.476);
            sticker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v);
            sticker.userData.cubie = null; // preenchido abaixo
            group.add(sticker);
            this.stickerMeshes.push(sticker);
          });
          const cubie: Cubie = {
            pos,
            stickerDirs,
            M: [
              [1, 0, 0],
              [0, 1, 0],
              [0, 0, 1],
            ],
            group,
          };
          group.position.set((x - c) * this.spacing, (y - c) * this.spacing, (z - c) * this.spacing);
          group.userData.cubie = cubie;
          for (const child of group.children) {
            if (child instanceof THREE.Mesh && child !== body) child.userData.cubie = cubie;
          }
          this.hitMeshes.push(hitbox);
          this.cubies.push(cubie);
          this.cubeGroup.add(group);
        }
      }
    }
    this.buildShadow();
  }

  /** Textura neutra para o modo Memória (cubo "cego" — adesivos cinzentos). */
  private makeBlindTexture(): THREE.CanvasTexture {
    if (this.blindTexture) return this.blindTexture;
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const g = canvas.getContext("2d");
    if (g) {
      const m = 10;
      const grad = g.createRadialGradient(96, 78, 20, 128, 128, 190);
      grad.addColorStop(0, "#5b6070");
      grad.addColorStop(0.55, "#454a58");
      grad.addColorStop(1, "#333743");
      g.fillStyle = grad;
      roundRect(g, m, m, 256 - 2 * m, 256 - 2 * m, 62);
      g.fill();
      g.strokeStyle = "rgba(0,0,0,0.25)";
      g.lineWidth = 5;
      roundRect(g, m + 3, m + 3, 256 - 2 * m - 6, 256 - 2 * m - 6, 58);
      g.stroke();
      g.fillStyle = "rgba(255,255,255,0.07)";
      roundRect(g, m + 14, m + 12, 256 - 2 * m - 28, 70, 44);
      g.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    this.blindTexture = tex;
    return tex;
  }

  private buildShadow(): void {
    if (this.shadowMesh) {
      this.scene.remove(this.shadowMesh);
      this.shadowMesh = null;
    }
    if (!this.shadowTexture) {
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const g = canvas.getContext("2d");
      if (g) {
        const grad = g.createRadialGradient(128, 128, 10, 128, 128, 124);
        grad.addColorStop(0, "rgba(0,0,0,0.55)");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        g.fillStyle = grad;
        g.fillRect(0, 0, 256, 256);
      }
      const tex = new THREE.CanvasTexture(canvas);
      this.shadowTexture = tex;
    }
    const geo = new THREE.PlaneGeometry(this.size * 1.9, this.size * 1.9);
    const mat = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -HALF_PI;
    mesh.position.y = -(this.size - 1) / 2 * this.spacing - 0.9;
    this.shadowMesh = mesh;
    this.scene.add(mesh);
  }

  private applyThemeToMaterials(): void {
    for (const c of this.cubies) {
      c.group.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (!mesh.isMesh) return;
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (!mat || Array.isArray(mat)) return;
        if (mat.map) {
          if (this.blind) {
            // modo memória: adesivos neutros, sem brilho
            mat.map = this.makeBlindTexture();
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveMap = null;
            mat.emissiveIntensity = 0;
            mat.needsUpdate = true;
            return;
          }
          // adesivo: descobrir face pela orientação local
          const dir = new THREE.Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
          const faceIndex =
            dir.x > 0.5 ? 0 : dir.x < -0.5 ? 1 : dir.y > 0.5 ? 2 : dir.y < -0.5 ? 3 : dir.z > 0.5 ? 4 : 5;
          mat.map = this.makeStickerTexture(faceIndex);
          if (this.theme.glow > 0) {
            mat.emissive = new THREE.Color(0xffffff);
            mat.emissiveMap = mat.map;
            mat.emissiveIntensity = this.theme.glow;
          } else {
            mat.emissive = new THREE.Color(0x000000);
            mat.emissiveMap = null;
            mat.emissiveIntensity = 0;
          }
          mat.needsUpdate = true;
        } else {
          mat.color = new THREE.Color(this.theme.plastic);
        }
      });
    }
  }

  // ------------------------------------------------------------------ câmara

  private fitCamera(): void {
    const r = this.idealCameraDistance();
    this.camera.position.set(r * 0.66, r * 0.5, r * 0.82);
    this.camera.lookAt(0, 0, 0);
    this.controls.target.set(0, 0, 0);
    this.controls.minDistance = this.size * 1.7 + 0.8;
    this.controls.maxDistance = r * 1.9;
    this.controls.update();
    this.updateFrameShiftTarget();
  }

  /** Distância vertical (px) entre o centro do ecrã e o centro da zona livre entre HUD e dock. */
  private updateFrameShiftTarget(): void {
    if (!this.framed) {
      this.frameShiftTarget = 0;
      return;
    }
    const h = Math.max(1, this.container.clientHeight);
    // HUD superior (título+timer) e dock inferior (controlos) medidos ao layout:
    // top ≈ 64px, bottom ≈ 7rem (105px) + safe-area; usamos máximos prudentes.
    const top = Math.max(64, h * 0.085);
    const bottom = Math.max(112, h * 0.14);
    this.frameShiftTarget = Math.max(0, (bottom - top) / 2);
  }

  /**
   * Repõe a câmara: centro (0,0,0), zoom padrão e orientação de origem, com
   * animação suave. Chamado pelo botão "Centrar" e por duplo clique no fundo.
   */
  resetView(): void {
    const r = this.idealCameraDistance();
    this.defaultCamPos.set(r * 0.66, r * 0.5, r * 0.82);
    this.controls.minDistance = this.size * 1.7 + 0.8;
    this.controls.maxDistance = r * 1.9;
    this.camTween = {
      fromPos: this.camera.position.clone(),
      toPos: this.defaultCamPos.clone(),
      fromTarget: this.controls.target.clone(),
      toTarget: new THREE.Vector3(0, 0, 0), // o offset visual (setViewOffset) trata do enquadramento
      start: performance.now(),
      duration: 650,
    };
    // repe a deriva do grupo do cubo (flutuação/rotação do menu)
    this.cubeGroup.position.y = 0;
    this.cubeGroup.rotation.x = 0;
    this.cubeGroup.rotation.z = 0;
  }

  /** Distância ideal da câmara para o tamanho do cubo + aspeto atual do contentor. */
  private idealCameraDistance(): number {
    const s = this.size;
    const base = s * 2.45 + 1.75;
    const aspect = this.container.clientWidth / Math.max(1, this.container.clientHeight);
    const halfW = (s * 1.04) / 2 + 0.25;
    const hTan = Math.tan((this.camera.fov * Math.PI) / 360) * Math.max(0.3, aspect);
    const need = (halfW / hTan) * 1.06;
    return Math.min(Math.max(base, need), s * 7 + 4);
  }

  private onDblClick = (e: MouseEvent): void => {
    // duplo clique em zona vazia (fora do cubo) → recentrar
    this.updatePointerNDC(e as unknown as PointerEvent);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    if (this.raycaster.intersectObjects(this.hitMeshes, false).length === 0) {
      this.resetView();
    }
  };

  /** Modo jogo: centrar o cubo na zona livre entre o HUD e a barra de controlos. */
  setFramed(v: boolean): void {
    this.framed = v;
    this.updateFrameShiftTarget();
  }

  private onResize(): void {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    // CRÍTICO: updateStyle tem de ficar ativo (default). Com `false`, o <canvas>
    // mantinha o tamanho CSS = buffer interno (w*dpr × h*dpr px) — 2× o ecrã
    // em dpr 2 — e o cubo aparecia no canto inferior direito, além de os gestos
    // ficarem desalinhados. Era a causa do bug "cubo não centra".
    this.renderer.setSize(w, h);
    this.updateFrameShiftTarget();
  }

  // ---------------------------------------------------------------- gestos

  private updatePointerNDC(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    if (this.anim || this.queue.length > 0) return;
    this.updatePointerNDC(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.hitMeshes, false);
    if (hits.length === 0) return;
    const hit = hits[0];
    const cubie = hit.object.userData.cubie as Cubie | undefined;
    if (!cubie) return;
    // normal da face da hitbox -> espaço do mundo
    const worldNormal = hit.face
      ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld)
      : hit.object.getWorldDirection(new THREE.Vector3());
    const snapped = snapAxis(worldNormal);
    this.drag = {
      x0: e.clientX,
      y0: e.clientY,
      cubie,
      normal: snapped,
      point: hit.point.clone(),
      decided: false,
    };
    this.controls.enabled = false;
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.drag || this.drag.decided) return;
    const dx = e.clientX - this.drag.x0;
    const dy = e.clientY - this.drag.y0;
    if (Math.hypot(dx, dy) < 12) return;

    // vetor de arrasto no mundo (plano do adesivo)
    this.updatePointerNDC(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const n = new THREE.Vector3(...this.drag.normal);
    const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(n, this.drag.point);
    const pNow = new THREE.Vector3();
    let delta: THREE.Vector3 | null = this.raycaster.ray.intersectPlane(plane, pNow)
      ? pNow.clone().sub(this.drag.point)
      : null;
    if (!delta || delta.lengthSq() < 1e-8) {
      // plano quase de perfil: aproximar pelo ecrã
      const dist = this.camera.position.distanceTo(this.drag.point);
      const k = dist * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
      delta = right.multiplyScalar(dx * k).add(up.multiplyScalar(-dy * k));
    }
    delta.normalize();

    // eixos candidatos: os dois perpendiculares à normal do adesivo
    const normalAxis = axisOf(this.drag.normal);
    const r = this.drag.point.clone().sub(this.cubeGroup.position);
    let best: { axis: Axis; dir: 1 | -1; score: number } | null = null;
    for (const axis of ["x", "y", "z"] as Axis[]) {
      if (axis === normalAxis) continue;
      for (const dir of [1, -1] as const) {
        const omega = AXIS_VEC[axis].clone().multiplyScalar(dir);
        const v = new THREE.Vector3().crossVectors(omega, r).normalize();
        const score = v.dot(delta);
        if (!best || score > best.score) best = { axis, dir, score };
      }
    }
    this.drag.decided = true;
    if (best && best.score > 0.12) {
      const layer = this.drag.cubie.pos[AXIS_INDEX[best.axis]];
      this.cb.onUserGestureMove({
        axis: best.axis,
        layer,
        dir: best.dir,
        source: "user",
      });
    }
  };

  private onPointerUp = (): void => {
    if (this.drag) {
      this.drag = null;
      this.controls.enabled = true;
    }
  };

  // ------------------------------------------------------------ fila/animac.

  enqueueMove(m: Move): void {
    this.queue.push(m);
  }

  enqueueMoves(ms: Move[]): void {
    for (const m of ms) this.queue.push(m);
  }

  clearQueue(): void {
    this.queue = [];
  }

  get busy(): boolean {
    return this.anim !== null || this.queue.length > 0;
  }

  isSolved(): boolean {
    return this.cubies.every((c) => cubieAligned(c.stickerDirs, c.M));
  }

  private startNext(): void {
    const move = this.queue.shift();
    if (!move) return;
    const ai = AXIS_INDEX[move.axis];
    const members = this.cubies.filter((c) => c.pos[ai] === move.layer);
    this.pivot.rotation.set(0, 0, 0);
    this.pivot.updateMatrixWorld(true);
    for (const c of members) this.pivot.attach(c.group);
    this.anim = {
      move,
      cubies: members,
      start: performance.now(),
      duration: move.duration ?? defaultDuration(move, this.queue.length),
    };
    this.cb.onMoveStart(move);
  }

  private commitCurrent(): void {
    const { move, cubies } = this.anim!;
    this.pivot.rotation.set(0, 0, 0);
    (this.pivot.rotation as unknown as Record<string, number>)[move.axis] = move.dir * HALF_PI;
    this.pivot.updateMatrixWorld(true);
    const R = rotationMatrix(move.axis, move.dir);
    const c = (this.size - 1) / 2;
    const m4 = new THREE.Matrix4();
    for (const cubie of cubies) {
      this.cubeGroup.attach(cubie.group);
      cubie.pos = rotateLogicalPos(cubie.pos, move.axis, move.dir, this.size);
      cubie.M = matMul(R, cubie.M);
      // encaixe exato (elimina deriva numérica)
      cubie.group.position.set(
        (cubie.pos[0] - c) * this.spacing,
        (cubie.pos[1] - c) * this.spacing,
        (cubie.pos[2] - c) * this.spacing
      );
      const M = cubie.M;
      m4.set(M[0][0], M[0][1], M[0][2], 0, M[1][0], M[1][1], M[1][2], 0, M[2][0], M[2][1], M[2][2], 0, 0, 0, 0, 1);
      cubie.group.quaternion.setFromRotationMatrix(m4);
      cubie.group.scale.set(1, 1, 1);
    }
    this.pivot.rotation.set(0, 0, 0);
    const committed = this.anim!.move;
    this.anim = null;
    this.cb.onMoveCommitted(committed);
  }

  private tick = (): void => {
    if (this.disposed) return;
    const now = performance.now();
    const t = now - this.clockStart;

    // tween da câmara (botão centrar / duplo clique)
    if (this.camTween) {
      const p = Math.min(1, (now - this.camTween.start) / this.camTween.duration);
      const e = easeInOutCubic(p);
      this.camera.position.lerpVectors(this.camTween.fromPos, this.camTween.toPos, e);
      this.controls.target.lerpVectors(this.camTween.fromTarget, this.camTween.toTarget, e);
      this.camera.lookAt(this.controls.target);
      if (p >= 1) {
        this.camTween = null;
        this.controls.update();
      }
    }

    // desvio vertical animado (enquadramento entre HUD e dock).
    // y NEGATIVO: com setViewOffset, y positivo sobe o conteúdo (para debaixo
    // do HUD); queremos descer o cubo para a zona livre, pelo que o sinal é
    // invertido. Aplicado em TODOS os frames — nunca fica preso a meio.
    this.frameShift += (this.frameShiftTarget - this.frameShift) * 0.08;
    {
      const w = this.container.clientWidth || 1;
      const h = this.container.clientHeight || 1;
      if (this.frameShift > 0.5) {
        this.camera.setViewOffset(w, h, 0, -this.frameShift, w, h);
      } else if (this.camera.view !== null) {
        this.camera.clearViewOffset();
      }
    }

    if (!this.anim && this.queue.length > 0) this.startNext();

    if (this.anim) {
      const p = Math.min(1, (now - this.anim.start) / this.anim.duration);
      const eased =
        this.anim.move.source === "user" || this.anim.move.source === "undo" || this.anim.move.source === "redo"
          ? easeOutCubic(p)
          : easeOutQuad(p);
      const m = this.anim.move;
      (this.pivot.rotation as unknown as Record<string, number>)[m.axis] = m.dir * HALF_PI * eased;
      if (p >= 1) this.commitCurrent();
    } else if (this.queue.length === 0 && this.queueWasActive) {
      this.queueWasActive = false;
      this.cb.onQueueEmpty();
    }
    if (this.queue.length > 0 || this.anim) this.queueWasActive = true;

    // flutuação suave no menu
    const targetBob = this.idle ? Math.sin(t * 0.0011) * 0.14 : 0;
    this.cubeGroup.position.y += (targetBob - this.cubeGroup.position.y) * 0.06;
    if (this.idle) {
      this.cubeGroup.rotation.x = Math.sin(t * 0.0007) * 0.05;
      this.cubeGroup.rotation.z = Math.cos(t * 0.0009) * 0.04;
    } else {
      this.cubeGroup.rotation.x *= 0.9;
      this.cubeGroup.rotation.z *= 0.9;
    }

    // pulso de vitória
    if (this.pulseStart > 0) {
      const p = (now - this.pulseStart) / 900;
      if (p >= 1) {
        this.cubeGroup.scale.setScalar(1);
        this.pulseStart = -1;
      } else {
        this.cubeGroup.scale.setScalar(1 + 0.075 * Math.sin(Math.PI * p));
      }
    }

    this.controls.autoRotate = (this.idle || this.pulseStart > 0) && !this.camTween;
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  // ------------------------------------------------------------------- API

  setIdle(v: boolean): void {
    this.idle = v;
  }

  celebrate(): void {
    this.pulseStart = performance.now();
  }

  setSize(size: number): void {
    if (size === this.size && this.cubies.length > 0) return;
    this.size = size;
    this.anim = null;
    this.queue = [];
    this.buildCube();
    this.fitCamera();
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.clearCache();
    this.applyThemeToMaterials();
  }

  /** Modo Memória: esconder/mostrar as cores dos adesivos. */
  setBlind(v: boolean): void {
    if (this.blind === v) return;
    this.blind = v;
    this.applyThemeToMaterials();
  }

  /** Reinicia instantaneamente para o estado resolvido. */
  resetToSolved(): void {
    this.anim = null;
    this.queue = [];
    this.buildCube();
    if (this.blind) this.applyThemeToMaterials();
  }

  dispose(): void {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.resizeObserver.disconnect();
    this.renderer.domElement.removeEventListener("pointerdown", this.onPointerDown);
    this.renderer.domElement.removeEventListener("dblclick", this.onDblClick);
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("pointerup", this.onPointerUp);
    window.removeEventListener("pointercancel", this.onPointerUp);
    this.controls.dispose();
    this.disposeCubeObjects();
    this.clearCache();
    this.blindTexture?.dispose();
    this.blindTexture = null;
    this.stickerGeometry.dispose();
    this.bodyGeometry.dispose();
    this.hitboxGeometry.dispose();
    this.hitboxMaterial.dispose();
    this.shadowTexture?.dispose();
    this.shadowMesh?.geometry.dispose();
    (this.shadowMesh?.material as THREE.Material | undefined)?.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

// ------------------------------------------------------------------ utilitários

function snapAxis(v: THREE.Vector3): Vec3 {
  const ax = Math.abs(v.x);
  const ay = Math.abs(v.y);
  const az = Math.abs(v.z);
  if (ax >= ay && ax >= az) return [Math.sign(v.x), 0, 0];
  if (ay >= az) return [0, Math.sign(v.y), 0];
  return [0, 0, Math.sign(v.z)];
}

function axisOf(v: Vec3): Axis {
  if (v[0] !== 0) return "x";
  if (v[1] !== 0) return "y";
  return "z";
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

function lighten(hex: string, amt: number): string {
  const c = new THREE.Color(hex);
  if (amt >= 0) {
    c.lerp(new THREE.Color(0xffffff), amt);
  } else {
    c.lerp(new THREE.Color(0x000000), -amt);
  }
  return `#${c.getHexString()}`;
}
