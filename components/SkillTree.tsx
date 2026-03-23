import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text, Platform } from 'react-native';
import Svg, { Circle, Line, G, Text as SvgText, Defs, RadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TREE_SIZE = Math.min(SCREEN_WIDTH - 80, 380);
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

        // Orbit 1: Acquired Skills — spread wide
        const orbit1Radius = 80;
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
            const orbit2Radius = 150;
            uniquePlanned.forEach((skill, i) => {
                const angle = (i / (uniquePlanned.length || 1)) * 2 * Math.PI + 0.6;
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
                <Svg width="100%" height="100%" viewBox={`0 0 ${TREE_SIZE} ${TREE_SIZE}`}>
                    <Defs>
                        <RadialGradient id="glow" cx="50%" cy="50%" rx="50%" ry="50%">
                            <Stop offset="0%" stopColor="#FFD700" stopOpacity="0.4" />
                            <Stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
                        </RadialGradient>
                    </Defs>

                    {/* Orbits */}
                    <Circle cx={CENTER} cy={CENTER} r={80} stroke="#333" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                    {!acquiredOnly && (
                        <Circle cx={CENTER} cy={CENTER} r={150} stroke="#222" strokeWidth="1" fill="none" strokeDasharray="3,3" />
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
                            strokeWidth={selectedNodeId === edge.targetId ? 3 : (edge.status === 'acquired' ? 2 : 1)}
                            opacity={selectedNodeId === edge.targetId ? 1 : (edge.status === 'acquired' ? 0.6 : 0.3)}
                        />
                    ))}

                    {/* Nodes */}
                    {nodes.map((node) => (
                        <G key={node.id}>
                            {node.status === 'acquired' && (
                                <Circle cx={node.x} cy={node.y} r={18} fill="url(#glow)" />
                            )}
                            <Circle
                                cx={node.x}
                                cy={node.y}
                                r={node.id === 'center' ? 12 : (selectedNodeId === node.id ? 10 : 8)}
                                fill={node.status === 'acquired' ? '#FFD700' : '#333'}
                                stroke={selectedNodeId === node.id ? 'white' : (node.status === 'acquired' ? 'white' : '#666')}
                                strokeWidth={selectedNodeId === node.id ? 2.5 : (node.status === 'acquired' ? 1.5 : 0.5)}
                                onPress={() => setSelectedNodeId(node.id === selectedNodeId ? null : node.id)}
                            />
                            <SvgText
                                x={node.x}
                                y={node.y + 22}
                                fill={selectedNodeId === node.id ? 'white' : (node.status === 'acquired' ? 'white' : '#888')}
                                fontSize={node.id === 'center' ? 14 : 13}
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
        width: '100%',
        aspectRatio: 1,
    },
    svgWrapper: {
        width: '100%',
        aspectRatio: 1,
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
        fontSize: 14,
        fontWeight: '900',
    },
    tooltipStatus: {
        color: '#666',
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
});
