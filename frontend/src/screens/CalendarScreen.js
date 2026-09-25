import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchReminders, parseUTC } from '../api/client';

export default function CalendarScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        try {
            const data = await fetchReminders();
            const sorted = data.sort((a, b) => parseUTC(a.time).getTime() - parseUTC(b.time).getTime());
            setTasks(sorted);
        } catch (e) {
            console.error('Could not load calendar tasks', e);
        } finally {
            setLoading(false);
        }
    };

    const completedCount = tasks.filter(t => t.is_completed).length;
    const totalCount = tasks.length || 1;
    const progressPercent = Math.round((completedCount / totalCount) * 100);

    const getTaskIcon = (title) => {
        const lower = title.toLowerCase();
        if (lower.includes('walk') || lower.includes('exercise')) return { name: 'walk', color: '#10b981', bg: '#d1fae5' };
        if (lower.includes('medicine') || lower.includes('pill')) return { name: 'medkit', color: '#7c3aed', bg: '#ede9fe' };
        if (lower.includes('lunch') || lower.includes('meal') || lower.includes('food')) return { name: 'restaurant', color: '#f59e0b', bg: '#fef3c7' };
        if (lower.includes('call') || lower.includes('family')) return { name: 'call', color: '#ec4899', bg: '#fce7f3' };
        return { name: 'calendar', color: '#2563eb', bg: '#dbeafe' };
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Today's Plan & Tasks</Text>
                    <View style={{ width: 38 }} />
                </View>

                {/* Progress Card */}
                <View style={styles.progressCard}>
                    <View style={styles.progressTextRow}>
                        <View>
                            <Text style={styles.progressTitle}>Daily Activity Completion</Text>
                            <Text style={styles.progressSub}>{completedCount} of {tasks.length} tasks completed today</Text>
                        </View>
                        <Text style={styles.progressPercentText}>{progressPercent}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                    </View>
                </View>
            </LinearGradient>

            {/* Timeline Task List */}
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionHeading}>📅 Timeline Schedule</Text>

                {tasks.map((item, index) => {
                    const iconInfo = getTaskIcon(item.title);
                    const timeFormatted = parseUTC(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return (
                        <View key={item.id} style={styles.timelineRow}>
                            {/* Left Time Column */}
                            <View style={styles.timeColumn}>
                                <Text style={styles.timeText}>{timeFormatted}</Text>
                                <Ionicons name="time-outline" size={14} color="#64748b" style={{ marginTop: 2 }} />
                            </View>

                            {/* Center Line & Node */}
                            <View style={styles.lineColumn}>
                                <View style={[styles.dotNode, item.is_completed && styles.dotCompleted]}>
                                    <Ionicons 
                                        name={item.is_completed ? "checkmark" : "ellipse"} 
                                        size={10} 
                                        color={item.is_completed ? "white" : "#cbd5e1"} 
                                    />
                                </View>
                                {index !== tasks.length - 1 && <View style={styles.connectingLine} />}
                            </View>

                            {/* Right Task Card */}
                            <View style={[styles.taskCard, item.is_completed && styles.taskCardCompleted]}>
                                <View style={[styles.iconCircle, { backgroundColor: iconInfo.bg }]}>
                                    <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
                                </View>

                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={[styles.taskTitle, item.is_completed && styles.taskTitleCompleted]}>
                                        {item.title}
                                    </Text>
                                    <View style={styles.badgeRow}>
                                        {item.is_completed ? (
                                            <View style={styles.completedBadge}>
                                                <Ionicons name="checkmark-circle" size={12} color="#059669" />
                                                <Text style={styles.completedBadgeText}>Completed</Text>
                                            </View>
                                        ) : (
                                            <View style={styles.pendingBadge}>
                                                <Ionicons name="time" size={12} color="#d97706" />
                                                <Text style={styles.pendingBadgeText}>Upcoming</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {tasks.length === 0 && !loading && (
                    <View style={styles.emptyStateContainer}>
                        <View style={styles.emptyIconCircle}>
                            <Ionicons name="sparkles-outline" size={48} color="#7c3aed" />
                        </View>
                        <Text style={styles.emptyTitle}>No Activities Scheduled</Text>
                        <Text style={styles.emptySub}>All tasks for today are clear. Enjoy your peaceful day!</Text>
                    </View>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingTop: 55,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.2)'
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20
    },
    backBtn: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: 'white'
    },
    progressCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    progressTextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
    },
    progressTitle: {
        color: 'white',
        fontSize: 13,
        fontWeight: 'bold'
    },
    progressSub: {
        color: '#cbd5e1',
        fontSize: 11,
        marginTop: 2
    },
    progressPercentText: {
        color: '#34d399',
        fontSize: 16,
        fontWeight: '800'
    },
    progressBarTrack: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 3,
        overflow: 'hidden'
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#10b981',
        borderRadius: 3
    },

    content: {
        padding: 16,
        paddingBottom: 110
    },
    sectionHeading: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 14
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 12
    },
    timeColumn: {
        width: 60,
        alignItems: 'flex-start',
        paddingTop: 10
    },
    timeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#334155'
    },
    lineColumn: {
        width: 24,
        alignItems: 'center',
        position: 'relative',
        alignSelf: 'stretch'
    },
    dotNode: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#cbd5e1',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        zIndex: 10
    },
    dotCompleted: {
        backgroundColor: '#10b981'
    },
    connectingLine: {
        position: 'absolute',
        top: 24,
        bottom: -16,
        width: 2,
        backgroundColor: '#e2e8f0',
        zIndex: 1
    },
    taskCard: {
        flex: 1,
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 12,
        marginLeft: 8,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        boxShadow: '0 4px 12px rgba(15, 23, 42, 0.05)'
    },
    taskCardCompleted: {
        backgroundColor: '#f8fafc',
        opacity: 0.85
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    taskTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a'
    },
    taskTitleCompleted: {
        textDecorationLine: 'line-through',
        color: '#64748b'
    },
    badgeRow: {
        flexDirection: 'row',
        marginTop: 4
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#d1fae5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8
    },
    completedBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#059669'
    },
    pendingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#fef3c7',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8
    },
    pendingBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#d97706'
    },

    emptyStateContainer: {
        alignItems: 'center',
        paddingVertical: 30,
        paddingHorizontal: 16
    },
    emptyIconCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#f3e8ff',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#0f172a'
    },
    emptySub: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 4
    }
});
