import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Float } from "@react-three/drei";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/models/hero-model.glb");
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={0.25} position={[0, -0.8, 0]}>
        <primitive object={scene} />
      </group>
    </Float>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hsl(var(--accent))" wireframe />
    </mesh>
  );
}

export function Hero3DModel() {
  return (
    <div className="w-full h-[360px] md:h-[460px] lg:h-[520px]">
      <Canvas
        camera={{ position: [0, 0.8, 7], fov: 35 }}
        style={{ background: "transparent" }}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#7c3aed" />
        
        <Suspense fallback={<LoadingFallback />}>
          <Model />
          <Environment preset="city" />
        </Suspense>
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}

// Preload the model
useGLTF.preload("/models/hero-model.glb");
