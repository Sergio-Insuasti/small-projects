import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';

const canvas = document.querySelector('canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xFFFFFF);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1.5, 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Basic lighting so the GLTF is visible
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.7);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 7);
scene.add(dir);

const loader = new GLTFLoader();

let shiba;
loader.load(
  './shiba.glb',
  (gltf) => {
    shiba = gltf.scene;
    shiba.position.set(0, 0, 0);
    scene.add(shiba);
  },
  undefined,
  (error) => console.error('GLTF load error:', error)
);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onDocumentMouseDown(event) {
  event.preventDefault();

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (!shiba) return;

  const intersects = raycaster.intersectObject(shiba, true);

  if (intersects.length > 0) {
    const jumpHeight = 1.5;
    const jumpDuration = 0.4;

    gsap.to(shiba.position, {
      y: `+=${jumpHeight}`,
      duration: jumpDuration,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
    });
  }
}

document.addEventListener('mousedown', onDocumentMouseDown, false);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
