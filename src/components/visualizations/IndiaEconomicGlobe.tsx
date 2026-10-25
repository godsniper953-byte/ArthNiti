import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Compass, Eye, Globe, Layers, Pause, Play } from 'lucide-react';
import { INDIA_ECONOMIC_HUBS } from '../../data/mockEconomicData';
import { IndiaEconomicHubNode } from '../../types/economy';

interface IndiaEconomicGlobeProps {
  theme: 'dark' | 'light';
}

// Convert lat/lon in degrees to 3D sphere cartesian coordinates
function latLonToVec3(lat: number, lon: number, radius: number, target = new THREE.Vector3()): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return target.set(x, y, z);
}

// Stylized India outline lat/lon loop for the 3D globe surface
const INDIA_OUTLINE_COORDS: [number, number][] = [
  [8.08, 77.55],   // Kanyakumari
  [10.8, 79.8],    // Tamil Nadu coast
  [13.08, 80.27],  // Chennai
  [16.5, 82.2],    // Andhra coast
  [19.8, 85.8],    // Odisha coast
  [22.57, 88.36],  // Kolkata / Bengal
  [26.1, 89.9],    // Assam / NE entry
  [27.8, 95.2],    // Arunachal East
  [24.8, 93.9],    // Manipur
  [23.8, 91.3],    // Tripura
  [26.7, 88.4],    // Siliguri corridor
  [28.6, 80.1],    // Uttarakhand / UP border
  [32.7, 78.9],    // Ladakh East
  [34.5, 76.5],    // Northern Frontier
  [32.7, 74.8],    // Jammu
  [30.9, 74.6],    // Punjab border
  [27.0, 70.9],    // Rajasthan Thar West
  [23.7, 68.6],    // Kutch Gujarat
  [21.6, 69.6],    // Saurashtra
  [21.1, 72.8],    // Surat
  [19.07, 72.87],  // Mumbai
  [15.4, 73.8],    // Goa
  [12.9, 74.8],    // Mangaluru
  [9.93, 76.26],   // Kochi
  [8.08, 77.55],   // Close loop at Kanyakumari
];

