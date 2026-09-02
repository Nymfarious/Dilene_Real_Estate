/**
 * createScene.ts — renderer, lights, ground. The house is added by main.ts.
 */
import * as THREE from "three";

export interface SceneKit {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  resize: () => void;
  dispose: () => void;
}

export function createScene(canvas: HTMLCanvasElement): SceneKit {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0b);

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

  // Sky-ish fill: bone from above, warm-dark from below.
  scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x1a1410, 0.55));
  // Low evening key from the south-west, long shadows implied not rendered.
  const key = new THREE.DirectionalLight(0xffe2c0, 1.6);
  key.position.set(-30, 40, 40);
  scene.add(key);

  // Ground: a dark plane far out, a slightly lighter "lot" under the house.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1200, 1200),
    new THREE.MeshStandardMaterial({ color: 0x0c0c0e, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  ground.name = "ground";
  scene.add(ground);

  const resize = () => {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener("resize", resize);

  return {
    renderer, scene, camera, resize,
    dispose() {
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}

/** A soft "lot" plane sized to the house bounds, so the aerial pull-out has a footprint to read. */
export function makeLot(bounds: THREE.Box3, pad = 14): THREE.Mesh {
  const size = new THREE.Vector3();
  bounds.getSize(size);
  const center = new THREE.Vector3();
  bounds.getCenter(center);
  const lot = new THREE.Mesh(
    new THREE.PlaneGeometry(size.x + pad * 2, size.z + pad * 2),
    new THREE.MeshStandardMaterial({ color: 0x17181c, roughness: 1 }),
  );
  lot.rotation.x = -Math.PI / 2;
  lot.position.set(center.x, -0.04, center.z);
  lot.name = "lot";
  return lot;
}
