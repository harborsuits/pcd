"use client"

import { useRef, useMemo } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import * as THREE from "three"

const vertexShader = `
  uniform float time;
  uniform float intensity;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec3 pos = position;
    pos.y += sin(pos.x * 10.0 + time) * 0.02 * intensity;
    pos.x += cos(pos.y * 8.0 + time * 1.5) * 0.01 * intensity;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const fragmentShader = `
  uniform float time;
  uniform float intensity;
  uniform vec3 color1;
  uniform vec3 color2;
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vec2 uv = vUv;
    
    // Create animated noise pattern
    float noise = sin(uv.x * 15.0 + time * 0.5) * cos(uv.y * 12.0 + time * 0.3);
    noise += sin(uv.x * 25.0 - time * 0.8) * cos(uv.y * 18.0 + time * 0.4) * 0.5;
    
    // Mix colors based on noise and position
    vec3 color = mix(color1, color2, noise * 0.3 + 0.5 + uv.y * 0.3);
    
    // Subtle glow effect
    float glow = 1.0 - length(uv - 0.5) * 0.5;
    
    gl_FragColor = vec4(color * glow, 1.0);
  }
`

function ShaderPlane({
  color1 = "#f43f5e",
  color2 = "#881337",
}: {
  color1?: string
  color2?: string
}) {
  const mesh = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      intensity: { value: 1.0 },
      color1: { value: new THREE.Color(color1) },
      color2: { value: new THREE.Color(color2) },
    }),
    [color1, color2],
  )

  useFrame((state) => {
    if (mesh.current) {
      uniforms.time.value = state.clock.elapsedTime
      uniforms.intensity.value = 1.0 + Math.sin(state.clock.elapsedTime * 2) * 0.3
    }
  })

  return (
    <mesh ref={mesh} position={[0, 0, 0]}>
      <planeGeometry args={[4, 4, 32, 32]} />
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

interface BackgroundPaperShadersProps {
  color1?: string
  color2?: string
  className?: string
}

export function BackgroundPaperShaders({ 
  color1 = "#f43f5e", 
  color2 = "#881337",
  className = ""
}: BackgroundPaperShadersProps) {
  return (
    <div className={`absolute inset-0 ${className}`}>
      <Canvas camera={{ position: [0, 0, 1], fov: 75 }}>
        <ShaderPlane color1={color1} color2={color2} />
      </Canvas>
    </div>
  )
}
