"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

export function HeroCanvas() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const W = mount.clientWidth;
    const H = mount.clientHeight;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, W / H, 0.1, 1000);
    camera.position.z = 5;

    // ── Particles ─────────────────────────────────────────────────────────────
    const COUNT = 1400;
    const positions = new Float32Array(COUNT * 3);
    const sizes = new Float32Array(COUNT);
    const speeds = new Float32Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      sizes[i] = Math.random() * 2.5 + 0.5;
      speeds[i] = Math.random() * 0.0004 + 0.0001;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    // Circular sprite texture
    const canvas2d = document.createElement("canvas");
    canvas2d.width = 64; canvas2d.height = 64;
    const ctx2d = canvas2d.getContext("2d")!;
    const grad = ctx2d.createRadialGradient(32, 32, 0, 32, 32, 32);
    grad.addColorStop(0,   "rgba(255,252,246,0.95)");
    grad.addColorStop(0.4, "rgba(255,252,246,0.5)");
    grad.addColorStop(1,   "rgba(255,252,246,0)");
    ctx2d.fillStyle = grad;
    ctx2d.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas2d);

    const mat = new THREE.PointsMaterial({
      size: 0.045,
      map: tex,
      transparent: true,
      depthWrite: false,
      vertexColors: false,
      color: 0xfffcf6,
      opacity: 0.55,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // ── Connection lines (sparse, elegant) ────────────────────────────────────
    const lineGeo = new THREE.BufferGeometry();
    const linePositions: number[] = [];
    const THRESHOLD = 2.2;
    const MAX_LINES = 180;
    let lineCount = 0;

    for (let i = 0; i < COUNT && lineCount < MAX_LINES; i++) {
      for (let j = i + 1; j < COUNT && lineCount < MAX_LINES; j++) {
        const dx = positions[i * 3]     - positions[j * 3];
        const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
        const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < THRESHOLD) {
          linePositions.push(
            positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
            positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
          );
          lineCount++;
        }
      }
    }

    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({ color: 0xfffcf6, opacity: 0.06, transparent: true });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    // ── Mouse parallax ────────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouse = (e: MouseEvent) => {
      mouseX = (e.clientX / W - 0.5) * 0.3;
      mouseY = -(e.clientY / H - 0.5) * 0.3;
    };
    window.addEventListener("mousemove", onMouse);

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = mount.clientWidth, h = mount.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // ── Animate ───────────────────────────────────────────────────────────────
    let raf: number;
    const clock = new THREE.Clock();

    function animate() {
      raf = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Slow drift
      points.rotation.y = t * 0.018;
      points.rotation.x = Math.sin(t * 0.008) * 0.12;
      lines.rotation.copy(points.rotation);

      // Parallax
      camera.position.x += (mouseX - camera.position.x) * 0.04;
      camera.position.y += (mouseY - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    }
    animate();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      lineGeo.dispose();
      lineMat.dispose();
      tex.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      aria-hidden="true"
    />
  );
}
