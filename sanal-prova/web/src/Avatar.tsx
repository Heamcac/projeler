import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RotateCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import type { AvatarParameters } from '../../src/tryon/types.js';
import type { Product, Variant } from './types';
import { IconButton } from './components';

export default function Avatar({ avatar, product, variant }: { avatar: AvatarParameters; product: Product; variant: Variant }) {
  const host = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [failed, setFailed] = useState(false), [rotating, setRotating] = useState(true);
  useEffect(() => { if (controlsRef.current) controlsRef.current.autoRotate = rotating; }, [rotating]);
  useEffect(() => {
    const element = host.current!;
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); }
    catch { setFailed(true); return; }
    setFailed(false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setClearColor(0xf0f3f2);
    renderer.domElement.setAttribute('aria-label', 'Ölçülerine göre parametrik 3D avatar');
    renderer.domElement.setAttribute('role', 'img');
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.05, 30);
    camera.position.set(2.1, avatar.height * 0.72, 3.5);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, avatar.height * 0.46, 0); controls.enableDamping = true;
    controls.enablePan = false; controls.minDistance = 1.8; controls.maxDistance = 6;
    controls.maxPolarAngle = Math.PI * 0.56; controls.minPolarAngle = Math.PI * 0.24;
    controls.autoRotate = true; controls.autoRotateSpeed = 0.55;
    controls.saveState();
    controlsRef.current = controls;
    scene.add(new THREE.HemisphereLight(0xffffff, 0x93a4a0, 2.6));
    const light = new THREE.DirectionalLight(0xffffff, 3.4); light.position.set(3, 5, 4); light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024); scene.add(light);
    const fill = new THREE.DirectionalLight(0xffffff, 1.3); fill.position.set(-3, 2, -2); scene.add(fill);
    const skin = new THREE.MeshStandardMaterial({ color: 0xb6c1c0, roughness: 0.8 });
    const cloth = new THREE.MeshStandardMaterial({ color: product.product.garmentType === 'bottom' ? 0x294b67 : product.product.garmentType === 'top' ? 0xfafafa : 0x167e69, roughness: 0.92 });
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0xf0f3f2, roughness: 1 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), floorMaterial); floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.025; floor.receiveShadow = true; scene.add(floor);
    const group = new THREE.Group(); scene.add(group);
    const h = avatar.height, legY = avatar.inseam, hipY = legY + (avatar.outseam - legY) * 0.6;
    const waistY = hipY + h * 0.1, chestY = h * 0.77, shoulderY = h * 0.83;
    const circumferenceRadius = (circumference: number) => circumference / (2 * Math.PI * 0.86);
    const hipR = circumferenceRadius(avatar.hipCircumference), waistR = circumferenceRadius(avatar.waistCircumference), chestR = circumferenceRadius(avatar.chestCircumference);
    const measurement = product.variants.find(v => v.variant.id === variant.id)?.measurements;
    const m = (key: string, fallback: number) => typeof measurement?.[key] === 'number' ? Number(measurement[key]) / 100 : fallback;
    const add = (geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3) => {
      const mesh = new THREE.Mesh(geometry, material); mesh.position.copy(position); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
    };
    const torsoGeometry = new THREE.LatheGeometry([
      new THREE.Vector2(hipR * 0.8, legY - 0.02), new THREE.Vector2(hipR, hipY),
      new THREE.Vector2(waistR, waistY), new THREE.Vector2(chestR, chestY),
      new THREE.Vector2(avatar.shoulderWidth / 2, shoulderY), new THREE.Vector2(h * 0.04, h * 0.88),
    ], 64); torsoGeometry.scale(1, 1, 0.7);
    add(torsoGeometry, skin, new THREE.Vector3());
    const head = add(new THREE.SphereGeometry(h * 0.055, 40, 32), skin, new THREE.Vector3(0, h * 0.941, 0)); head.scale.set(0.87, 1.12, 0.9);
    const legR = hipR * 0.37;
    for (const side of [-1, 1]) {
      const x = side * hipR * 0.53;
      add(new THREE.CylinderGeometry(legR, legR * 0.61, legY, 32), skin, new THREE.Vector3(x, legY / 2 + 0.025, 0));
      const foot = add(new THREE.SphereGeometry(legR * 0.68, 24, 20), skin, new THREE.Vector3(x, 0.025, 0.03)); foot.scale.set(1, 0.5, 1.7);
      const armLength = h * 0.32;
      const arm = add(new THREE.CylinderGeometry(h * 0.026, h * 0.018, armLength, 24), skin,
        new THREE.Vector3(side * (avatar.shoulderWidth / 2 + h * 0.048), shoulderY - armLength / 2 + 0.02, 0)); arm.rotation.z = side * 0.12;
      const hand = add(new THREE.SphereGeometry(h * 0.025, 20, 16), skin,
        new THREE.Vector3(side * (avatar.shoulderWidth / 2 + h * 0.07), shoulderY - armLength, 0)); hand.scale.set(0.72, 1.25, 0.7);
    }
    const type = product.product.garmentType;
    if (type === 'top' || type === 'dress') {
      const garment = new THREE.LatheGeometry([
        new THREE.Vector2(type === 'dress' ? hipR * 1.4 : waistR * 1.12, type === 'dress' ? legY * 0.35 : waistY - 0.04),
        new THREE.Vector2(Math.max(hipR + 0.01, circumferenceRadius(m('hips', avatar.hipCircumference))), hipY),
        new THREE.Vector2(Math.max(waistR + 0.014, circumferenceRadius(m('waist', avatar.waistCircumference + 0.04))), waistY),
        new THREE.Vector2(Math.max(chestR + 0.015, circumferenceRadius(m('chest', avatar.chestCircumference + 0.06))), chestY),
        new THREE.Vector2(avatar.shoulderWidth / 2 + 0.01, shoulderY), new THREE.Vector2(h * 0.043, h * 0.865),
      ], 64); garment.scale(1, 1, 0.72); add(garment, cloth, new THREE.Vector3());
    }
    if (type === 'bottom') {
      const trousersHip = Math.max(hipR + 0.014, circumferenceRadius(m('hips', avatar.hipCircumference + 0.04)));
      const trousersWaist = Math.max(waistR + 0.014, circumferenceRadius(m('waist', avatar.waistCircumference + 0.02)));
      const pelvis = new THREE.LatheGeometry([new THREE.Vector2(hipR * 0.8, legY - 0.015), new THREE.Vector2(trousersHip, hipY), new THREE.Vector2(trousersWaist, waistY)], 64);
      pelvis.scale(1, 1, 0.72); add(pelvis, cloth, new THREE.Vector3());
      const pantsLength = Math.min(m('inseam', legY), legY + 0.015);
      for (const side of [-1, 1]) add(new THREE.CylinderGeometry(legR + 0.014, Math.max(legR * 0.68, m('hemWidth', 0.18) / Math.PI), pantsLength, 32), cloth,
        new THREE.Vector3(side * hipR * 0.53, legY - pantsLength / 2 + 0.012, 0));
    }
    const resize = () => {
      const width = element.clientWidth, height = element.clientHeight;
      if (!width || !height) return;
      renderer.setSize(width, height); camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(element); resize();
    renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
    return () => {
      renderer.setAnimationLoop(null); observer.disconnect(); controls.dispose(); controlsRef.current = null;
      scene.traverse(object => { if (object instanceof THREE.Mesh) object.geometry.dispose(); });
      skin.dispose(); cloth.dispose(); floorMaterial.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, [avatar, product.product.id, variant.id]);
  const zoom = (factor: number) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const camera = controls.object as THREE.PerspectiveCamera;
    const offset = camera.position.clone().sub(controls.target).multiplyScalar(factor);
    if (offset.length() >= controls.minDistance && offset.length() <= controls.maxDistance) camera.position.copy(controls.target).add(offset);
    controls.update();
  };
  return <div className="avatar-scene"><div className="canvas-host" ref={host} />{failed && <div className="canvas-error">Bu tarayıcıda 3D görüntü açılamıyor. 2D önizlemeyi seçebilirsin.</div>}<div className="scene-tools"><IconButton label={rotating ? 'Otomatik dönüşü durdur' : 'Otomatik dönüşü başlat'} onClick={() => setRotating(!rotating)} className={rotating ? 'active' : ''}><RotateCw size={19} /></IconButton><IconButton label="Yakınlaştır" onClick={() => zoom(0.88)}><ZoomIn size={19} /></IconButton><IconButton label="Uzaklaştır" onClick={() => zoom(1.12)}><ZoomOut size={19} /></IconButton><IconButton label="Görünümü sıfırla" onClick={() => controlsRef.current?.reset()}><RotateCcw size={19} /></IconButton></div></div>;
}
