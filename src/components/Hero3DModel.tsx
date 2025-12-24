import { Suspense, useRef, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, OrbitControls, Environment, Float, ContactShadows } from "@react-three/drei";
import * as THREE from "three";

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

    cameraZ *= 1.5; // padding factor (bigger = smaller model on screen)

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

  // Gentle rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  // Improve material response (even without textures, makes "clay" look good)
  useEffect(() => {
    scene.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat) {
          mat.metalness = mat.metalness ?? 0.1;
          mat.roughness = mat.roughness ?? 0.6;
          mat.side = THREE.DoubleSide;
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <primitive object={scene} />
        <FitCameraToObject object={scene} />
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
    <div className="w-full h-[400px] md:h-[500px] lg:h-[560px] bg-primary rounded-xl">
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
        {/* Lighting that makes "clay" models look good */}
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
