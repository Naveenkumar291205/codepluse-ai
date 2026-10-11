import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

export const ThreeHeroScene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);

  useEffect(() => {
    // Check WebGL support
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebGLSupported(false);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    // Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050811, 0.045);

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 22;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for mouse rotation
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    // 1. Central Abstract Code Analysis Core
    const coreGeometry = new THREE.IcosahedronGeometry(3.2, 1);
    const coreWireframe = new THREE.WireframeGeometry(coreGeometry);
    const coreLine = new THREE.LineSegments(
      coreWireframe,
      new THREE.LineBasicMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.75,
      })
    );
    mainGroup.add(coreLine);

    const innerCoreGeo = new THREE.SphereGeometry(1.6, 16, 16);
    const innerCoreMat = new THREE.MeshBasicMaterial({
      color: 0x3b82f6,
      wireframe: true,
      transparent: true,
      opacity: 0.35,
    });
    const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
    mainGroup.add(innerCore);

    // 2. Floating Function Nodes (Spheres)
    const nodeCount = 28;
    const nodeGroup = new THREE.Group();
    mainGroup.add(nodeGroup);

    const nodePositions: THREE.Vector3[] = [];
    const nodeMeshes: THREE.Mesh[] = [];

    const sphereGeo = new THREE.SphereGeometry(0.35, 12, 12);
    const sphereMatCyan = new THREE.MeshBasicMaterial({ color: 0x00f2fe });
    const sphereMatBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const sphereMatViolet = new THREE.MeshBasicMaterial({ color: 0xa855f7 });

    const materials = [sphereMatCyan, sphereMatBlue, sphereMatViolet];

    for (let i = 0; i < nodeCount; i++) {
      const radius = 6 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi) * 0.7; // flatten slightly

      const pos = new THREE.Vector3(x, y, z);
      nodePositions.push(pos);

      const mesh = new THREE.Mesh(
        sphereGeo,
        materials[Math.floor(Math.random() * materials.length)]
      );
      mesh.position.copy(pos);
      nodeGroup.add(mesh);
      nodeMeshes.push(mesh);
    }

    // 3. Dependency Edges (Connecting lines between nodes)
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x0ea5e9,
      transparent: true,
      opacity: 0.3,
    });

    const linePoints: THREE.Vector3[] = [];
    for (let i = 0; i < nodePositions.length; i++) {
      // Connect to central core
      if (Math.random() > 0.6) {
        linePoints.push(nodePositions[i]);
        linePoints.push(new THREE.Vector3(0, 0, 0));
      }
      // Connect to 2 nearby nodes
      for (let j = i + 1; j < nodePositions.length; j++) {
        const dist = nodePositions[i].distanceTo(nodePositions[j]);
        if (dist < 6.5) {
          linePoints.push(nodePositions[i]);
          linePoints.push(nodePositions[j]);
        }
      }
    }

    const lineGeo = new THREE.BufferGeometry().setFromPoints(linePoints);
    const linesMesh = new THREE.LineSegments(lineGeo, lineMat);
    mainGroup.add(linesMesh);

    // 4. Floating Particles
    const particleCount = 140;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 50;
      particlePositions[i + 1] = (Math.random() - 0.5) * 50;
      particlePositions[i + 2] = (Math.random() - 0.5) * 40;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(particlePositions, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.5,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // 5. Lighting
    const pointLight = new THREE.PointLight(0x06b6d4, 3, 50);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    const ambientLight = new THREE.AmbientLight(0x0a192f, 2);
    scene.add(ambientLight);

    // Mouse Interaction / Parallax
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

    const onMouseMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / container.clientWidth) * 2 - 1;
      mouseY = -(((event.clientY - rect.top) / container.clientHeight) * 2 - 1);
    };

    window.addEventListener('mousemove', onMouseMove);

    // Resize handler
    const onResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', onResize);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth mouse parallax
      targetX += (mouseX - targetX) * 0.05;
      targetY += (mouseY - targetY) * 0.05;

      mainGroup.rotation.y = elapsedTime * 0.08 + targetX * 0.4;
      mainGroup.rotation.x = Math.sin(elapsedTime * 0.05) * 0.1 - targetY * 0.3;

      // Pulse core
      coreLine.rotation.y = -elapsedTime * 0.12;
      coreLine.rotation.z = elapsedTime * 0.06;
      innerCore.rotation.x = elapsedTime * 0.15;

      const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.04;
      coreLine.scale.set(scale, scale, scale);

      // Rotate particles slightly
      particles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animationFrameId);

      coreGeometry.dispose();
      coreWireframe.dispose();
      innerCoreGeo.dispose();
      sphereGeo.dispose();
      lineGeo.dispose();
      particleGeo.dispose();

      coreLine.material.dispose();
      innerCoreMat.dispose();
      sphereMatCyan.dispose();
      sphereMatBlue.dispose();
      sphereMatViolet.dispose();
      lineMat.dispose();
      particleMat.dispose();

      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  if (!webGLSupported) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-radial from-cyan-950/20 to-slate-950">
        <div className="relative w-72 h-72 border border-cyan-500/30 rounded-full flex items-center justify-center animate-pulse">
          <div className="w-48 h-48 border border-blue-500/40 rounded-full flex items-center justify-center">
            <div className="w-24 h-24 bg-cyan-500/20 rounded-full blur-md" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative pointer-events-none select-none"
    />
  );
};
