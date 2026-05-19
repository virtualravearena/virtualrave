"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { TextureLoader } from "three";

export type CeremonyAct = 0 | 1 | 2 | 3 | 4 | -1;

interface SceneProps {
  act: CeremonyAct;
  beatPhase: number;          // 0..1 within current beat
  totalBeats: number;         // monotonic beat counter
  audioLevel: number;         // 0..1 driven by audio analyser (we approximate from beat phase)
}

function Smileys({ count = 80, act, totalBeats }: { count?: number; act: CeremonyAct; totalBeats: number }) {
  const texture = useLoader(TextureLoader, "/smiley/smile.png");
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * 30,
        y: (Math.random() - 0.5) * 18,
        z: -Math.random() * 28 - 4,
        rot: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.8,
        scale: 0.4 + Math.random() * 1.0,
      })),
    [count],
  );

  useFrame((_, dt) => {
    if (!meshRef.current) return;
    seeds.forEach((s, i) => {
      const swirl = act === 3 ? 4 : act === 2 ? 1.2 : 0.4;
      s.rot += dt * s.speed * swirl;
      const r = act === 3 ? 6 + Math.sin(totalBeats * Math.PI) * 2 : 3;
      dummy.position.set(
        s.x + Math.sin(s.rot) * r * 0.3,
        s.y + Math.cos(s.rot * 0.7) * r * 0.2,
        s.z,
      );
      const scaleBoost = act === 3 ? 1.6 : 1;
      dummy.scale.setScalar(s.scale * scaleBoost);
      dummy.rotation.z = s.rot;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </instancedMesh>
  );
}

function TB303({ act, beatPhase, totalBeats }: { act: CeremonyAct; beatPhase: number; totalBeats: number }) {
  const texture = useLoader(TextureLoader, "/assets/tb303.jpg");
  const group = useRef<THREE.Group>(null);
  const ghostR = useRef<THREE.Mesh>(null);
  const ghostB = useRef<THREE.Mesh>(null);
  const scanRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.InstancedMesh>(null);
  const sparkSeeds = useMemo(
    () =>
      Array.from({ length: 40 }, () => ({
        angle: Math.random() * Math.PI * 2,
        speed: 2 + Math.random() * 4,
        life: Math.random(),
        scale: 0.05 + Math.random() * 0.12,
        offsetBeat: Math.random() * 2,
      })),
    [],
  );
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, dt) => {
    if (!group.current) return;
    const targetY = act >= 1 ? Math.sin(totalBeats * Math.PI) * 0.4 : -6;
    const targetZ = act === 3 ? -1.5 : act >= 1 ? -4 : -10;
    group.current.position.y += (targetY - group.current.position.y) * 0.08;
    group.current.position.z += (targetZ - group.current.position.z) * 0.08;
    // pump hard on beat
    const pump = 1 + Math.pow(1 - beatPhase, 3) * 0.14;
    const baseScale = act === 3 ? 1.5 : act === 2 ? 1.1 : 1;
    group.current.scale.setScalar(pump * baseScale);
    // wobble rotation, on the beat
    group.current.rotation.z = Math.sin(totalBeats * Math.PI * 0.5) * 0.05;
    group.current.rotation.y += dt * (act === 3 ? 0.6 : act === 2 ? 0.25 : 0.05);
    // shake on big beats
    const onBeat = beatPhase < 0.08;
    const shake = onBeat && act >= 2 ? (act === 3 ? 0.35 : 0.15) : 0;
    group.current.position.x = (Math.random() - 0.5) * shake;

    // RGB ghosts — pump opposite directions on beat
    const split = (act === 3 ? 0.18 : act === 2 ? 0.08 : 0.04) * (1 - beatPhase);
    if (ghostR.current) {
      ghostR.current.position.x = -split;
      (ghostR.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - beatPhase * 0.4);
    }
    if (ghostB.current) {
      ghostB.current.position.x = split;
      (ghostB.current.material as THREE.MeshBasicMaterial).opacity = 0.55 * (1 - beatPhase * 0.4);
    }

    // scan line sweeping vertically across the unit
    if (scanRef.current) {
      const speed = act === 3 ? 4 : 1.5;
      const y = ((state.clock.getElapsedTime() * speed) % 4) - 2;
      scanRef.current.position.y = y;
      (scanRef.current.material as THREE.MeshBasicMaterial).opacity = act >= 1 ? 0.55 : 0;
    }

    // sparks bursting out on each beat
    if (sparksRef.current) {
      sparkSeeds.forEach((s, i) => {
        const phase = ((totalBeats + s.offsetBeat) % 1);
        const r = phase * s.speed;
        const x = Math.cos(s.angle) * r;
        const y = Math.sin(s.angle) * r;
        const fade = Math.max(0, 1 - phase);
        dummy.position.set(x, y, 0.5);
        dummy.scale.setScalar(s.scale * fade * (act === 3 ? 2.5 : act === 2 ? 1.3 : 0.6));
        dummy.rotation.z = s.angle;
        dummy.updateMatrix();
        sparksRef.current!.setMatrixAt(i, dummy.matrix);
      });
      sparksRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={group} position={[0, -6, -10]}>
      {/* glowing yellow rim — pulses */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[6.8, 4.8]} />
        <meshBasicMaterial color="#ffe800" transparent opacity={0.45} />
      </mesh>
      {/* RGB ghost copies for chroma split */}
      <mesh ref={ghostR} position={[-0.05, 0, -0.02]}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial map={texture} transparent color="#ff2bd6" opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={ghostB} position={[0.05, 0, -0.02]}>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial map={texture} transparent color="#19f7ff" opacity={0.55} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* main plate */}
      <mesh>
        <planeGeometry args={[6, 4]} />
        <meshBasicMaterial map={texture} transparent={false} />
      </mesh>
      {/* sweep scan line */}
      <mesh ref={scanRef} position={[0, 0, 0.05]}>
        <planeGeometry args={[6.4, 0.08]} />
        <meshBasicMaterial color="#ffe800" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {/* sparks */}
      <instancedMesh ref={sparksRef} args={[undefined, undefined, sparkSeeds.length]} position={[0, 0, 0.08]}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffe800" transparent opacity={0.95} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

function Big303({ act, totalBeats }: { act: CeremonyAct; totalBeats: number }) {
  const group = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!group.current) return;
    const targetZ = act === 3 ? -3 : 8;
    group.current.position.z += (targetZ - group.current.position.z) * 0.18;
    const targetScale = act === 3 ? 4.5 : 0.2;
    const cur = group.current.scale.x;
    const next = cur + (targetScale - cur) * 0.18;
    group.current.scale.setScalar(next);
    // shake on drop
    if (act === 3) {
      const shake = Math.max(0, 1 - (totalBeats % 1) * 2);
      group.current.position.x = (Math.random() - 0.5) * shake * 0.4;
      group.current.position.y = (Math.random() - 0.5) * shake * 0.4;
    } else {
      group.current.position.x = 0;
      group.current.position.y = 0;
    }
  });

  // We render "303" as 3 stacked extruded plane sprites via Text from drei would need extra dep.
  // Use canvas texture to draw the number, then map to a plane.
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const x = c.getContext("2d")!;
    x.fillStyle = "rgba(0,0,0,0)";
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#ffe800";
    x.font = "900 480px 'Arial Black', sans-serif";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("303", c.width / 2, c.height / 2);
    // outline
    x.strokeStyle = "#000";
    x.lineWidth = 12;
    x.strokeText("303", c.width / 2, c.height / 2);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }, []);

  return (
    <group ref={group} position={[0, 0, 8]} scale={0.2}>
      <mesh>
        <planeGeometry args={[6, 3]} />
        <meshBasicMaterial map={texture} transparent />
      </mesh>
    </group>
  );
}

