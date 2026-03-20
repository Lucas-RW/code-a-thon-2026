import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const TREE_SIZE = 300;
const CENTER = TREE_SIZE / 2;

interface SkillTreeProps {
    acquiredSkills?: string[];
    plannedSkills?: string[];
    acquiredOnly?: boolean;
}

export default function SkillTree({ 
    acquiredSkills = [], 
    plannedSkills = [], 
    acquiredOnly = false 
}: SkillTreeProps) {
    const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);
    
    const nodes = useMemo(() => {
        // Strict Deduplication
        const uniqueAcquired = Array.from(new Set(acquiredSkills));
        const uniquePlanned = Array.from(new Set(plannedSkills))
            .filter(skill => !uniqueAcquired.includes(skill));

        const result: { id: string; label: string; status: 'acquired' | 'planned'; x: number; y: number }[] = [];
        
        // Center node
        result.push({ id: 'center', label: 'ME', status: 'acquired', x: CENTER, y: CENTER });

        // Orbit 1: Acquired Skills
        const orbit1Radius = 50;
        uniqueAcquired.forEach((skill, i) => {
            const angle = (i / (uniqueAcquired.length || 1)) * 2 * Math.PI;
            result.push({
                id: `a-${i}`,
                label: skill,
                status: 'acquired',
                x: CENTER + orbit1Radius * Math.cos(angle),
                y: CENTER + orbit1Radius * Math.sin(angle),
            });
        });

        // Orbit 2: Planned Skills (Only if not acquiredOnly)
        if (!acquiredOnly && uniquePlanned.length > 0) {
            const orbit2Radius = 100;
            uniquePlanned.forEach((skill, i) => {
                const angle = (i / (uniquePlanned.length || 1)) * 2 * Math.PI + 0.6; // Shift for variety
                result.push({
                    id: `p-${i}`,
                    label: skill,
                    status: 'planned',
                    x: CENTER + orbit2Radius * Math.cos(angle),
                    y: CENTER + orbit2Radius * Math.sin(angle),
                });
            });
        }

        return result;
    }, [acquiredSkills, plannedSkills, acquiredOnly]);

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    const edges = useMemo(() => {
        const result: { x1: number; y1: number; x2: number; y2: number; status: 'acquired' | 'planned'; targetId: string }[] = [];
        const center = nodes.find(n => n.id === 'center')!;

        nodes.forEach(node => {
            if (node.id === 'center') return;
            result.push({
                x1: center.x,
                y1: center.y,
                x2: node.x,
                y2: node.y,
                status: node.status,
                targetId: node.id
            });
        });
        return result;
    }, [nodes]);

    return (
        <View style={styles.container}>
            <View style={styles.svgWrapper}>
                <Svg width={TREE_SIZE} height={TREE_SIZE} viewBox={`0 0 ${TREE_SIZE} ${TREE_SIZE}`}>
                    <Defs>
                        <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
                            <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
                            <Stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>

                    {/* Orbits */}
                    <Circle cx={CENTER} cy={CENTER} r={50} stroke="#333" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                    {!acquiredOnly && (
                        <Circle cx={CENTER} cy={CENTER} r={100} stroke="#222" strokeWidth="1" fill="none" strokeDasharray="3,3" />
                    )}

                    {/* Edges */}
                    {edges.map((edge, i) => (
                        <Line
                            key={i}
                            x1={edge.x1}
                            y1={edge.y1}
                            x2={edge.x2}
                            y2={edge.y2}
                            stroke={edge.status === 'acquired' ? '#FFD700' : '#444'}
                            strokeWidth={selectedNodeId === edge.targetId ? 2 : (edge.status === 'acquired' ? 1.5 : 1)}
                            opacity={selectedNodeId === edge.targetId ? 1 : (edge.status === 'acquired' ? 0.6 : 0.3)}
                        />
                    ))}

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <G key={node.id}>
                            {node.status === 'acquired' && (
                                <Circle cx={node.x} cy={node.y} r={12} fill="url(#glow)" />
                            )}
                            <Circle
                                cx={node.x}
                                cy={node.y}
                                r={node.id === 'center' ? 6 : (selectedNodeId === node.id ? 7 : 4)}
                                fill={node.status === 'acquired' ? '#FFD700' : '#333'}
                                stroke={selectedNodeId === node.id ? 'white' : (node.status === 'acquired' ? 'white' : '#666')}
                                strokeWidth={selectedNodeId === node.id ? 2 : (node.status === 'acquired' ? 1 : 0.5)}
                                onPress={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                            />
                            <SvgText
                                x={node.x}
                                y={node.y + 16}
                                fill={selectedNodeId === node.id ? 'white' : (node.status === 'acquired' ? 'white' : '#888')}
                                fontSize={node.id === 'center' ? 10 : 9}
                                fontWeight={node.status === 'acquired' ? 'bold' : 'normal'}
                                textAnchor="middle"
                                pointerEvents="none"
                            >
                                {node.label}
                            </SvgText>
                        </G>
                    ))}
                </Svg>
            </View>

            {selectedNode && selectedNode.id !== 'center' && (
                <View style={styles.tooltip}>
                    <Text style={styles.tooltipTitle}>{selectedNode.label}</Text>
                    <Text style={styles.tooltipStatus}>
                        {selectedNode.status === 'acquired' ? 'MASTERED' : 'FUTURE GOAL'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        width: TREE_SIZE,
        height: TREE_SIZE + 40, // Extra for tooltip
    },
    svgWrapper: {
        width: TREE_SIZE,
        height: TREE_SIZE,
    },
    tooltip: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginTop: -10,
        alignItems: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
            },
            default: {
                shadowColor: '#FFD700',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.5,
                shadowRadius: 10,
                elevation: 10,
            }
        }),
    },
    tooltipTitle: {
        color: '#050505',
        fontSize: 12,
        fontWeight: '900',
    },
    tooltipStatus: {
        color: '#666',
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
});
