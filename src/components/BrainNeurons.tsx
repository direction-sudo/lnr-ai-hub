import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Neuron {
  position: THREE.Vector3;
  connections: number[];
}

export default function BrainNeurons() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // ─── Scene ───
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 100);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // ─── Generate brain-like neuron network ───
    const neuronCount = 120;
    const neurons: Neuron[] = [];

    // Create neurons in a brain-like shape (two hemispheres)
    for (let i = 0; i < neuronCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.2 + Math.random() * 0.6;

      // Bias towards two hemispheres (brain shape)
      const hemisphereBias = Math.random() > 0.5 ? 0.4 : -0.4;
      const x = r * Math.sin(phi) * Math.cos(theta) + hemisphereBias;
      const y = r * Math.sin(phi) * Math.sin(theta) * 0.8;
      const z = r * Math.cos(phi) * 0.7;

      neurons.push({
        position: new THREE.Vector3(x, y, z),
        connections: [],
      });
    }

    // Create connections between nearby neurons
    const maxDistance = 0.7;
    neurons.forEach((neuron, i) => {
      neurons.forEach((other, j) => {
        if (i >= j) return;
        const dist = neuron.position.distanceTo(other.position);
        if (dist < maxDistance && Math.random() > 0.6) {
          neuron.connections.push(j);
        }
      });
    });

    // ─── Neuron nodes (spheres) ───
    const nodeGeometry = new THREE.SphereGeometry(0.035, 8, 8);
    const nodeMaterial = new THREE.MeshBasicMaterial({
      color: 0xD4A853,
      transparent: true,
      opacity: 0.85,
    });

    const nodesMesh = new THREE.InstancedMesh(nodeGeometry, nodeMaterial, neuronCount);
    const dummy = new THREE.Object3D();

    neurons.forEach((neuron, i) => {
      dummy.position.copy(neuron.position);
      dummy.updateMatrix();
      nodesMesh.setMatrixAt(i, dummy.matrix);
    });
    scene.add(nodesMesh);

    // ─── Core glow nodes (larger, brighter) ───
    const coreGeometry = new THREE.SphereGeometry(0.06, 8, 8);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: 0xE8C87A,
      transparent: true,
      opacity: 0.6,
    });

    const corePositions = neurons
      .map((n, i) => ({ i, dist: n.position.length() }))
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 15);

    const coresMesh = new THREE.InstancedMesh(coreGeometry, coreMaterial, corePositions.length);
    corePositions.forEach((cp, idx) => {
      dummy.position.copy(neurons[cp.i].position);
      dummy.updateMatrix();
      coresMesh.setMatrixAt(idx, dummy.matrix);
    });
    scene.add(coresMesh);

    // ─── Connection lines ───
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0xD4A853,
      transparent: true,
      opacity: 0.12,
    });

    const linePoints: THREE.Vector3[] = [];
    neurons.forEach((neuron, i) => {
      neuron.connections.forEach(j => {
        linePoints.push(neuron.position.clone());
        linePoints.push(neurons[j].position.clone());
      });
    });

    const lineGeometry = new THREE.BufferGeometry().setFromPoints(linePoints);
    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // ─── Electrical impulses (traveling along connections) ───
    const impulseCount = 25;
    const impulseGeometry = new THREE.SphereGeometry(0.025, 6, 6);
    const impulseMaterial = new THREE.MeshBasicMaterial({
      color: 0xE8C87A,
      transparent: true,
      opacity: 0.9,
    });
    const impulsesMesh = new THREE.InstancedMesh(impulseGeometry, impulseMaterial, impulseCount);
    scene.add(impulsesMesh);

    // Track impulse states
    interface Impulse {
      from: number;
      to: number;
      progress: number;
      speed: number;
    }

    const impulses: Impulse[] = [];
    for (let i = 0; i < impulseCount; i++) {
      const fromIdx = Math.floor(Math.random() * neuronCount);
      const conns = neurons[fromIdx].connections;
      const toIdx = conns.length > 0 ? conns[Math.floor(Math.random() * conns.length)] : Math.floor(Math.random() * neuronCount);
      impulses.push({
        from: fromIdx,
        to: toIdx,
        progress: Math.random(),
        speed: 0.005 + Math.random() * 0.015,
      });
    }

    // ─── Floating particles ───
    const particleCount = 60;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 5;
      particlePositions[i + 1] = (Math.random() - 0.5) * 5;
      particlePositions[i + 2] = (Math.random() - 0.5) * 5;
    }
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMaterial = new THREE.PointsMaterial({
      color: 0xD4A853,
      size: 0.02,
      transparent: true,
      opacity: 0.3,
    });
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // ─── Ambient glow (point light) ───
    const glowLight = new THREE.PointLight(0xD4A853, 0.5, 4);
    glowLight.position.set(0, 0, 0);
    scene.add(glowLight);

    // ─── Mouse interaction ───
    const mouse = { x: 0, y: 0 };
    const onMouseMove = (e: MouseEvent) => {
      mouse.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouse.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', onMouseMove);

    // ─── Animation ───
    const group = new THREE.Group();
    group.add(nodesMesh);
    group.add(coresMesh);
    group.add(lines);
    group.add(impulsesMesh);
    group.add(particles);
    group.add(glowLight);
    scene.add(group);

    let time = 0;
    const animate = () => {
      time += 0.008;

      // Slow rotation
      group.rotation.y += 0.002;
      group.rotation.x = Math.sin(time * 0.3) * 0.1;

      // Mouse influence
      group.rotation.y += mouse.x * 0.003;
      group.rotation.x += mouse.y * 0.003;

      // Update impulses
      impulses.forEach((imp, i) => {
        imp.progress += imp.speed;
        if (imp.progress >= 1) {
          // Reset to new connection
          imp.from = imp.to;
          const conns = neurons[imp.from].connections;
          if (conns.length > 0) {
            imp.to = conns[Math.floor(Math.random() * conns.length)];
          } else {
            imp.to = Math.floor(Math.random() * neuronCount);
          }
          imp.progress = 0;
          imp.speed = 0.005 + Math.random() * 0.015;
        }

        const from = neurons[imp.from].position;
        const to = neurons[imp.to].position;
        const pos = new THREE.Vector3().lerpVectors(from, to, imp.progress);
        dummy.position.copy(pos);

        // Pulse size
        const scale = 0.8 + Math.sin(imp.progress * Math.PI) * 0.6;
        dummy.scale.setScalar(scale);

        dummy.updateMatrix();
        impulsesMesh.setMatrixAt(i, dummy.matrix);
      });
      impulsesMesh.instanceMatrix.needsUpdate = true;

      // Pulse core nodes
      const pulseScale = 1 + Math.sin(time * 2) * 0.15;
      coresMesh.scale.setScalar(pulseScale);

      // Rotate particles slowly
      particles.rotation.y += 0.0005;

      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    // ─── Resize ───
    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      coreGeometry.dispose();
      coreMaterial.dispose();
      impulseGeometry.dispose();
      impulseMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
      }}
    />
  );
}
