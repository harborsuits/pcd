import { Suspense, useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

function Model() {
  const { scene } = useGLTF("/models/hero-model.glb");
  const groupRef = useRef<THREE.Group>(null);

  // Auto-fit: center + scale based on bounding box
  const { scale, position } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const maxDim = Math.max(size.x, size.y, size.z);
    const target = 2.2; // hero-friendly size in scene units
    const s = target / maxDim;

    return {
      scale: [s, s, s] as [number, number, number],
      position: [-center.x * s, -center.y * s - 0.3, -center.z * s] as [number, number, number],
    };
  }, [scene]);

  // Fix materials and enable shadows
  useEffect(() => {
    scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        if (mesh.material) {
          const mat = mesh.material as THREE.MeshStandardMaterial;
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <primitive object={scene} scale={scale} position={position} />
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
        camera={{ position: [0, 1, 8], fov: 35 }}
        shadows
        style={{ background: "transparent" }}
        gl={{ 
          alpha: true, 
          antialias: true,
          outputColorSpace: THREE.SRGBColorSpace,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        {/* Strong studio lighting */}
        <ambientLight intensity={0.8} />
        <directionalLight position={[5, 5, 5]} intensity={1.5} castShadow />
        <directionalLight position={[-5, 5, -5]} intensity={0.8} />
        <pointLight position={[0, -5, 0]} intensity={0.5} color="#7c3aed" />
        
        <Suspense fallback={<LoadingFallback />}>
          <Model />
          <Environment preset="studio" />
          <ContactShadows 
            position={[0, -1.5, 0]} 
            opacity={0.4} 
            scale={10} 
            blur={2} 
          />
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
