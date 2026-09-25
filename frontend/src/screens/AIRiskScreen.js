import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { predictRisk } from '../api/client';

export default function AIRiskScreen({ route, navigation }) {
    const patientId = route?.params?.patientId || 1;
    const [loading, setLoading] = useState(true);
    const [riskData, setRiskData] = useState(null);

    useEffect(() => {
        loadAIInference();
    }, []);

    const loadAIInference = async () => {
        try {
            const data = await predictRisk(patientId);
            setRiskData(data);
        } catch (e) {
            console.error("AI Error:", e);
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score < 40) return '#10b981'; // Green
        if (score < 70) return '#f59e0b'; // Amber
        return '#ef4444'; // Coral Red
    };

    if (loading) {
        return (
            <LinearGradient colors={['#0f172a', '#1e1b4b']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#a78bfa" />
                <Text style={{ color: 'white', marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>
                    Running Scikit-Learn Inference Model...
                </Text>
            </LinearGradient>
        );
    }

    const scoreColor = getScoreColor(riskData?.score || 0);

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.header}>
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={22} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Clinical AI Risk Evaluation</Text>
                    <View style={{ width: 38 }} />
                </View>

                <View style={styles.disclaimerPill}>
                    <Ionicons name="information-circle" size={16} color="#38bdf8" />
                    <Text style={styles.disclaimerText}>AI Decision-Support System • Clinical Reference Only</Text>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.cardMainTitle}>Cognitive & Behavioral Risk Score</Text>
                    <Text style={styles.cardSubTitle}>Scikit-Learn Random Forest Classifier</Text>

                    {/* Gauge Circle Ring */}
                    <View style={styles.gaugeContainer}>
                        <View style={[styles.gaugeCircle, { borderColor: scoreColor }]}>
                            <Text style={[styles.scoreText, { color: scoreColor }]}>
                                {riskData?.score || 0}%
                            </Text>
                            <Text style={styles.scoreLabel}>RISK SCORE</Text>
                        </View>
                    </View>

                    {/* Status Badge */}
                    <View style={[styles.statusBadge, { backgroundColor: `${scoreColor}15`, borderColor: `${scoreColor}40` }]}>
                        <View style={[styles.statusDot, { backgroundColor: scoreColor }]} />
                        <Text style={[styles.statusBadgeText, { color: scoreColor }]}>
                            Cognitive Status: {riskData?.status || "Stable (Low Risk)"}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    {/* Neural Insights */}
                    <Text style={styles.sectionHeader}>🧠 Neural Behavioral Insights</Text>
                    {riskData?.insights?.map((insight, index) => (
                        <View key={index} style={styles.insightBox}>
                            <Ionicons name="analytics" size={22} color="#7c3aed" style={{ marginRight: 12 }} />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}

                    {/* Raw Telemetry Grid */}
                    <Text style={styles.sectionHeader}>📊 Telemetry Metrics Breakdown</Text>
                    <View style={styles.metricsGrid}>
                        <View style={styles.metricCard}>
                            <Ionicons name="list" size={20} color="#2563eb" />
                            <Text style={styles.metricVal}>{riskData?.raw_metrics?.total_assigned || 0}</Text>
                            <Text style={styles.metricLabel}>Total Assigned</Text>
                        </View>

                        <View style={styles.metricCard}>
                            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                            <Text style={styles.metricVal}>{riskData?.raw_metrics?.completed || 0}</Text>
                            <Text style={styles.metricLabel}>Completed</Text>
                        </View>

                        <View style={styles.metricCard}>
                            <Ionicons name="close-circle" size={20} color="#ef4444" />
                            <Text style={[styles.metricVal, { color: '#ef4444' }]}>{riskData?.raw_metrics?.missed || 0}</Text>
                            <Text style={styles.metricLabel}>Missed Tasks</Text>
                        </View>

                        <View style={styles.metricCard}>
                            <Ionicons name="warning" size={20} color="#f59e0b" />
                            <Text style={[styles.metricVal, { color: '#f59e0b' }]}>{riskData?.raw_metrics?.panic_alerts || 0}</Text>
                            <Text style={styles.metricLabel}>SOS Alerts</Text>
                        </View>
                    </View>

                    {/* Sundowning Projection */}
                    {riskData?.sundowning_window && (
                        <View style={styles.sundownBox}>
                            <Ionicons name="time" size={28} color="#d97706" style={{ marginRight: 12 }} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.sundownHeader}>Sundowning Confusion Window</Text>
                                <Text style={styles.sundownText}>{riskData.sundowning_window}</Text>
                            </View>
                        </View>
                    )}
                </View>
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
        marginBottom: 14
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
    disclaimerPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(56, 189, 248, 0.15)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)'
    },
    disclaimerText: {
        color: '#7dd3fc',
        fontSize: 11,
        fontWeight: 'bold'
    },

    content: {
        padding: 16,
        paddingBottom: 110
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 18,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.05)'
    },
    cardMainTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center'
    },
    cardSubTitle: {
        fontSize: 12,
        color: '#6d28d9',
        fontWeight: '600',
        marginTop: 3,
        textAlign: 'center'
    },

    gaugeContainer: {
        marginVertical: 18,
        alignItems: 'center'
    },
    gaugeCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 8,
        justifyContent: 'center',
        alignItems: 'center',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
    },
    scoreText: {
        fontSize: 32,
        fontWeight: '900'
    },
    scoreLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#64748b',
        letterSpacing: 0.5,
        marginTop: 1
    },

    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
        gap: 6,
        marginBottom: 12
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    statusBadgeText: {
        fontSize: 13,
        fontWeight: '800'
    },

    divider: {
        height: 1,
        width: '100%',
        backgroundColor: '#e2e8f0',
        marginVertical: 14
    },

    sectionHeader: {
        fontSize: 14,
        fontWeight: '800',
        color: '#0f172a',
        alignSelf: 'flex-start',
        marginBottom: 10,
        marginTop: 2
    },
    insightBox: {
        backgroundColor: '#faf5ff',
        padding: 12,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#ddd6fe'
    },
    insightText: {
        flex: 1,
        color: '#334155',
        fontSize: 12,
        lineHeight: 17,
        fontWeight: '600'
    },

    metricsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
        marginBottom: 12
    },
    metricCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 10,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        alignItems: 'center'
    },
    metricVal: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0f172a',
        marginTop: 4
    },
    metricLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2
    },

    sundownBox: {
        marginTop: 8,
        padding: 14,
        backgroundColor: '#fffbeb',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        borderWidth: 1.5,
        borderColor: '#fde68a'
    },
    sundownHeader: {
        fontSize: 13,
        fontWeight: '800',
        color: '#b45309'
    },
    sundownText: {
        fontSize: 12,
        color: '#d97706',
        marginTop: 2,
        fontWeight: '700'
    }
});
