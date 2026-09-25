import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert, FlatList, ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    fetchConversation, fetchPatients, getUserById, getUserRole,
    sendMessage, predictRisk, linkPatientByEmail, parseUTC
} from '../api/client';

export default function DoctorDashboard() {
    const [currentUser, setCurrentUser]             = useState(null);
    const [patients, setPatients]                   = useState([]);
    const [caregiverMap, setCaregiverMap]           = useState({});
    const [selectedPatient, setSelectedPatient]     = useState(null);
    const [messages, setMessages]                   = useState([]);
    const [draftMessage, setDraftMessage]           = useState('');
    const [linkPatientEmail, setLinkPatientEmail]   = useState('');
    
    // AI & Clinical Logs
    const [aiResult, setAiResult]                   = useState(null);
    const [loadingAi, setLoadingAi]                 = useState(false);

    const selectedCaregiver = selectedPatient ? caregiverMap[selectedPatient.caregiver_id] : null;

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        if (selectedPatient) {
            runPatientAiAnalysis(selectedPatient.id);
        }
        if (selectedCaregiver) {
            loadConversation(selectedCaregiver.id);
        } else {
            setMessages([]);
        }
    }, [selectedPatient, selectedCaregiver]);

    const patientsWithCaregivers = useMemo(
        () =>
            patients.map((patient) => ({
                ...patient,
                caregiver: patient.caregiver_id ? caregiverMap[patient.caregiver_id] : null
            })),
        [patients, caregiverMap]
    );

    const loadDashboardData = async () => {
        try {
            const [user, fetchedPatients] = await Promise.all([getUserRole(), fetchPatients()]);
            setCurrentUser(user);
            setPatients(fetchedPatients);

            const caregiverIds = [...new Set(fetchedPatients.map((p) => p.caregiver_id).filter(Boolean))];
            const caregivers = await Promise.all(caregiverIds.map((cId) => getUserById(cId)));
            const lookup = caregivers.reduce((acc, c) => {
                acc[c.id] = c;
                return acc;
            }, {});
            setCaregiverMap(lookup);

            if (fetchedPatients.length > 0) {
                setSelectedPatient(fetchedPatients[0]);
            }
        } catch (error) {
            console.error('Failed to load doctor dashboard:', error);
        }
    };

    const runPatientAiAnalysis = async (patientId) => {
        setLoadingAi(true);
        try {
            const result = await predictRisk(patientId);
            setAiResult(result);
        } catch (error) {
            console.error('AI error for patient', patientId, error);
            setAiResult(null);
        } finally {
            setLoadingAi(false);
        }
    };

    const loadConversation = async (caregiverId) => {
        try {
            const conversation = await fetchConversation(caregiverId);
            setMessages(conversation);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedCaregiver || !draftMessage.trim()) return;
        try {
            await sendMessage(selectedCaregiver.id, draftMessage.trim());
            setDraftMessage('');
            loadConversation(selectedCaregiver.id);
        } catch (error) {
            Alert.alert('Chat Error', 'Message could not be sent.');
        }
    };

    const handleLinkPatient = async () => {
        if (!linkPatientEmail.trim()) return;
        try {
            await linkPatientByEmail(linkPatientEmail.trim());
            Alert.alert('✅ Success', 'Patient linked successfully to your medical panel!');
            setLinkPatientEmail('');
            loadDashboardData();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'Could not link patient.');
        }
    };

    const getRiskColor = (score) => {
        if (score >= 75) return '#dc2626';
        if (score >= 40) return '#d97706';
        return '#16a34a';
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

            {/* Header */}
            <View style={styles.headerBox}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>👨‍⚕️ Clinical AI Dashboard</Text>
                    <Text style={styles.headerSub}>
                        {currentUser ? `Dr. ${currentUser.full_name}` : 'Neurology Specialist Panel'}
                    </Text>
                </View>
                <View style={styles.doctorBadge}>
                    <Ionicons name="medkit" size={28} color="white" />
                    <Text style={styles.doctorBadgeText}>Neurology M.D.</Text>
                </View>
            </View>

            {/* Quick Stats Banner */}
            <View style={styles.statsRow}>
                <View style={styles.statCard}>
                    <Text style={styles.statNum}>{patients.length}</Text>
                    <Text style={styles.statLabel}>Active Patients</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNum, { color: '#16a34a' }]}>
                        {patients.filter(p => p.caregiver_id).length}
                    </Text>
                    <Text style={styles.statLabel}>Linked Caregivers</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={[styles.statNum, { color: '#7c3aed' }]}>AI Engine</Text>
                    <Text style={styles.statLabel}>Random Forest ML</Text>
                </View>
            </View>

            {/* Link Patient Section */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>➕ Link Patient to Panel</Text>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.textInput}
                        value={linkPatientEmail}
                        onChangeText={setLinkPatientEmail}
                        placeholder="Enter patient email address..."
                        placeholderTextColor="#888"
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.actionBtn} onPress={handleLinkPatient}>
                        <Text style={styles.actionBtnText}>LINK PATIENT</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Patient Selector Row */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>👥 Select Patient to Analyze</Text>
                <FlatList
                    data={patientsWithCaregivers}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => {
                        const isSelected = selectedPatient?.id === item.id;
                        return (
                            <TouchableOpacity
                                style={[styles.patientPill, isSelected && styles.patientPillActive]}
                                onPress={() => setSelectedPatient(item)}
                            >
                                <Ionicons name="person-circle" size={48} color={isSelected ? 'white' : '#7c3aed'} />
                                <View style={{ marginLeft: 14 }}>
                                    <Text style={[styles.patientPillName, isSelected && styles.whiteText]}>
                                        {item.full_name}
                                    </Text>
                                    <Text style={[styles.patientPillSub, isSelected && styles.lightText]}>
                                        Caregiver: {item.caregiver ? item.caregiver.full_name : 'Not assigned'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    ListEmptyComponent={<Text style={styles.emptyText}>No patients linked to your account yet.</Text>}
                />
            </View>

            {/* Patient AI Analysis Panel */}
            {selectedPatient && (
                <View style={styles.sectionCard}>
                    <View style={styles.cardHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>🧠 Behavioral & Cognitive AI Evaluation</Text>
                            <Text style={styles.patientSubLabel}>Selected Patient: {selectedPatient.full_name} ({selectedPatient.email})</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.refreshAiBtn}
                            onPress={() => runPatientAiAnalysis(selectedPatient.id)}
                        >
                            <Ionicons name="refresh" size={22} color="white" />
                            <Text style={styles.refreshAiText}> Re-run AI</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingAi ? (
                        <View style={styles.loadingBox}>
                            <ActivityIndicator size="large" color="#7c3aed" />
                            <Text style={styles.loadingText}>Analyzing telemetry & evaluating Scikit-Learn ML Model...</Text>
                        </View>
                    ) : aiResult ? (
                        <View style={styles.aiResultBox}>
                            {/* Top Risk Gauge Row */}
                            <View style={styles.riskBadgeRow}>
                                <View style={[styles.riskGaugeCircle, { borderColor: getRiskColor(aiResult.score) }]}>
                                    <Text style={[styles.riskGaugeNum, { color: getRiskColor(aiResult.score) }]}>
                                        {aiResult.score}%
                                    </Text>
                                    <Text style={styles.riskGaugeLabel}>RISK SCORE</Text>
                                </View>
                                <View style={{ flex: 1, marginLeft: 24 }}>
                                    <Text style={styles.aiStatusHeader}>COGNITIVE STATUS</Text>
                                    <Text style={[styles.aiStatusTitle, { color: getRiskColor(aiResult.score) }]}>
                                        {aiResult.status}
                                    </Text>

                                    <View style={styles.adherenceProgressBg}>
                                        <View style={[styles.adherenceProgressFill, { width: `${aiResult.adherence_pct || 100}%` }]} />
                                    </View>
                                    <Text style={styles.adherenceText}>
                                        Medication Adherence: <Text style={{ fontWeight: 'bold' }}>{aiResult.adherence_pct}%</Text>
                                    </Text>
                                </View>
                            </View>

                            {/* Detailed Telemetry Metrics */}
                            <View style={styles.metricsGrid}>
                                <View style={styles.metricItem}>
                                    <Ionicons name="medical" size={32} color="#7c3aed" />
                                    <Text style={styles.metricVal}>{aiResult.raw_metrics?.completed || 0} / {aiResult.raw_metrics?.total_assigned || 0}</Text>
                                    <Text style={styles.metricSub}>Completed Schedules</Text>
                                </View>

                                <View style={styles.metricItem}>
                                    <Ionicons name="close-circle" size={32} color="#dc2626" />
                                    <Text style={[styles.metricVal, { color: '#dc2626' }]}>{aiResult.raw_metrics?.missed || 0}</Text>
                                    <Text style={styles.metricSub}>Missed Schedules</Text>
                                </View>

                                <View style={styles.metricItem}>
                                    <Ionicons name="warning" size={32} color="#d97706" />
                                    <Text style={[styles.metricVal, { color: '#d97706' }]}>{aiResult.raw_metrics?.panic_alerts || 0}</Text>
                                    <Text style={styles.metricSub}>Emergency SOS Alerts</Text>
                                </View>
                            </View>

                            {/* Sundowning Projection */}
                            <View style={styles.sundownBox}>
                                <Ionicons name="time" size={36} color="#d97706" />
                                <View style={{ flex: 1, marginLeft: 18 }}>
                                    <Text style={styles.sundownTitle}>Predicted Sundowning Confusion Window</Text>
                                    <Text style={styles.sundownTime}>{aiResult.sundowning_window}</Text>
                                    <Text style={styles.sundownDesc}>Derived from peak temporal confusion & uncompleted medication schedule logs.</Text>
                                </View>
                            </View>

                            {/* How AI Evaluates */}
                            <Text style={styles.reasonHeader}>📋 Clinical Telemetry Breakdown:</Text>
                            {aiResult.insights?.map((insight, idx) => (
                                <View key={idx} style={styles.insightRow}>
                                    <Ionicons name="analytics" size={24} color="#7c3aed" />
                                    <Text style={styles.insightText}>{insight}</Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>Could not load AI telemetry data.</Text>
                    )}
                </View>
            )}

            {/* Caregiver Coordination & Chat */}
            {selectedCaregiver ? (
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>💬 Direct Caregiver Consultation</Text>
                    <Text style={styles.patientSubLabel}>Caregiver: {selectedCaregiver.full_name} ({selectedCaregiver.email})</Text>

                    <View style={styles.chatContainer}>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            renderItem={({ item }) => {
                                const isMine = item.sender_id === currentUser?.id;
                                return (
                                    <View style={[styles.msgBubble, isMine ? styles.msgMine : styles.msgTheirs]}>
                                        <Text style={styles.msgSender}>{isMine ? 'You (Doctor)' : selectedCaregiver.full_name}</Text>
                                        <Text style={[styles.msgContent, isMine && styles.whiteText]}>{item.content}</Text>
                                        <Text style={[styles.msgTime, isMine && styles.lightText]}>
                                            {parseUTC(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={<Text style={styles.emptyText}>No messages yet. Send a note to the caregiver below.</Text>}
                        />

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                value={draftMessage}
                                onChangeText={setDraftMessage}
                                placeholder="Type medical instructions for caregiver..."
                                placeholderTextColor="#888"
                            />
                            <TouchableOpacity style={styles.actionBtn} onPress={handleSendMessage}>
                                <Text style={styles.actionBtnText}>SEND</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            ) : selectedPatient ? (
                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>💬 Caregiver Chat</Text>
                    <Text style={styles.emptyText}>No caregiver is currently linked to {selectedPatient.full_name}.</Text>
                </View>
            ) : null}

            <View style={{ height: 80 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f4f8' },
    content: { padding: 24, paddingTop: 55 },

    headerBox: {
        backgroundColor: '#1e1b4b', borderRadius: 28, padding: 28,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22
    },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: 'white' },
    headerSub: { fontSize: 13, color: '#c4b5fd', marginTop: 4 },
    doctorBadge: {
        backgroundColor: '#7c3aed', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 14, alignItems: 'center', flexDirection: 'row', gap: 6
    },
    doctorBadgeText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
    statCard: {
        flex: 1, backgroundColor: 'white', borderRadius: 18, padding: 16,
        alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3
    },
    statNum: { fontSize: 24, fontWeight: 'bold', color: '#1e1b4b' },
    statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4, fontWeight: '600' },

    sectionCard: {
        backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 18,
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 3
    },
    sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e1b4b' },
    patientSubLabel: { fontSize: 13, color: '#7c3aed', marginTop: 3, marginBottom: 14, fontWeight: '600' },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    inputRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
    textInput: {
        flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 14,
        paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, backgroundColor: '#f8fafc', color: '#1e1b4b'
    },
    actionBtn: {
        backgroundColor: '#7c3aed', paddingHorizontal: 18, borderRadius: 14,
        justifyContent: 'center', alignItems: 'center'
    },
    actionBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    patientPill: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff',
        paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16, marginRight: 10,
        borderWidth: 1.5, borderColor: '#ddd6fe'
    },
    patientPillActive: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
    patientPillName: { fontWeight: 'bold', fontSize: 15, color: '#1e1b4b' },
    patientPillSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
    whiteText: { color: 'white' },
    lightText: { color: '#e9d5ff' },
    emptyText: { color: '#6b7280', textAlign: 'center', marginVertical: 16, fontSize: 13 },

    refreshAiBtn: {
        backgroundColor: '#7c3aed', paddingHorizontal: 14, paddingVertical: 8,
        borderRadius: 12, flexDirection: 'row', alignItems: 'center'
    },
    refreshAiText: { color: 'white', fontSize: 13, fontWeight: 'bold' },

    loadingBox: { padding: 30, alignItems: 'center' },
    loadingText: { color: '#6b7280', fontSize: 13, marginTop: 12, textAlign: 'center' },

    aiResultBox: { marginTop: 12 },
    riskBadgeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 18, marginBottom: 16 },
    riskGaugeCircle: {
        width: 80, height: 80, borderRadius: 40, borderWidth: 6,
        justifyContent: 'center', alignItems: 'center', backgroundColor: 'white'
    },
    riskGaugeNum: { fontSize: 24, fontWeight: 'bold' },
    riskGaugeLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginTop: 1 },
    aiStatusHeader: { fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 'bold' },
    aiStatusTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
    adherenceProgressBg: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, marginTop: 10, overflow: 'hidden' },
    adherenceProgressFill: { height: '100%', backgroundColor: '#16a34a', borderRadius: 5 },
    adherenceText: { fontSize: 13, color: '#334155', marginTop: 8 },

    metricsGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
    metricItem: {
        flex: 1, backgroundColor: '#f8fafc', padding: 14, borderRadius: 16,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0'
    },
    metricVal: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginTop: 6 },
    metricSub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4, fontWeight: '600' },

    sundownBox: {
        backgroundColor: '#fffbeb', borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', marginBottom: 16,
        borderWidth: 1.5, borderColor: '#fde68a'
    },
    sundownTitle: { fontSize: 14, fontWeight: 'bold', color: '#b45309' },
    sundownTime: { fontSize: 18, fontWeight: 'bold', color: '#d97706', marginTop: 2 },
    sundownDesc: { fontSize: 12, color: '#92400e', marginTop: 3, lineHeight: 17 },

    reasonHeader: { fontSize: 15, fontWeight: 'bold', color: '#1e1b4b', marginBottom: 10 },
    insightRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, gap: 10 },
    insightText: { flex: 1, fontSize: 13, color: '#334155', lineHeight: 18 },

    chatContainer: { marginTop: 10 },
    msgBubble: { padding: 12, borderRadius: 14, marginBottom: 10, maxWidth: '85%' },
    msgMine: { alignSelf: 'flex-end', backgroundColor: '#7c3aed' },
    msgTheirs: { alignSelf: 'flex-start', backgroundColor: '#f1f5f9' },
    msgSender: { fontSize: 12, fontWeight: 'bold', color: '#64748b', marginBottom: 4 },
    msgContent: { fontSize: 13, color: '#1e1b4b', lineHeight: 18 },
    msgTime: { fontSize: 11, color: '#94a3b8', marginTop: 6, textAlign: 'right' },
});
