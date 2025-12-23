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
      <group ref={groupRef} scale={0.15} position={[0, -0.5, 0]}>
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
    <div className="w-full h-[400px] md:h-[500px] lg:h-[560px]">
      <Canvas
        camera={{ position: [0, 1, 10], fov: 30 }}
        style={{ background: "transparent" }}
        gl={{ 
          alpha: true, 
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
        }}
      >
        {/* Soft base light */}
        <ambientLight intensity={0.6} />
        
        {/* Main light (shape + highlights) */}
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        
        {/* Rim light (separation from background) */}
        <pointLight position={[-5, -5, -5]} intensity={0.8} color="#7c3aed" />
        
        <Suspense fallback={<LoadingFallback />}>
          <Model />
          <Environment preset="studio" />
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