function Strobe({ act, totalBeats }: { act: CeremonyAct; totalBeats: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.MeshBasicMaterial;
    const onBeat = totalBeats - Math.floor(totalBeats) < 0.06;
    const intensity = act === 2 ? 0.35 : act === 3 ? 0.7 : 0;
    mat.opacity = onBeat ? intensity : 0;
  });
  return (
    <mesh ref={ref} position={[0, 0, 5]}>
      <planeGeometry args={[60, 40]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

function FullscreenFX({ act, beatPhase }: { act: CeremonyAct; beatPhase: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIntensity: { value: 0.5 },
      uVignette: { value: 0.85 },
    }),
    [],
  );

  useFrame((state) => {
    uniforms.uTime.value = state.clock.getElapsedTime();
    uniforms.uIntensity.value = act === 3 ? 1.0 : 0.45;
    if (ref.current) {
      const pump = act === 3 ? 1 + (1 - beatPhase) * 0.05 : 1;
      ref.current.scale.setScalar(pump);
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, 0.1]}>
      {/* large quad that always sits in front of the camera */}
      <planeGeometry args={[40, 22]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        depthTest={false}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform float uTime;
          uniform float uIntensity;
          uniform float uVignette;
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          void main() {
            vec2 uv = vUv;
            // noise grain
            float n = hash(uv * 800.0 + vec2(uTime * 60.0, uTime * 33.0));
            vec3 col = vec3(0.0);
            float grain = (n - 0.5) * 0.25 * uIntensity;
            // vignette
            float d = distance(uv, vec2(0.5));
            float vig = smoothstep(0.85, 0.25, d) * 0.0 + smoothstep(0.25, 0.85, d) * uVignette;
            col += grain;
            float alpha = vig * 0.85 + abs(grain);
            // scanline
            float scan = sin(uv.y * 800.0 + uTime * 4.0) * 0.025 * uIntensity;
            col += scan;
            alpha = clamp(alpha, 0.0, 1.0);
            gl_FragColor = vec4(col, alpha);
          }
        `}
      />
    </mesh>
  );
}

function Camera({ act }: { act: CeremonyAct }) {
  useFrame(({ camera }) => {
    const targets: Record<number, [number, number, number]> = {
      [-1]: [0, 0, 8],
      0: [0, 0, 6],
      1: [0, 0, 4],
      2: [0, 0, 2],
      3: [0, 0, 0.5],
      4: [0, 0, 5],
    };
    const t = targets[act] ?? [0, 0, 6];
    camera.position.x += (t[0] - camera.position.x) * 0.05;
    camera.position.y += (t[1] - camera.position.y) * 0.05;
    camera.position.z += (t[2] - camera.position.z) * 0.05;
    camera.lookAt(0, 0, -5);
  });
  return null;
}

export default function MintCeremonyScene({ act, beatPhase, totalBeats }: SceneProps) {
  // Avoid strobe/chroma at all under reduced motion
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 55 }}
      gl={{ antialias: true, alpha: true, stencil: false, depth: true, powerPreference: "high-performance" }}
      style={{ position: "absolute", inset: 0, background: "#040406" }}
      dpr={[1, 2]}
    >
      <color attach="background" args={["#040406"]} />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 5]} intensity={2 + (1 - beatPhase) * 1.5} color="#ffe800" />
      <pointLight position={[-5, -3, 2]} intensity={0.6} color="#ff2bd6" />
      <pointLight position={[5, -3, 2]} intensity={0.6} color="#19f7ff" />

      <Camera act={act} />
      <Smileys count={reduced ? 20 : 80} act={act} totalBeats={totalBeats} />
      <TB303 act={act} beatPhase={beatPhase} totalBeats={totalBeats} />
      <Big303 act={act} totalBeats={totalBeats} />
      {!reduced && <Strobe act={act} totalBeats={totalBeats} />}

      <FullscreenFX act={act} beatPhase={beatPhase} />
    </Canvas>
  );
}
