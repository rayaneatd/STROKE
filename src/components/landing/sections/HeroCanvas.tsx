import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, PerspectiveCamera, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

const GlassShard = ({ position, rotation, scale, color }: { position: [number, number, number], rotation: [number, number, number], scale: number, color: string }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        meshRef.current.position.y += Math.sin(state.clock.elapsedTime + position[0]) * 0.002;
        meshRef.current.rotation.x += 0.002;
        meshRef.current.rotation.z += 0.001;
    });

    return (
        <Float speed={1.5} rotationIntensity={0.5} floatIntensity={0.5}>
            <mesh ref={meshRef} position={position} rotation={rotation} scale={scale}>
                <boxGeometry args={[1, 1, 0.05]} />
                <MeshTransmissionMaterial
                    backside
                    samples={4}
                    thickness={0.2}
                    chromaticAberration={0.05}
                    anisotropy={0.1}
                    distortion={0.1}
                    distortionScale={0.1}
                    temporalDistortion={0.1}
                    clearcoat={1}
                    attenuationDistance={0.5}
                    attenuationColor={color}
                    color={color}
                    opacity={0.5}
                />
                {/* Neon Edge */}
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(1, 1, 0.05)]} />
                    <lineBasicMaterial attach="material" color={color} transparent opacity={0.8} />
                </lineSegments>
            </mesh>
        </Float>
    );
};

const NeonRing = ({ radius, color, speed, offset }: { radius: number, color: string, speed: number, offset: number }) => {
    const ringRef = useRef<THREE.Group>(null);
    useFrame((state) => {
        if (ringRef.current) {
            ringRef.current.rotation.z = state.clock.elapsedTime * speed + offset;
            ringRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
        }
    });

    return (
        <group ref={ringRef}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[radius, 0.01, 16, 100]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
};

const HeroScene = () => {
    const shards = useMemo(() => {
        return Array.from({ length: 12 }).map((_, i) => ({
            position: [
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 3
            ] as [number, number, number],
            rotation: [Math.random() * Math.PI, Math.random() * Math.PI, 0] as [number, number, number],
            scale: Math.random() * 1.5 + 0.5,
            color: i % 2 === 0 ? '#3b82f6' : '#6366f1'
        }));
    }, []);

    return (
        <group>
            {shards.map((shard, i) => (
                <GlassShard key={i} {...shard} />
            ))}

            <NeonRing radius={3} color="#3b82f6" speed={0.2} offset={0} />
            <NeonRing radius={3.2} color="#6366f1" speed={-0.15} offset={Math.PI} />

            {/* Central Prism */}
            <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                <mesh scale={1.2}>
                    <octahedronGeometry args={[1, 0]} />
                    <MeshTransmissionMaterial
                        backside
                        samples={8}
                        thickness={1}
                        chromaticAberration={0.1}
                        anisotropy={0.2}
                        distortion={0.2}
                        distortionScale={0.2}
                        temporalDistortion={0.1}
                        clearcoat={1}
                        color="#ffffff"
                    />
                    <lineSegments>
                        <edgesGeometry attach="geometry" args={[new THREE.OctahedronGeometry(1, 0)]} />
                        <lineBasicMaterial attach="material" color="#3b82f6" />
                    </lineSegments>
                </mesh>
            </Float>
        </group>
    );
};

const HeroCanvas = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden h-[120vh]">
            <Canvas dpr={[1, 2]}>
                <React.Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={2} color="#3b82f6" />
                    <pointLight position={[-10, -10, -10]} intensity={1} color="#6366f1" />
                    <HeroScene />
                    <Environment preset="city" />
                </React.Suspense>
            </Canvas>
            {/* Gradient Mask to transition to lower section */}
            <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-[#0e0e10] to-transparent z-10" />
        </div>
    );
};

export default HeroCanvas;
