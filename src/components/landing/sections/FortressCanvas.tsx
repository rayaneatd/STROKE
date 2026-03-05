import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Environment, ContactShadows, MeshTransmissionMaterial, Text } from '@react-three/drei';
import * as THREE from 'three';

const NeonShield = () => {
    const shieldRef = useRef<THREE.Group>(null);
    const pulseRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (shieldRef.current) {
            shieldRef.current.rotation.y = state.clock.elapsedTime * 0.5;
            shieldRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
        }
        if (pulseRef.current) {
            pulseRef.current.scale.setScalar(2 + Math.sin(state.clock.elapsedTime * 4) * 0.05);
            (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 0.15 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
        }
    });

    return (
        <group ref={shieldRef}>
            {/* Hexagonal Shield Core */}
            <mesh scale={2.2} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[1, 1, 0.4, 6]} />
                <MeshTransmissionMaterial
                    backside
                    samples={8}
                    thickness={0.5}
                    chromaticAberration={0.1}
                    anisotropy={0.3}
                    distortion={0.3}
                    distortionScale={0.3}
                    temporalDistortion={0.1}
                    clearcoat={1}
                    color="#60a5fa"
                    opacity={0.6}
                />
                <lineSegments>
                    <edgesGeometry attach="geometry" args={[new THREE.CylinderGeometry(1, 1, 0.4, 6)]} />
                    <lineBasicMaterial attach="material" color="#60a5fa" transparent opacity={0.8} />
                </lineSegments>
            </mesh>

            {/* Glowing Pulse Ring */}
            <mesh ref={pulseRef} scale={2} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[1, 0.02, 16, 100]} />
                <meshBasicMaterial color="#3b82f6" transparent opacity={0.2} />
            </mesh>

            {/* RGPD Text inside the shield */}
            <Text
                position={[0, 0, 0.5]}
                fontSize={0.6}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjQ.ttf"
            >
                RGPD
            </Text>
        </group>
    );
};

const DataParticles = () => {
    const particlesRef = useRef<THREE.Points>(null);
    const count = 200;

    const [positions, speeds] = useMemo(() => {
        const pos = new Float32Array(count * 3);
        const spd = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 15;
            pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 2] = -5 - Math.random() * 5;
            spd[i] = Math.random() * 0.05 + 0.02;
        }
        return [pos, spd];
    }, []);

    useFrame((state) => {
        if (!particlesRef.current) return;
        const positionsArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < count; i++) {
            positionsArr[i * 3 + 2] += speeds[i];
            if (positionsArr[i * 3 + 2] > 5) {
                positionsArr[i * 3 + 2] = -10;
            }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef}>
            <bufferGeometry>
                <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
            </bufferGeometry>
            <pointsMaterial color="#60a5fa" size={0.05} transparent opacity={0.5} />
        </points>
    );
};

const FortressCanvas = () => {
    return (
        <div className="w-full h-full min-h-[500px] relative">
            <Canvas camera={{ position: [0, 0, 10], fov: 40 }}>
                <React.Suspense fallback={null}>
                    <ambientLight intensity={0.4} />
                    <spotLight position={[5, 10, 10]} angle={0.2} penumbra={1} intensity={2} color="#3b82f6" />
                    <pointLight position={[-10, -5, -10]} intensity={1} color="#60a5fa" />

                    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                        <NeonShield />
                    </Float>

                    <DataParticles />

                    <Text
                        position={[0, -3.5, 0]}
                        fontSize={0.3}
                        color="#60a5fa"
                        anchorX="center"
                        anchorY="middle"
                        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjQ.ttf"
                    >
                        LOCKDOWN PROTOCOL ACTIVE
                    </Text>

                    <ContactShadows position={[0, -4, 0]} opacity={0.4} scale={15} blur={3} far={4} />
                    <Environment preset="city" />
                    <OrbitControls
                        enableZoom={false}
                        enablePan={false}
                        minAzimuthAngle={-Math.PI / 6}
                        maxAzimuthAngle={Math.PI / 6}
                        minPolarAngle={Math.PI / 2.5}
                        maxPolarAngle={Math.PI / 1.5}
                    />
                </React.Suspense>
            </Canvas>
        </div>
    );
};

export default FortressCanvas;
