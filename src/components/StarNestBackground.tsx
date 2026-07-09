import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const vertexShader = `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision mediump float;
  uniform float u_time;
  uniform vec2 u_resolution;
  uniform vec2 u_mouse;
  uniform vec3 u_color1;
  uniform vec3 u_color2;
  uniform float u_colorMix;

  #define iterations 17
  #define formuparam 0.53
  #define volsteps 20
  #define stepsize 0.1
  #define zoom 0.800
  #define tile 0.850
  #define speed 0.010
  #define brightness 0.0015
  #define darkmatter 0.300
  #define distfading 0.730
  #define saturation 0.850

  void main() {
    vec2 uv = gl_FragCoord.xy / u_resolution.xy - 0.5;
    uv.y *= u_resolution.y / u_resolution.x;
    vec3 dir = vec3(uv * zoom, 1.0);
    float time = u_time * speed;

    vec2 mouse = u_mouse;
    mat2 rotMouse;
    float cosM = cos((mouse.x - 0.0) * 0.5);
    float sinM = sin((mouse.y - 0.0) * 0.5);
    rotMouse = mat2(cosM, -sinM, sinM, cosM);
    dir.xz *= rotMouse;

    mat2 rotTime;
    float cosT = cos(time * 0.2);
    float sinT = sin(time * 0.2);
    rotTime = mat2(cosT, -sinT, sinT, cosT);
    dir.xy *= rotTime;

    vec3 from = vec3(1.0, 0.5, 0.5);
    from += vec2(mouse.x * 0.5, mouse.y * 0.3).xxy;
    from.xy *= rotTime;
    from.xz *= rotMouse;

    float s = 0.1;
    float fade = 1.0;
    vec3 v = vec3(0.0);

    for (int r = 0; r < volsteps; r++) {
      vec3 p = from + s * dir * 0.5;
      p = abs(vec3(tile) - mod(p, vec3(tile * 2.0)));
      float pa, a = pa = 0.0;
      for (int i = 0; i < iterations; i++) {
        p = abs(p) / dot(p, p) - formuparam;
        a += abs(length(p) - pa);
        pa = length(p);
      }
      float dm = max(0.0, darkmatter - a * a * 0.001);
      a *= a * a;
      if (r > 6) fade *= 1.0 - dm;
      v += fade;
      v += vec3(s, s * s, s * s * s * s) * a * brightness * fade;
      fade *= distfading;
      s += stepsize;
    }

    v = mix(vec3(length(v)), v, saturation);
    vec3 col = mix(u_color1, u_color2, clamp(v.x * u_colorMix + v.y * 0.3 + v.z * 0.1, 0.0, 1.0));
    col *= pow(length(uv) * 0.8, 0.5);
    col = clamp(col, 0.0, 1.0);
    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function StarNestBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      u_mouse: { value: new THREE.Vector2(0, 0) },
      u_color1: { value: new THREE.Vector3(0.831, 0.659, 0.325) },
      u_color2: { value: new THREE.Vector3(0.910, 0.784, 0.478) },
      u_colorMix: { value: 0.6 },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.targetY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    };

    const animate = () => {
      uniforms.u_time.value = performance.now() * 0.001;
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      uniforms.u_mouse.value.set(mouseRef.current.x, mouseRef.current.y);
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('resize', onResize);
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
      }}
    />
  );
}
