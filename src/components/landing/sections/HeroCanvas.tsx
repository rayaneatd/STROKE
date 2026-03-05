import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Environment, PerspectiveCamera, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const GraphNode = ({ position, color, scale = 1, delay = 0 }: { position: [number, number, number], color: string, scale?: number, delay?: number }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (!meshRef.current) return;
        const targetScale = Math.min(1, Math.max(0, (state.clock.elapsedTime - delay) * 2));
        meshRef.current.scale.setScalar(targetScale * scale);
        meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
    });

    return (
        <mesh ref={meshRef} position={position}>
            <boxGeometry args={[0.3, 0.3, 0.3]} />
            <meshPhysicalMaterial
                color={color}
                transmission={0.9}
                opacity={1}
                metalness={0.1}
                roughness={0.1}
                ior={1.5}
                thickness={0.5}
                emissive={color}
                emissiveIntensity={0.5}
            />
        </mesh>
    );
};

const ConnectionLine = ({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) => {
    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
    const lineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

    return (
        <line geometry={lineGeometry}>
            <lineBasicMaterial color={color} transparent opacity={0.3} />
        </line>
    );
};

const GraphScene = () => {
    const nodes = useMemo(() => {
        const temp = [];
        // Generate an "ascent" graph going upwards
        for (let i = 0; i < 15; i++) {
            temp.push({
                pos: [
                    (Math.random() - 0.5) * 4,
                    i * 0.4 - 2, // Ascending vertical
                    (Math.random() - 0.5) * 2
                ] as [number, number, number],
                color: i > 10 ? '#3b82f6' : '#a855f7', // Blue to Purple
                scale: Math.random() * 0.5 + 0.5,
                delay: i * 0.1
            });
        }
        return temp;
    }, []);

    const groupRef = useRef<THREE.Group>(null);

    useFrame((state) => {
        if (!groupRef.current) return;
        // Subtle floating / rotation based on mouse or time
        groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1 + state.pointer.x * 0.2;
        groupRef.current.rotation.x = Math.cos(state.clock.elapsedTime * 0.2) * 0.1 - state.pointer.y * 0.2;
    });

    return (
        <group ref={groupRef}>
            <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
                {nodes.map((node, i) => (
                    <React.Fragment key={i}>
                        <GraphNode position={node.pos} color={node.color} scale={node.scale} delay={node.delay} />
                        {i > 0 && <ConnectionLine start={nodes[i - 1].pos} end={node.pos} color={node.color} />}
                        {i > 2 && i % 3 === 0 && <ConnectionLine start={nodes[i - 3].pos} end={node.pos} color={node.color} />}
                    </React.Fragment>
                ))}
            </Float>
            {/* Flat base representing "Keywords" logic */}
            <mesh position={[0, -2.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[6, 6]} />
                <meshStandardMaterial color="#1e293b" transparent opacity={0.5} wireframe />
            </mesh>
        </group>
    );
};

const HeroCanvas = () => {
    return (
        <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen opacity-60 md:opacity-100">
            <Canvas dpr={[1, 2]}>
                <React.Suspense fallback={null}>
                    <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={35} />
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} intensity={1} color="#3b82f6" />
                    <pointLight position={[-10, -10, -10]} intensity={0.5} color="#a855f7" />
                    <GraphScene />
                    <ContactShadows position={[0, -3.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
                    <Environment preset="city" />
                </React.Suspense>
            </Canvas>
        </div>
    );
};

export default HeroCanvas;
