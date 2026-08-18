import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { predictRisk } from '../api/client';

export default function AIRiskScreen({ route, navigation }) {
    const { patientId } = route.params;
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
        if (score < 40) return '#16a34a';
        if (score < 70) return '#d97706';
        return '#dc2626';
    };

    if (loading) {
        return (
            <LinearGradient colors={['#3b185f', '#1a0b2e']} style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ color: 'white', marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>AI Engine Analyzing Telemetry...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🧠 Clinical AI Evaluation</Text>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <Text style={styles.title}>Behavioral AI & Cognitive Inference</Text>
                    <Text style={styles.subtitle}>Scikit-Learn Random Forest Model</Text>

                    <View style={styles.gaugeContainer}>
                        <View style={[styles.gaugeCircle, { borderColor: getScoreColor(riskData?.score || 0) }]}>
                            <Text style={[styles.scoreText, { color: getScoreColor(riskData?.score || 0) }]}>
                                {riskData?.score || 0}%
                            </Text>
                            <Text style={styles.scoreLabel}>RISK SCORE</Text>
                        </View>
                    </View>

                    <Text style={[styles.statusText, { color: getScoreColor(riskData?.score || 0) }]}>
                        Status: {riskData?.status || "Unknown"}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.insightHeader}>Clinical Neural Insights</Text>
                    {riskData?.insights?.map((insight, index) => (
                        <View key={index} style={styles.insightBox}>
                            <Ionicons name="analytics" size={24} color="#7c3aed" style={{ marginRight: 12 }} />
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}

                    <View style={styles.metricsBox}>
                        <Text style={styles.metricLabel}>Total Assigned Tasks: <Text style={styles.metricVal}>{riskData?.raw_metrics?.total_assigned || 0}</Text></Text>
                        <Text style={styles.metricLabel}>Completed Tasks: <Text style={styles.metricVal}>{riskData?.raw_metrics?.completed || 0}</Text></Text>
                        <Text style={styles.metricLabel}>Missed Tasks: <Text style={[styles.metricVal, { color: '#dc2626' }]}>{riskData?.raw_metrics?.missed || 0}</Text></Text>
                        <Text style={styles.metricLabel}>SOS Emergency Dispatches: <Text style={[styles.metricVal, { color: '#d97706' }]}>{riskData?.raw_metrics?.panic_alerts || 0}</Text></Text>
                    </View>

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
                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55, paddingBottom: 18, paddingHorizontal: 20,
        backgroundColor: 'white', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    backBtn: { padding: 8, backgroundColor: '#f0ebff', borderRadius: 12 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f1545' },
    content: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 26, alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', color: '#1f2a44', textAlign: 'center' },
    subtitle: { color: '#6b7280', marginTop: 6, textAlign: 'center', fontSize: 15 },
    gaugeContainer: { marginVertical: 26, alignItems: 'center' },
    gaugeCircle: { width: 170, height: 170, borderRadius: 85, borderWidth: 9, justifyContent: 'center', alignItems: 'center' },
    scoreText: { fontSize: 48, fontWeight: 'bold' },
    scoreLabel: { fontSize: 15, fontWeight: 'bold', color: '#888', marginTop: 4 },
    statusText: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    divider: { height: 1.5, width: '100%', backgroundColor: '#e2e8f0', marginVertical: 18 },
    insightHeader: { fontSize: 20, fontWeight: 'bold', color: '#1f2a44', alignSelf: 'flex-start', marginBottom: 14 },
    insightBox: { backgroundColor: '#f5f3ff', padding: 16, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%', borderWidth: 1, borderColor: '#ddd6fe' },
    insightText: { flex: 1, color: '#334155', fontSize: 15, lineHeight: 22 },
    metricsBox: { marginTop: 16, padding: 18, backgroundColor: '#f8fafc', borderRadius: 16, width: '100%', borderWidth: 1.5, borderColor: '#e2e8f0', gap: 8 },
    metricLabel: { color: '#475569', fontSize: 16 },
    metricVal: { fontWeight: 'bold', color: '#0f172a', fontSize: 17 },
    sundownBox: { marginTop: 18, padding: 18, backgroundColor: '#fffbeb', borderRadius: 16, flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1.5, borderColor: '#fde68a' },
    sundownHeader: { fontSize: 17, fontWeight: 'bold', color: '#b45309' },
    sundownText: { fontSize: 16, color: '#d97706', marginTop: 4, fontWeight: 'bold' }
});
