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
        if (score < 40) return '#28a745';
        if (score < 70) return '#f5a623';
        return '#dc3545';
    };

    if (loading) {
        return (
            <LinearGradient colors={['#3b185f', '#1a0b2e']} style={[styles.container, {justifyContent: 'center', alignItems: 'center'}]}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{color: 'white', marginTop: 20}}>AI Analyzing Behavior Patterns...</Text>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>🧠 AI Risk Analysis</Text>
                <View style={{width: 24}}/>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.title}>Cognitive Inference Engine</Text>
                    <Text style={styles.subtitle}>Scikit-Learn Random Forest Prediction</Text>
                    
                    <View style={styles.gaugeContainer}>
                        <View style={[styles.gaugeCircle, { borderColor: getScoreColor(riskData?.score || 0) }]}>
                            <Text style={[styles.scoreText, { color: getScoreColor(riskData?.score || 0) }]}>
                                {riskData?.score || 0}%
                            </Text>
                            <Text style={styles.scoreLabel}>RISK</Text>
                        </View>
                    </View>

                    <Text style={[styles.statusText, { color: getScoreColor(riskData?.score || 0) }]}>
                        Status: {riskData?.status || "Unknown"}
                    </Text>

                    <View style={styles.divider} />

                    <Text style={styles.insightHeader}>Neural Insights</Text>
                    {riskData?.insights?.map((insight, index) => (
                        <View key={index} style={styles.insightBox}>
                            <Ionicons name="bulb-outline" size={20} color="#3b5bdb" style={{marginRight: 10}}/>
                            <Text style={styles.insightText}>{insight}</Text>
                        </View>
                    ))}

                    <View style={styles.metricsBox}>
                        <Text style={styles.metricLabel}>Total Missed Tasks: <Text style={{fontWeight:'bold'}}>{riskData?.raw_metrics?.missed || 0}</Text></Text>
                        <Text style={styles.metricLabel}>SOS Dispatches: <Text style={{fontWeight:'bold'}}>{riskData?.raw_metrics?.panics || 0}</Text></Text>
                    </View>

                    {riskData?.sundowning_window && (
                        <View style={styles.sundownBox}>
                            <Ionicons name="time-outline" size={24} color="#e67e22" style={{marginRight: 10}}/>
                            <View style={{flex: 1}}>
                                <Text style={styles.sundownHeader}>Sundowning Risk Period</Text>
                                <Text style={styles.sundownText}>{riskData.sundowning_window}</Text>
                            </View>
                        </View>
                    )}
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 30, alignItems: 'center' },
    title: { fontSize: 22, fontWeight: 'bold', color: '#1f2a44', textAlign: 'center' },
    subtitle: { color: '#667085', marginTop: 5, textAlign: 'center' },
    gaugeContainer: { marginVertical: 30, alignItems: 'center' },
    gaugeCircle: { width: 150, height: 150, borderRadius: 75, borderWidth: 8, justifyContent: 'center', alignItems: 'center' },
    scoreText: { fontSize: 42, fontWeight: 'bold' },
    scoreLabel: { fontSize: 14, fontWeight: 'bold', color: '#888' },
    statusText: { fontSize: 18, fontWeight: 'bold', marginBottom: 20 },
    divider: { height: 1, width: '100%', backgroundColor: '#eee', marginVertical: 15 },
    insightHeader: { fontSize: 18, fontWeight: 'bold', color: '#333', alignSelf: 'flex-start', marginBottom: 15 },
    insightBox: { backgroundColor: '#f0f4fc', padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginBottom: 10, width: '100%' },
    insightText: { flex: 1, color: '#333' },
    metricsBox: { marginTop: 20, padding: 15, backgroundColor: '#fafafa', borderRadius: 12, width: '100%', borderWidth: 1, borderColor: '#eee' },
    metricLabel: { color: '#666', marginBottom: 5 },
    sundownBox: { marginTop: 15, padding: 15, backgroundColor: '#fff4e6', borderRadius: 12, flexDirection: 'row', alignItems: 'center', width: '100%', borderWidth: 1, borderColor: '#ffe0b2' },
    sundownHeader: { fontSize: 16, fontWeight: 'bold', color: '#e67e22' },
    sundownText: { fontSize: 13, color: '#d35400', marginTop: 2 }
});
