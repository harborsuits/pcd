import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import waterBg from "@/assets/water-bg.jpeg";

function FitCameraToObject({ object }: { object: THREE.Object3D }) {
  const { camera } = useThree();

  useEffect(() => {
    if (!object) return;

    const box = new THREE.Box3().setFromObject(object);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    // Center the object at origin
    object.position.x += (object.position.x - center.x);
    object.position.y += (object.position.y - center.y);
    object.position.z += (object.position.z - center.z);

    const maxDim = Math.max(size.x, size.y, size.z);

    // Compute camera distance from FOV so the object fits
    const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180);
    let cameraZ = Math.abs((maxDim / 2) / Math.tan(fov / 2));

    cameraZ *= 1.5; // padding factor

    camera.position.set(0, maxDim * 0.15, cameraZ);
    camera.lookAt(0, 0, 0);

    camera.near = cameraZ / 100;
    camera.far = cameraZ * 100;
    camera.updateProjectionMatrix();
  }, [object, camera]);

  return null;
}

function Model() {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF("/models/hero-model.glb");

  // Slow rotation with gentle bobbing for underwater feel
  useFrame((state) => {
    if (groupRef.current) {
      const t = state.clock.elapsedTime;
      groupRef.current.rotation.y = t * 0.08;
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.05;
    }
  });

  // Apply blue tint and water-appropriate materials
  useEffect(() => {
    scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.color.set("#e6f4ff"); // Slight blue tint
          mat.metalness = 0.05;
          mat.roughness = 0.35;
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
      <FitCameraToObject object={scene} />
    </group>
  );
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#e6f4ff" wireframe />
    </mesh>
  );
}

export function Hero3DModel() {
  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[560px] rounded-xl overflow-hidden">
      {/* Water background image */}
      <img 
        src={waterBg} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Radial depth fade overlay - mimics underwater light absorption */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle at center,
              rgba(255,255,255,0.08) 0%,
              rgba(0,0,0,0.25) 55%,
              rgba(0,0,0,0.45) 100%
            )
          `,
        }}
      />
      
      {/* Top/bottom vignette for focus */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 30%),
            linear-gradient(to top, rgba(0,0,0,0.35), transparent 40%)
          `,
        }}
      />
      
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
        {/* Underwater fog for depth blending */}
        <fog attach="fog" args={["#0b2a3a", 6, 14]} />
        
        {/* Matched lighting - top-down like water photo */}
        <ambientLight intensity={0.35} />
        <directionalLight 
          position={[2, 6, 4]} 
          intensity={1.2} 
          color="#d6f1ff"
          castShadow 
        />
        <directionalLight position={[-3, 4, -2]} intensity={0.5} color="#a8d4f0" />
        
        <Suspense fallback={<LoadingFallback />}>
          <Model />
          {/* Contact shadow for grounding */}
          <ContactShadows 
            position={[0, -1.1, 0]} 
            opacity={0.35} 
            scale={6} 
            blur={2.5} 
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
