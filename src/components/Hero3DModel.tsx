import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF, Environment, Float, ContactShadows, OrbitControls } from "@react-three/drei";
import { ChevronLeft, ChevronRight } from "lucide-react";
import * as THREE from "three";

const AUTO_ADVANCE_MS = 10000; // 10 seconds between auto-transitions

// Material presets - procedural materials for texture-less models
const MATERIAL_PRESETS = {
  tealFrosted: {
    color: '#4FA3A8',
    metalness: 0.4,
    roughness: 0.55,
    envMapIntensity: 1.0,
  },
  blueWhite: {
    color: '#3A6B99',
    metalness: 0.35,
    roughness: 0.35,
    envMapIntensity: 1.2,
  },
  brushedGold: {
    color: '#E6C76A',
    metalness: 0.85,
    roughness: 0.35,
    envMapIntensity: 1.4,
  },
  polishedSilver: {
    color: '#C0C8D0',
    metalness: 0.95,
    roughness: 0.2,
    envMapIntensity: 1.6,
  },
};

// Hero model configurations
const HERO_MODELS = [
  {
    path: '/models/hero-model-silver.glb',
    preset: 'polishedSilver',
    caption: 'Client portals & workflows',
  },
  {
    path: '/models/hero-model-2.glb',
    preset: 'blueWhite',
    caption: 'Booking & intake systems',
  },
  {
    path: '/models/hero-model-3.glb',
    preset: 'brushedGold',
    caption: 'AI assistants & automation',
  },
];

function FitCameraToObject({ object, onReady }: { object: THREE.Object3D; onReady?: () => void }) {
  const { camera } = useThree();
  const hasFramed = useRef(false);

  useEffect(() => {
    if (!object || hasFramed.current) return;

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
    
    hasFramed.current = true;
    
    // Signal that framing is complete
    requestAnimationFrame(() => {
      onReady?.();
    });
  }, [object, camera, onReady]);

  return null;
}

interface ModelProps {
  path: string;
  preset: keyof typeof MATERIAL_PRESETS;
  opacity: number;
  onCameraReady?: () => void;
}

function Model({ path, preset, opacity, onCameraReady }: ModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(path);
  const [clonedScene, setClonedScene] = useState<THREE.Group | null>(null);

  // Clone the scene to avoid shared state between models
  useEffect(() => {
    setClonedScene(scene.clone(true));
  }, [scene]);

  // Apply material preset
  useEffect(() => {
    if (!clonedScene) return;
    
    const materialConfig = MATERIAL_PRESETS[preset];
    
    clonedScene.traverse((obj: THREE.Object3D) => {
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
  }, [clonedScene, preset, opacity]);

  if (!clonedScene) return null;

  return (
    <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        <primitive object={clonedScene} />
        <FitCameraToObject object={clonedScene} onReady={onCameraReady} />
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
  controlsRef: React.RefObject<any>;
  onInteractionStart: () => void;
  onInteractionEnd: () => void;
  onModelReady: () => void;
}

function Scene({ activeIndex, controlsRef, onInteractionStart, onInteractionEnd, onModelReady }: SceneProps) {
  const model = HERO_MODELS[activeIndex];
  const { camera } = useThree();
  
  // Reset camera and OrbitControls when slide changes
  useEffect(() => {
    // Reset camera to default position first
    camera.position.set(0, 1, 8);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [activeIndex, controlsRef, camera]);
  
  return (
    <>
      {/* Refined studio lighting */}
      {/* Very low ambient - prevents crushed shadows */}
      <ambientLight intensity={0.12} />
      {/* Strong key light - main sculpting, top-left */}
      <directionalLight 
        position={[-4, 6, 4]} 
        intensity={1.2} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      {/* Weak fill - opposite side */}
      <directionalLight position={[4, 2, 3]} intensity={0.2} />
      {/* Strong rim light - outlines silhouette */}
      <directionalLight position={[0, 4, -6]} intensity={0.8} />
      {/* Accent light - subtle brand tint from below */}
      <pointLight position={[0, -2, 2]} intensity={0.15} color="#7fbfb7" />
      
      {/* OrbitControls for drag-to-rotate */}
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.8}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.5}
        onStart={onInteractionStart}
        onEnd={onInteractionEnd}
      />
      
      <Suspense fallback={<LoadingFallback />}>
        {/* Key forces remount when activeIndex changes, ensuring fresh camera fit */}
        <Model 
          key={activeIndex}
          path={model.path} 
          preset={model.preset as keyof typeof MATERIAL_PRESETS} 
          opacity={1}
          onCameraReady={onModelReady}
        />
        {/* HDRI environment for realistic reflections - warehouse for gold contrast */}
        <Environment preset="warehouse" background={false} />
        {/* Stronger contact shadows to ground the model */}
        <ContactShadows 
          position={[0, -1.5, 0]} 
          opacity={0.65} 
          scale={8} 
          blur={1.5}
          far={4}
        />
      </Suspense>
    </>
  );
}

export function Hero3DModel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [isModelReady, setIsModelReady] = useState(true);
  const controlsRef = useRef<any>(null);

  const handleInteractionStart = useCallback(() => {
    setIsInteracting(true);
  }, []);

  const handleInteractionEnd = useCallback(() => {
    setIsInteracting(false);
  }, []);

  const handleModelReady = useCallback(() => {
    // Small delay to ensure camera has fully positioned
    setTimeout(() => {
      setIsModelReady(true);
    }, 50);
  }, []);

  // Auto-advance every 10 seconds - pauses while user is interacting
  useEffect(() => {
    if (isInteracting) return; // Don't auto-advance while dragging

    const interval = setInterval(() => {
      if (!isTransitioning && isModelReady) {
        setIsTransitioning(true);
        setIsModelReady(false);
        setTimeout(() => {
          setActiveIndex((prev) => (prev + 1) % HERO_MODELS.length);
          setIsTransitioning(false);
        }, 300);
      }
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(interval);
  }, [isTransitioning, isInteracting, isModelReady]);

  const handleDotClick = (index: number) => {
    if (index === activeIndex || isTransitioning) return;
    setIsTransitioning(true);
    setIsModelReady(false);
    setTimeout(() => {
      setActiveIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsModelReady(false);
    setTimeout(() => {
      setActiveIndex((prev) => (prev - 1 + HERO_MODELS.length) % HERO_MODELS.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setIsModelReady(false);
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
          isTransitioning || !isModelReady ? 'opacity-0' : 'opacity-100'
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
          <Scene 
            activeIndex={activeIndex} 
            controlsRef={controlsRef}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
            onModelReady={handleModelReady}
          />
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
