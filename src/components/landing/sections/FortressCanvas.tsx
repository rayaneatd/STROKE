import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Environment, ContactShadows, Text } from '@react-three/drei';
import * as THREE from 'three';

const ParisBuilding = ({ position, scale, opacity = 0.5 }: { position: [number, number, number], scale: [number, number, number], opacity?: number }) => {
    return (
        <mesh position={position} castShadow receiveShadow>
            <boxGeometry args={scale} />
            <meshPhysicalMaterial
                color="#e2e8f0"
                transmission={opacity}
                opacity={1}
                roughness={0.2}
                metalness={0.8}
                ior={1.5}
                thickness={opacity === 1 ? 0 : 2}
            />
            {/* Edges for architectural feel */}
            <lineSegments>
                <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(...scale)]} />
                <lineBasicMaterial attach="material" color="#cbd5e1" transparent opacity={0.3} />
            </lineSegments>
        </mesh>
    );
};

const EiffelTowerGlass = () => {
    return (
        <group position={[0, 1.5, 0]}>
            {/* Base */}
            <mesh position={[0, -1.2, 0]}>
                <cylinderGeometry args={[0.8, 1.5, 0.8, 4]} />
                <meshPhysicalMaterial color="#94a3b8" transmission={0.9} ior={1.5} thickness={2} roughness={0.1} />
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.CylinderGeometry(0.8, 1.5, 0.8, 4)]} />
                    <lineBasicMaterial attach="material" color="#ffffff" opacity={0.5} transparent />
                </lineSegments>
            </mesh>
            {/* Mid */}
            <mesh position={[0, 0, 0]}>
                <cylinderGeometry args={[0.3, 0.7, 1.8, 4]} />
                <meshPhysicalMaterial color="#94a3b8" transmission={0.9} ior={1.5} thickness={2} roughness={0.1} />
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.CylinderGeometry(0.3, 0.7, 1.8, 4)]} />
                    <lineBasicMaterial attach="material" color="#ffffff" opacity={0.5} transparent />
                </lineSegments>
            </mesh>
            {/* Top */}
            <mesh position={[0, 1.5, 0]}>
                <cylinderGeometry args={[0, 0.25, 1.5, 4]} />
                <meshPhysicalMaterial color="#94a3b8" transmission={0.9} ior={1.5} thickness={2} roughness={0.1} />
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.CylinderGeometry(0, 0.25, 1.5, 4)]} />
                    <lineBasicMaterial attach="material" color="#ffffff" opacity={0.5} transparent />
                </lineSegments>
            </mesh>
        </group>
    );
};

const GDPRBarrier = () => {
    const shieldRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        if (shieldRef.current) {
            shieldRef.current.rotation.y = state.clock.elapsedTime * 0.2;
            (shieldRef.current.material as THREE.MeshPhysicalMaterial).opacity = 0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });

    return (
        <mesh ref={shieldRef} position={[0, 0.5, 0]}>
            <cylinderGeometry args={[4.5, 4.5, 6, 64, 1, true]} />
            <meshPhysicalMaterial
                color="#3b82f6"
                transparent
                opacity={0.3}
                side={THREE.DoubleSide}
                emissive="#3b82f6"
                emissiveIntensity={0.5}
                depthWrite={false}
            />
        </mesh>
    );
};

const DataStream = () => {
    const particlesRef = useRef<THREE.Points>(null);

    const count = 100;
    const [positions] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            // Start from outside the barrier (-8 to -5 x) moving towards center
            pos[i * 3] = -8 + Math.random() * 3;
            pos[i * 3 + 1] = Math.random() * 4;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 4;
        }
        return [pos];
    }, []);

    useFrame((state) => {
        if (!particlesRef.current) return;
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;

        for (let i = 0; i < count; i++) {
            // Move right towards Paris
            positions[i * 3] += 0.05;

            // If hits barrier (x > -4.5), quickly move inside and reset if too far
            if (positions[i * 3] > 4) {
                positions[i * 3] = -8 + Math.random();
            }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial color="#a855f7" size={0.1} sizeAttenuation transparent opacity={0.8} />
        </points>
    );
}

const SkylineScene = () => {
    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        // Gentle sway
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    });

    return (
        <group ref={groupRef} position={[2, -1, 0]}>
            <Float speed={1} floatIntensity={0.2} rotationIntensity={0.1}>
                {/* Central Focus */}
                <EiffelTowerGlass />

                {/* Abstract Data Center Buildings */}
                <ParisBuilding position={[2, 0, -2]} scale={[1.5, 3, 1.5]} />
                <ParisBuilding position={[-2, 0, 1]} scale={[2, 2.5, 1]} />
                <ParisBuilding position={[1, 0, 2]} scale={[1.2, 4, 1.2]} />
                <ParisBuilding position={[-1.5, 0, -1.5]} scale={[1, 5, 1]} opacity={0.8} />

                {/* Base Platform */}
                <mesh position={[0, -1.5, 0]}>
                    <cylinderGeometry args={[4, 4, 0.2, 32]} />
                    <meshStandardMaterial color="#1e293b" />
                </mesh>

                {/* GDPR Protection Ring */}
                <GDPRBarrier />

                {/* Incoming Data */}
                <DataStream />

                {/* Label inside the dome */}
                <Text
                    position={[0, 4, 0]}
                    fontSize={0.4}
                    color="#60a5fa"
                    anchorX="center"
                    anchorY="middle"
                    font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjQ.ttf"
                >
                    VERTEX AI europe-west9
                </Text>
            </Float>
        </group>
    );
};

const FortressCanvas = () => {
    return (
        <div className="w-full h-full min-h-[500px] relative">
            <Canvas camera={{ position: [0, 2, 12], fov: 45 }}>
                <ambientLight intensity={0.4} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
                <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />

                <SkylineScene />

                <ContactShadows position={[0, -2.5, 0]} opacity={0.5} scale={20} blur={2.5} far={4} />
                <Environment preset="city" />

                {/* Limit rotation so user doesn't get lost, but allow inspection */}
                <OrbitControls
                    enableZoom={false}
                    enablePan={false}
                    minAzimuthAngle={-Math.PI / 4}
                    maxAzimuthAngle={Math.PI / 4}
                    minPolarAngle={Math.PI / 3}
                    maxPolarAngle={Math.PI / 2}
                />
            </Canvas>
        </div>
    );
};

export default FortressCanvas;
