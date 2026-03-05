import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Float, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

// Represents the "Red Flags" extracted from the CV
const JsonNode = ({ position, text, isRedFlag = false, delay = 0, mouseRef }: { position: [number, number, number], text: string, isRedFlag?: boolean, delay?: number, mouseRef: React.MutableRefObject<THREE.Vector3> }) => {
    const groupRef = useRef<THREE.Group>(null);
    const color = isRedFlag ? '#ef4444' : '#a855f7';

    // Original target position
    const targetPos = useMemo(() => new THREE.Vector3(...position), [position]);

    useFrame((state) => {
        if (!groupRef.current) return;

        // Appear animation
        const scale = Math.min(1, Math.max(0, (state.clock.elapsedTime - delay) * 2));
        groupRef.current.scale.setScalar(scale);

        // Repel from mouse/lens slightly
        const dist = targetPos.distanceTo(mouseRef.current);
        const repelForce = Math.max(0, 2 - dist) * 0.5;

        if (repelForce > 0) {
            const dir = targetPos.clone().sub(mouseRef.current).normalize();
            groupRef.current.position.lerp(targetPos.clone().add(dir.multiplyScalar(repelForce)), 0.1);
        } else {
            groupRef.current.position.lerp(targetPos, 0.05); // Return home
        }

        // Gentle float
        groupRef.current.position.y += Math.sin(state.clock.elapsedTime * 2 + delay) * 0.005;
    });

    return (
        <group ref={groupRef} position={position}>
            {/* Outline box */}
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[3, 0.6, 0.1]} />
                <meshPhysicalMaterial
                    color={color}
                    transparent
                    opacity={0.15}
                    roughness={0.1}
                    transmission={0.9}
                    ior={1.5}
                />
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(3, 0.6, 0.1)]} />
                    <lineBasicMaterial attach="material" color={color} transparent opacity={0.8} />
                </lineSegments>
            </mesh>
            {/* Text */}
            <Text
                position={[0, 0, 0.06]}
                fontSize={0.2}
                color={isRedFlag ? '#fca5a5' : '#e2e8f0'}
                font="https://fonts.gstatic.com/s/firamono/v14/N0bX2SlFPv1weGeLZDtgJv7S.woff"
                anchorX="center"
                anchorY="middle"
            >
                {text}
            </Text>
        </group>
    );
};

// The interactive magnifying glass
const MagLens = ({ mouseRef }: { mouseRef: React.MutableRefObject<THREE.Vector3> }) => {
    const { viewport } = useThree();
    const lensRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!lensRef.current) return;

        // Follow mouse
        const x = (state.pointer.x * viewport.width) / 2;
        const y = (state.pointer.y * viewport.height) / 2;

        // Update ref for nodes to read
        mouseRef.current.set(x, y, 1);

        // Smooth follow
        lensRef.current.position.lerp(new THREE.Vector3(x, y, 1), 0.1);

        // Slight tilt based on velocity/position
        lensRef.current.rotation.x = -y * 0.1;
        lensRef.current.rotation.y = x * 0.1;
    });

    return (
        <group ref={lensRef}>
            {/* Inner Lens */}
            <mesh>
                <cylinderGeometry args={[1.5, 1.5, 0.1, 32]} />
                <meshPhysicalMaterial
                    color="#ffffff"
                    transmission={0.95}
                    opacity={1}
                    roughness={0}
                    ior={1.8}
                    thickness={0.5}
                />
            </mesh>
            {/* Neon Ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1.5, 0.05, 16, 64]} />
                <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={2} />
            </mesh>
        </group>
    );
};

const TruthScene = () => {
    const mouseRef = useRef(new THREE.Vector3(0, 0, 0));

    // Predefined JSON extraction nodes
    const nodes = [
        { text: '"role": "VP of Sales"', pos: [-2, 2, 0] as [number, number, number], red: false, d: 0 },
        { text: '"duration_months": 11', pos: [2.5, 1.5, 0.5] as [number, number, number], red: true, d: 0.2 },
        { text: '"skills": ["SaaS", "B2B"]', pos: [1.5, -0.5, -0.5] as [number, number, number], red: false, d: 0.4 },
        { text: '"gap_reason": "UNEXPLAINED"', pos: [-1.5, -1.5, 1] as [number, number, number], red: true, d: 0.6 },
        { text: '"velocity_score": 0.42', pos: [0, -2.5, 0] as [number, number, number], red: false, d: 0.8 },
    ];

    return (
        <group>
            {/* The Lens */}
            <MagLens mouseRef={mouseRef} />

            {/* The Extracted Data */}
            <group position={[0, 0, 0.5]}>
                {nodes.map((n, i) => (
                    <Float key={i} speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
                        <JsonNode position={n.pos} text={n.text} isRedFlag={n.red} delay={n.d} mouseRef={mouseRef} />
                    </Float>
                ))}
            </group>
        </group>
    );
};

const TruthLensCanvas = () => {
    return (
        <div className="w-full h-[600px] relative z-20 cursor-none"> {/* cursor-none to use the 3D lens as cursor */}
            <Canvas camera={{ position: [0, 0, 8], fov: 40 }}>
                <React.Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} intensity={1} penumbra={1} color="#3b82f6" />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ef4444" />

                    <TruthScene />
                    <Environment preset="city" />
                </React.Suspense>
            </Canvas>
        </div>
    );
};

export default TruthLensCanvas;
