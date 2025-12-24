import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Float, ContactShadows } from "@react-three/drei";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as THREE from "three";

// Material presets - procedural materials for texture-less models
const MATERIAL_PRESETS = {
  tealFrosted: {
    color: '#4FA3A8',
    metalness: 0.4,
    roughness: 0.6,
    envMapIntensity: 0.7,
  },
  blueWhite: {
    color: '#3A6B99',
    metalness: 0.3,
    roughness: 0.5,
    envMapIntensity: 0.8,
  },
};

// Hero model configurations
const HERO_MODELS = [
  {
    path: '/models/hero-model.glb',
    preset: 'tealFrosted',
    caption: 'Client portals & workflows',
  },
  {
    path: '/models/hero-model-2.glb',
    preset: 'blueWhite',
    caption: 'Booking & intake systems',
  },
];

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

interface ModelProps {
  path: string;
  preset: keyof typeof MATERIAL_PRESETS;
  opacity: number;
}

function Model({ path, preset, opacity }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(path);
  const clonedScene = useRef<THREE.Group | null>(null);

  // Clone the scene to avoid shared state between models
  useEffect(() => {
    clonedScene.current = scene.clone(true);
  }, [scene]);

  // Gentle rotation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.12;
    }
  });

  // Apply material preset
  useEffect(() => {
    if (!clonedScene.current) return;
    
    const materialConfig = MATERIAL_PRESETS[preset];
    
    clonedScene.current.traverse((obj: THREE.Object3D) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(materialConfig.color),
          metalness: materialConfig.metalness,
          roughness: materialConfig.roughness,
          side: THREE.DoubleSide,
          envMapIntensity: materialConfig.envMapIntensity,
          transparent: true,
          opacity: opacity,
        });

        mesh.material = material;
      }
    });
  }, [preset, opacity]);

  if (!clonedScene.current) return null;

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <primitive object={clonedScene.current} />
        <FitCameraToObject object={clonedScene.current} />
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

interface SceneProps {
  activeIndex: number;
}

function Scene({ activeIndex }: SceneProps) {
  const model = HERO_MODELS[activeIndex];
  
  return (
    <>
      {/* Studio lighting: ambient (low), key, fill, rim, accent */}
      <ambientLight intensity={0.25} />
      {/* Key light - main sculpting, top-left */}
      <directionalLight position={[-4, 6, 4]} intensity={0.9} castShadow />
      {/* Fill light - opposite side, softer */}
      <directionalLight position={[4, 2, 3]} intensity={0.35} />
      {/* Rim light - separates model from background */}
      <directionalLight position={[0, 4, -6]} intensity={0.6} />
      {/* Accent light - subtle brand tint from below */}
      <pointLight position={[0, -2, 2]} intensity={0.25} color="#7fbfb7" />
      
      <Suspense fallback={<LoadingFallback />}>
        <Model 
          path={model.path} 
          preset={model.preset as keyof typeof MATERIAL_PRESETS} 
          opacity={1} 
        />
        <Environment preset="studio" />
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.4} 
          scale={10} 
          blur={2} 
        />
      </Suspense>
    </>
  );
}

export function Hero3DModel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Auto-advance every 7 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isTransitioning) {
        setIsTransitioning(true);
        setTimeout(() => {
          setActiveIndex((prev) => (prev + 1) % HERO_MODELS.length);
          setIsTransitioning(false);
        }, 300);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [isTransitioning]);

  const handleDotClick = (index: number) => {
    if (index === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + HERO_MODELS.length) % HERO_MODELS.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % HERO_MODELS.length);
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="relative w-full">
      {/* Left arrow */}
      <button
        onClick={handlePrev}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10
          w-10 h-10 rounded-full
          bg-accent/20 hover:bg-accent/40
          text-accent-foreground
          backdrop-blur-sm
          transition-all duration-200
          hover:scale-110
          flex items-center justify-center"
        aria-label="Previous model"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Right arrow */}
      <button
        onClick={handleNext}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10
          w-10 h-10 rounded-full
          bg-accent/20 hover:bg-accent/40
          text-accent-foreground
          backdrop-blur-sm
          transition-all duration-200
          hover:scale-110
          flex items-center justify-center"
        aria-label="Next model"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* 3D Canvas */}
      <div 
        className={`w-full h-[400px] md:h-[500px] lg:h-[560px] transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
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
          <Scene activeIndex={activeIndex} />
        </Canvas>
      </div>

      {/* Navigation dots */}
      <div className="flex items-center justify-center gap-2 mt-4">
        {HERO_MODELS.map((_, index) => (
          <button
            key={index}
            onClick={() => handleDotClick(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === activeIndex 
                ? 'bg-accent w-6' 
                : 'bg-accent/30 hover:bg-accent/50'
            }`}
            aria-label={`View model ${index + 1}`}
          />
        ))}
      </div>

      {/* Subtle caption */}
      <p 
        className={`text-center text-xs text-muted-foreground mt-2 transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {HERO_MODELS[activeIndex].caption}
      </p>
    </div>
  );
}

// Preload all models
HERO_MODELS.forEach(model => {
  useGLTF.preload(model.path);
});
