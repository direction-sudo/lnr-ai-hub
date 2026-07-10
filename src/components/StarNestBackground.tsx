import { useEffect, useRef, useState } from 'react';

// ─── Animated gradient background (lightweight fallback) ───
function GradientFallback() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: 'radial-gradient(ellipse at 20% 20%, rgba(212,168,83,0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(27,38,54,0.9) 0%, rgba(14,20,30,1) 100%)',
        backgroundColor: '#0B1017',
      }}
    >
      {/* Subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(212,168,83,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,83,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />
      {/* Animated glow orbs */}
      <div className="absolute top-[10%] left-[15%] w-[300px] h-[300px] rounded-full opacity-20 animate-pulse"
        style={{ background: 'radial-gradient(circle, rgba(212,168,83,0.3) 0%, transparent 70%)', animationDuration: '6s' }} />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-15 animate-pulse"
        style={{ background: 'radial-gradient(circle, rgba(27,38,54,0.5) 0%, transparent 70%)', animationDuration: '8s' }} />
    </div>
  );
}

// ─── StarNest with Three.js (only if WebGL available) ───
function StarNestThree() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl');
    if (!gl) return;

    // Simple star field shader
    const vs = `attribute vec2 a_pos; void main(){ gl_Position=vec4(a_pos,0,1); }`;
    const fs = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_res;
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float noise(vec2 p){
        vec2 i=floor(p),f=fract(p);
        float a=hash(i),b=hash(i+vec2(1,0)),c=hash(i+vec2(0,1)),d=hash(i+vec2(1,1));
        vec2 u=f*f*(3.-2.*f);
        return mix(a,b,u.x)+(c-a)*u.y*(1.-u.x)+(d-b)*u.x*u.y;
      }
      void main(){
        vec2 uv=(gl_FragCoord.xy-u_res*0.5)/min(u_res.x,u_res.y);
        float t=u_time*0.05;
        float v=0.0;
        for(float i=1.0;i<6.0;i++){
          float fi=i;
          float s=pow(2.0,fi);
          v+=noise(uv*s+t*fi)*pow(0.5,fi);
        }
        vec3 col=mix(vec3(0.04,0.06,0.09),vec3(0.08,0.10,0.14),v);
        float stars=0.0;
        for(float i=0.0;i<30.0;i++){
          vec2 p=vec2(hash(vec2(i,0.0)),hash(vec2(0.0,i)))*2.0-1.0;
          p.x*=u_res.x/u_res.y;
          float d=length(uv-p*0.8);
          float b=sin(u_time*0.5+hash(vec2(i,i*2.0))*6.28)*0.3+0.7;
          stars+=0.003/(d+0.001)*b;
        }
        col+=vec3(0.8,0.75,0.6)*stars;
        gl_FragColor=vec4(col,1.0);
      }
    `;

    function compile(type: number, src: string) {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    }

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_res');

    function resize() {
      const dpr = Math.min(window.devicePixelRatio, 1.5);
      canvas!.width = window.innerWidth * dpr;
      canvas!.height = window.innerHeight * dpr;
      gl!.viewport(0, 0, canvas!.width, canvas!.height);
    }
    resize();
    window.addEventListener('resize', resize);

    const start = performance.now();
    function frame() {
      const t = (performance.now() - start) * 0.001;
      gl!.uniform1f(uTime, t);
      gl!.uniform2f(uRes, canvas!.width, canvas!.height);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(frame);
    }
    animId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// ─── Main component with WebGL detection ───
export default function StarNestBackground() {
  const [hasWebGL, setHasWebGL] = useState(false);

  useEffect(() => {
    try {
      const c = document.createElement('canvas');
      const gl = c.getContext('webgl') || c.getContext('experimental-webgl');
      setHasWebGL(!!gl);
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) return <GradientFallback />;
  return <StarNestThree />;
}