export const IndiaEconomicGlobe: React.FC<IndiaEconomicGlobeProps> = ({ theme }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedHub, setSelectedHub] = useState<IndiaEconomicHubNode>(INDIA_ECONOMIC_HUBS[0]);
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [useStaticFallback, setUseStaticFallback] = useState<boolean>(false);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [hudCollapsed, setHudCollapsed] = useState<boolean>(false);

  const selectedHubRef = useRef<IndiaEconomicHubNode>(selectedHub);
  const isRotatingRef = useRef<boolean>(isRotating);

  useEffect(() => {
    selectedHubRef.current = selectedHub;
  }, [selectedHub]);

  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsRotating(false);
      isRotatingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (useStaticFallback) return;
    const container = mountRef.current;
    if (!container) return;

    // Probe WebGL2 / WebGL support & detect Software WebGL
    let isSoftwareGl = false;
    try {
      const probeCanvas = document.createElement('canvas');
      const gl = (probeCanvas.getContext('webgl2') || probeCanvas.getContext('webgl')) as WebGLRenderingContext | null;
      if (!gl) {
        setWebglSupported(false);
        return;
      }
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    } catch {
      setWebglSupported(false);
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      setWebglSupported(false);
      return;
    }

    const width = container.clientWidth || 520;
    const height = container.clientHeight || 420;

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0.4, 5.3);
    camera.lookAt(0, 0, 0);

    // Balanced studio lighting rig (Warm key light + Cool hemisphere fill + Rim light)
    const hemiLight = new THREE.HemisphereLight(
      theme === 'dark' ? 0x38bdf8 : 0xe0f2fe,
      theme === 'dark' ? 0x060b16 : 0x94a3b8,
      0.9
    );
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfef3c7, 1.8);
    keyLight.position.set(4, 5, 4);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x10b981, 1.4);
    rimLight.position.set(-5, -2, -3);
    scene.add(rimLight);

    // Root multi-part procedural assembly (THREE.Group with 8 distinct sub-assemblies)
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    const GLOBE_RADIUS = 1.62;

    // Part 1: Core metallic planetary sphere
    const coreGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 48, 48);
    const coreMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x091326 : 0x1e293b,
      roughness: 0.55,
      metalness: 0.45,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    globeGroup.add(coreMesh);

    // Part 2: Outer subtle wireframe geodesic shell
    const wireGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.004, 24, 18);
    const wireMat = new THREE.MeshStandardMaterial({
      color: theme === 'dark' ? 0x1e3a5f : 0x475569,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
      roughness: 0.3,
      metalness: 0.8,
    });
    const wireMesh = new THREE.Mesh(wireGeo, wireMat);
    globeGroup.add(wireMesh);

    // Part 3: Equatorial & Tropical orbital telemetry rings
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      roughness: 0.25,
      metalness: 0.85,
      transparent: true,
      opacity: 0.38,
    });
    const outerRingGeo = new THREE.TorusGeometry(GLOBE_RADIUS * 1.24, 0.008, 12, 96);
    const outerRing = new THREE.Mesh(outerRingGeo, ringMat);
    outerRing.rotation.x = Math.PI / 2.3;
    outerRing.rotation.y = 0.25;
    globeGroup.add(outerRing);

    const goldRingMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
      transparent: true,
      opacity: 0.32,
    });
    const secondRingGeo = new THREE.TorusGeometry(GLOBE_RADIUS * 1.34, 0.006, 12, 96);
    const secondRing = new THREE.Mesh(secondRingGeo, goldRingMat);
    secondRing.rotation.x = Math.PI / 1.75;
    secondRing.rotation.z = -0.35;
    globeGroup.add(secondRing);

    // Part 4: India Subcontinent luminous contour ribbon on the sphere
    const indiaCurvePoints = INDIA_OUTLINE_COORDS.map(([lat, lon]) =>
      latLonToVec3(lat, lon, GLOBE_RADIUS * 1.012)
    );
    const indiaCurve = new THREE.CatmullRomCurve3(indiaCurvePoints, true);
    const indiaContourGeo = new THREE.TubeGeometry(indiaCurve, 100, 0.012, 6, true);
    const indiaContourMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x059669,
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.7,
    });
    const indiaContourMesh = new THREE.Mesh(indiaContourGeo, indiaContourMat);
    globeGroup.add(indiaContourMesh);

    // Part 5: Instanced Global Economic Latitude Lattice Points
    const latticeCount = 140;
    const nodeInstGeo = new THREE.SphereGeometry(0.014, 8, 8);
    const nodeInstMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.7,
      transparent: true,
      opacity: 0.45,
    });
    const instancedLattice = new THREE.InstancedMesh(nodeInstGeo, nodeInstMat, latticeCount);
    const dummy = new THREE.Object3D();
    for (let i = 0; i < latticeCount; i++) {
      // Golden spiral spherical distribution
      const y = 1 - (i / (latticeCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = ((i * 2.3999632) % (Math.PI * 2));
      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;
      dummy.position.set(x * GLOBE_RADIUS * 1.006, y * GLOBE_RADIUS * 1.006, z * GLOBE_RADIUS * 1.006);
      dummy.scale.setScalar(0.85 + (i % 3) * 0.15);
      dummy.updateMatrix();
      instancedLattice.setMatrixAt(i, dummy.matrix);
    }
    instancedLattice.computeBoundingSphere();
    globeGroup.add(instancedLattice);

    // Part 6: 7 Indian Economic Hub Pillars & Beacons
    const hubMeshesMap = new Map<string, THREE.Group>();
    const colorMap = {
      emerald: 0x10b981,
      gold: 0xf59e0b,
      cyan: 0x06b6d4,
    };

    INDIA_ECONOMIC_HUBS.forEach((hub) => {
      const hubAnchor = new THREE.Group();
      const surfacePos = latLonToVec3(hub.lat, hub.lon, GLOBE_RADIUS * 1.015);
      hubAnchor.position.copy(surfacePos);
      hubAnchor.lookAt(surfacePos.clone().multiplyScalar(2));

      const hexColor = colorMap[hub.accentColor];
      // Base pedestal ring
      const baseGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.015, 16);
      baseGeo.rotateX(Math.PI / 2);
      const baseMat = new THREE.MeshStandardMaterial({
        color: hexColor,
        emissive: hexColor,
        emissiveIntensity: 0.45,
        roughness: 0.2,
        metalness: 0.85,
      });
      const baseMesh = new THREE.Mesh(baseGeo, baseMat);
      hubAnchor.add(baseMesh);

      // Vertical data spire
      const spireGeo = new THREE.CylinderGeometry(0.012, 0.02, 0.14, 12);
      spireGeo.rotateX(Math.PI / 2);
      spireGeo.translate(0, 0, 0.07);
      const spireMat = new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        emissive: hexColor,
        emissiveIntensity: 0.7,
        roughness: 0.15,
        metalness: 0.9,
      });
      const spireMesh = new THREE.Mesh(spireGeo, spireMat);
      hubAnchor.add(spireMesh);

      globeGroup.add(hubAnchor);
      hubMeshesMap.set(hub.id, hubAnchor);
    });

    // Part 7: High-altitude Domestic & Global Economic Corridor Arcs connecting Mumbai/Delhi/Bengaluru/Chennai/Kolkata
    const corridorPairs: [number, number][] = [
      [0, 1], // Mumbai - New Delhi
      [0, 2], // Mumbai - Bengaluru
      [1, 6], // New Delhi - Kolkata
      [2, 3], // Bengaluru - Chennai
      [0, 4], // Mumbai - GIFT City
      [2, 5], // Bengaluru - Hyderabad
      [5, 1], // Hyderabad - New Delhi
    ];

    corridorPairs.forEach(([idxA, idxB], arcIdx) => {
      const hubA = INDIA_ECONOMIC_HUBS[idxA];
      const hubB = INDIA_ECONOMIC_HUBS[idxB];
      const startVec = latLonToVec3(hubA.lat, hubA.lon, GLOBE_RADIUS * 1.02);
      const endVec = latLonToVec3(hubB.lat, hubB.lon, GLOBE_RADIUS * 1.02);
      const midVec = startVec.clone().add(endVec).multiplyScalar(0.5).normalize().multiplyScalar(GLOBE_RADIUS * 1.16);

      const arcCurve = new THREE.QuadraticBezierCurve3(startVec, midVec, endVec);
      const arcGeo = new THREE.TubeGeometry(arcCurve, 24, 0.006, 6, false);
      const arcMat = new THREE.MeshStandardMaterial({
        color: arcIdx % 2 === 0 ? 0xf59e0b : 0x10b981,
        emissive: arcIdx % 2 === 0 ? 0xd97706 : 0x059669,
        emissiveIntensity: 0.5,
        roughness: 0.3,
        metalness: 0.8,
        transparent: true,
        opacity: 0.85,
      });
      const arcMesh = new THREE.Mesh(arcGeo, arcMat);
      globeGroup.add(arcMesh);
    });

    // Part 8: Contact grounding radial shadow beneath the globe
    const shadowGeo = new THREE.PlaneGeometry(3.4, 3.4);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const sCtx = shadowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(64, 64, 8, 64, 64, 60);
      grad.addColorStop(0, 'rgba(6, 11, 22, 0.55)');
      grad.addColorStop(1, 'rgba(6, 11, 22, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -GLOBE_RADIUS * 1.28;
    scene.add(shadowPlane);

    // Orient globe initially so India (Lat ~21N, Lon ~78E) faces the viewer
    const INITIAL_ROT_Y = -2.92;
    const INITIAL_ROT_X = 0.32;
    globeGroup.rotation.y = INITIAL_ROT_Y;
    globeGroup.rotation.x = INITIAL_ROT_X;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    // Visibility observer so animation pauses when scrolled out of view
    let isVisible = true;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
        });
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    // Pointer drag interaction
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let targetRotY = INITIAL_ROT_Y;
    let targetRotX = INITIAL_ROT_X;

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;
      targetRotY += dx * 0.007;
      targetRotX = THREE.MathUtils.clamp(targetRotX + dy * 0.005, -0.4, 0.75);
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 520;
      const h = container.clientHeight || 420;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Paced render loop with software WebGL fence sync guard
    let frameId = 0;
    let disposed = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      if (disposed) return;
      const gl = renderer.getContext() as WebGL2RenderingContext;
      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        gl.flush();
        const poll = () => {
          if (disposed) return;
          const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
          if (state === gl.UNSIGNALED) {
            frameId = window.setTimeout(poll, 8);
          } else {
            if (sync) gl.deleteSync(sync);
            frameId = window.setTimeout(cb, 80);
          }
        };
        frameId = window.setTimeout(poll, 8);
      } else {
        frameId = window.setTimeout(cb, 80);
      }
    }

    function tick() {
      if (disposed) return;
      const delta = Math.min(clock.getDelta(), 0.1);

      if (isVisible) {
        if (isRotatingRef.current && !isDragging) {
          // Gentle oscillation centered around the Indian subcontinent so India remains prominent
          const elapsed = clock.getElapsedTime();
          targetRotY = INITIAL_ROT_Y + Math.sin(elapsed * 0.35) * 0.38;
        }

        globeGroup.rotation.y = THREE.MathUtils.damp(globeGroup.rotation.y, targetRotY, 5, delta);
        globeGroup.rotation.x = THREE.MathUtils.damp(globeGroup.rotation.x, targetRotX, 5, delta);

        outerRing.rotation.z += delta * 0.15;
        secondRing.rotation.y -= delta * 0.12;

        // Emphasize currently selected Indian hub spire scale smoothly
        const activeId = selectedHubRef.current.id;
        hubMeshesMap.forEach((group, id) => {
          const targetScale = id === activeId ? 1.55 : 1.0;
          const nextScale = THREE.MathUtils.damp(group.scale.x, targetScale, 7, delta);
          group.scale.setScalar(nextScale);
        });

        renderer.render(scene, camera);
      }

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    tick();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      observer.disconnect();
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, [theme, useStaticFallback]);

  const showFallback = !webglSupported || useStaticFallback;

  return (
    <div className="relative w-full h-[430px] sm:h-[460px] rounded-xl border border-slate-800/80 bg-[#070E1E] overflow-hidden select-none flex flex-col justify-between">
      {/* Top-Left Minimal Spec Label (unboxed metadata per design constitution) */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-3.5 pointer-events-none">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-tabular">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-200 font-medium">India Economic Corridor Model</span>
          <span aria-hidden="true">·</span>
          <span>20.59°N, 78.96°E</span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={() => setIsRotating((prev) => !prev)}
            disabled={showFallback}
            title={isRotating ? 'Pause orbital motion' : 'Resume orbital motion'}
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/80 rounded-md transition-colors flex items-center gap-1.5 disabled:opacity-40 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isRotating ? <Pause className="w-3 h-3 text-emerald-400" /> : <Play className="w-3 h-3 text-amber-400" />}
            <span>{isRotating ? 'Pause' : 'Orbit'}</span>
          </button>
          <button
            type="button"
            onClick={() => setUseStaticFallback((prev) => !prev)}
            title="Switch between 3D WebGL model and 2D Vector Diagram"
            className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-900/90 border border-slate-700/80 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {showFallback ? <Globe className="w-3 h-3 text-emerald-400" /> : <Layers className="w-3 h-3 text-cyan-400" />}
            <span>{showFallback ? '3D Globe' : '2D Vector'}</span>
          </button>
        </div>
      </div>

      {/* Central Unobstructed 3D Viewport or 2D SVG Fallback */}
      {showFallback ? (
        <div className="relative flex-1 flex items-center justify-center p-4">
          <svg
            viewBox="0 0 400 280"
            className="w-full h-full max-h-[260px]"
            role="img"
            aria-label="Architectural vector network of Indian economic corridors"
          >
            <defs>
              <radialGradient id="indiaGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.22" />
                <stop offset="100%" stopColor="#060b16" stopOpacity="0" />
              </radialGradient>
            </defs>
            <circle cx="200" cy="140" r="120" fill="url(#indiaGlow)" stroke="#1e293b" strokeWidth="1" />
            <circle cx="200" cy="140" r="92" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
            <ellipse cx="200" cy="140" rx="135" ry="52" fill="none" stroke="#10b981" strokeOpacity="0.3" />
            {/* Stylized India Polygon & Corridor Lines */}
            <path
              d="M195,42 L222,68 L255,105 L230,145 L212,195 L196,232 L176,188 L158,142 L145,112 L172,76 Z"
              fill="#10b981"
              fillOpacity="0.09"
              stroke="#10b981"
              strokeWidth="1.5"
            />
            <line x1="168" y1="152" x2="192" y2="82" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="2 2" />
            <line x1="168" y1="152" x2="188" y2="195" stroke="#10b981" strokeWidth="1.2" />
            <line x1="188" y1="195" x2="206" y2="192" stroke="#06b6d4" strokeWidth="1.2" />
            <line x1="192" y1="82" x2="236" y2="128" stroke="#10b981" strokeWidth="1.2" />
            {/* Hub nodes */}
            {[
              { id: 'delhi-ncr', cx: 192, cy: 82, label: 'Delhi NCR' },
              { id: 'gift-ahmedabad', cx: 158, cy: 122, label: 'GIFT City' },
              { id: 'mumbai', cx: 168, cy: 152, label: 'Mumbai' },
              { id: 'hyderabad', cx: 195, cy: 162, label: 'Hyderabad' },
              { id: 'bengaluru', cx: 188, cy: 195, label: 'Bengaluru' },
              { id: 'chennai', cx: 208, cy: 196, label: 'Chennai' },
              { id: 'kolkata', cx: 236, cy: 128, label: 'Kolkata' },
            ].map((node) => {
              const isSelected = selectedHub.id === node.id;
              return (
                <g
                  key={node.id}
                  className="cursor-pointer"
                  onClick={() => {
                    const found = INDIA_ECONOMIC_HUBS.find((h) => h.id === node.id);
                    if (found) setSelectedHub(found);
                  }}
                >
                  <circle
                    cx={node.cx}
                    cy={node.cy}
                    r={isSelected ? 6 : 4}
                    fill={isSelected ? '#f59e0b' : '#10b981'}
                  />
                  <text
                    x={node.cx + 8}
                    y={node.cy + 3}
                    fill={isSelected ? '#f8fafc' : '#94a3b8'}
                    fontSize="10"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {node.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div
          ref={mountRef}
          className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
          aria-label="Interactive 3D India Economic Network Globe"
        />
      )}

      {/* Unified Collapsible Bottom Control Dock (Zero Side-Panel Occlusion, No backdrop-filter over WebGL) */}
      <div className="relative z-10 mx-auto w-[94%] max-w-[600px] mb-3">
        <div className="flex justify-end mb-1">
          <button
            type="button"
            onClick={() => setHudCollapsed((prev) => !prev)}
            className="px-2.5 py-1 text-[11px] font-medium text-slate-300 hover:text-white bg-[#0B1325] border border-slate-700/80 rounded-t-md flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Eye className="w-3 h-3 text-emerald-400" />
            <span>{hudCollapsed ? 'Show Hub Telemetry' : 'Hide HUD'}</span>
            {hudCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        {!hudCollapsed && (
          <div className="bg-[#0B1325] border border-slate-700/90 rounded-lg p-3 shadow-lg">
            {/* Regional Node Switcher */}
            <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-2 border-b border-slate-800">
              {INDIA_ECONOMIC_HUBS.map((hub) => {
                const active = selectedHub.id === hub.id;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setSelectedHub(hub)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    {hub.city}
                  </button>
                );
              })}
            </div>

            {/* Active Node Readout */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-slate-200 font-semibold">
                  <span>{selectedHub.city}</span>
                  <span className="text-slate-500" aria-hidden="true">·</span>
                  <span className="text-slate-400 font-normal truncate">{selectedHub.primarySector}</span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">{selectedHub.gdpContributionNote}</p>
              </div>
              <div className="shrink-0 sm:text-right border-t sm:border-t-0 pt-1.5 sm:pt-0 border-slate-800">
                <div className="text-[10px] text-slate-400">{selectedHub.keyMetricLabel}</div>
                <div className="font-mono-tabular text-xs font-semibold text-amber-400">
                  {selectedHub.keyMetricValue}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
