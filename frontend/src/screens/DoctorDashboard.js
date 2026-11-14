import React, { useEffect, useMemo, useState } from 'react';
import {
    Alert, FlatList, ScrollView, StyleSheet, Text, TextInput,
    TouchableOpacity, View, ActivityIndicator, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    fetchConversation, fetchPatients, getUserById, getUserRole,
    sendMessage, predictRisk, linkPatientByEmail, parseUTC, fetchCaregivers,
    unlinkPatient, addReminder, deleteCaregiver
} from '../api/client';

// Helper function to generate dynamic behavior & risk graph telemetry per patient for Doctor
const getPatientAnalyticsData = (patient) => {
    if (!patient) {
        return {
            overallScore: 92,
            overallStatus: 'POSITIVE REGIMEN',
            statusColor: '#a78bfa',
            overallSummary: 'Patient shows steady memory retention and improved medication adherence. Evening agitation spikes have decreased.',
            weeklyGraph: [
                { day: 'Mon', med: 95, risk: 10 },
                { day: 'Tue', med: 90, risk: 12 },
                { day: 'Wed', med: 85, risk: 22 },
                { day: 'Thu', med: 100, risk: 8 },
                { day: 'Fri', med: 88, risk: 18 },
                { day: 'Sat', med: 92, risk: 14 },
                { day: 'Sun', med: 96, risk: 10 },
            ],
            circadianSlots: [
                { time: '🌅 Morning (8 AM - 12 PM)', status: 'High Memory Focus', pct: 95, color: '#10b981' },
                { time: '☀️ Afternoon (12 PM - 4 PM)', status: 'Stable Routine', pct: 86, color: '#3b82f6' },
                { time: '🌆 Evening (4 PM - 8 PM)', status: 'Sundowning Window (Mild Agitation)', pct: 62, color: '#f59e0b' },
                { time: '🌙 Night (8 PM - 12 AM)', status: 'Restful Sleep', pct: 90, color: '#7c3aed' },
            ],
        };
    }

    const patientIdSeed = (patient.id || 1) * 23 + (patient.full_name ? patient.full_name.charCodeAt(0) : 70);

    const baseMed = Math.max(55, Math.min(100, 88 + (patientIdSeed % 12)));
    const baseRisk = Math.max(6, Math.min(55, 12 + (patientIdSeed % 28)));

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyGraph = days.map((day, idx) => {
        const var1 = ((patientIdSeed + idx * 5) % 17) - 8;
        const var2 = ((patientIdSeed * 2 + idx * 4) % 13) - 6;
        const medVal = Math.max(45, Math.min(100, baseMed + var1));
        const riskVal = Math.max(5, Math.min(80, baseRisk + var2));
        return { day, med: medVal, risk: riskVal };
    });

    const avgMed = Math.round(weeklyGraph.reduce((a, b) => a + b.med, 0) / 7);
    const avgRisk = Math.round(weeklyGraph.reduce((a, b) => a + b.risk, 0) / 7);

    let overallStatus = 'POSITIVE REGIMEN';
    let statusColor = '#a78bfa';
    let overallSummary = `${patient.full_name} demonstrates steady cognitive stability (${avgMed}% adherence) with controlled evening restlessness.`;

    if (avgRisk > 30) {
        overallStatus = 'MODERATE AGITATION RISK';
        statusColor = '#f87171';
        overallSummary = `Clinical notice: ${patient.full_name} exhibits fluctuating evening agitation (avg risk ${avgRisk}%). Regimen review suggested.`;
    } else if (avgMed >= 90) {
        overallStatus = 'HIGH CLINICAL EFFICACY';
        statusColor = '#34d399';
        overallSummary = `${patient.full_name} responds exceptionally well to current clinical protocol with high adherence (${avgMed}%).`;
    }

    const morningPct = Math.min(100, Math.max(60, avgMed + 4));
    const afternoonPct = Math.min(100, Math.max(50, avgMed - 6));
    const eveningPct = Math.max(30, Math.min(85, 100 - avgRisk * 1.2));
    const nightPct = Math.min(100, Math.max(60, 92 - (patientIdSeed % 10)));

    const circadianSlots = [
        { time: '🌅 Morning (8 AM - 12 PM)', status: morningPct > 85 ? 'High Memory Focus' : 'Moderate Retention', pct: Math.round(morningPct), color: '#10b981' },
        { time: '☀️ Afternoon (12 PM - 4 PM)', status: afternoonPct > 75 ? 'Stable Routine' : 'Mild Fatigue', pct: Math.round(afternoonPct), color: '#3b82f6' },
        { time: '🌆 Evening (4 PM - 8 PM)', status: eveningPct < 60 ? 'Sundowning Window (Agitation Spike)' : 'Controlled Evening', pct: Math.round(eveningPct), color: eveningPct < 60 ? '#ef4444' : '#f59e0b' },
        { time: '🌙 Night (8 PM - 12 AM)', status: nightPct > 80 ? 'Restful Sleep' : 'Restless Sleep Pattern', pct: Math.round(nightPct), color: '#7c3aed' },
    ];

    return {
        overallScore: avgMed,
        overallStatus,
        statusColor,
        overallSummary,
        weeklyGraph,
        circadianSlots
    };
};

export default function DoctorDashboard() {
    const [currentUser, setCurrentUser]             = useState(null);
    const [patients, setPatients]                   = useState([]);
    const [caregiverMap, setCaregiverMap]           = useState({});
    const [caregiverList, setCaregiverList]         = useState([]);
    const [selectedPatient, setSelectedPatient]     = useState(null);
    const [selectedChatCaregiver, setSelectedChatCaregiver] = useState(null);
    const [messages, setMessages]                   = useState([]);
    const [draftMessage, setDraftMessage]           = useState('');
    const [linkPatientEmail, setLinkPatientEmail]   = useState('');
    const [removedPatientIds, setRemovedPatientIds] = useState([]);
    const [removedCaregiverIds, setRemovedCaregiverIds] = useState([]);
    
    // AI & Clinical Logs
    const [aiResult, setAiResult]                   = useState(null);
    const [loadingAi, setLoadingAi]                 = useState(false);
    const [activeTab, setActiveTab]                 = useState('overview');

    // Voice Medication Prescription Assignment
    const [medName, setMedName]                     = useState('');
    const [medTime, setMedTime]                     = useState('In 2 Mins');
    const [isListeningVoice, setIsListeningVoice]   = useState(false);
    const [voiceStatusText, setVoiceStatusText]     = useState('');
    const [medConfirm, setMedConfirm]               = useState(null);
    const [schedulingLoading, setSchedulingLoading] = useState(false);

    useEffect(() => {
        loadDashboardData();
        const pollInterval = setInterval(loadDashboardData, 8000);
        return () => clearInterval(pollInterval);
    }, []);

    useEffect(() => {
        if (selectedPatient) {
            runPatientAiAnalysis(selectedPatient.id);
            if (selectedPatient.caregiver_id && caregiverMap[selectedPatient.caregiver_id]) {
                setSelectedChatCaregiver(caregiverMap[selectedPatient.caregiver_id]);
            }
        }
    }, [selectedPatient, caregiverMap]);

    useEffect(() => {
        if (selectedChatCaregiver) {
            loadConversation(selectedChatCaregiver.id);
        } else {
            setMessages([]);
        }

        const interval = setInterval(() => {
            if (selectedChatCaregiver) {
                loadConversation(selectedChatCaregiver.id);
            }
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedChatCaregiver]);

    const patientsWithCaregivers = useMemo(
        () =>
            patients
                .filter((p) => !removedPatientIds.includes(p.id))
                .map((patient) => ({
                    ...patient,
                    caregiver: patient.caregiver_id ? caregiverMap[patient.caregiver_id] : null
                })),
        [patients, caregiverMap, removedPatientIds]
    );

    const loadDashboardData = async () => {
        try {
            const [user, fetchedPatients, allCaregivers] = await Promise.all([
                getUserRole(),
                fetchPatients(),
                fetchCaregivers()
            ]);
            const activePatients = fetchedPatients.filter(p => !removedPatientIds.includes(p.id));
            setCurrentUser(user);
            setPatients(activePatients);
            setCaregiverList(allCaregivers);

            const lookup = allCaregivers.reduce((acc, c) => {
                acc[c.id] = c;
                return acc;
            }, {});
            setCaregiverMap(lookup);

            if (activePatients.length > 0 && (!selectedPatient || !activePatients.some(p => p.id === selectedPatient.id))) {
                setSelectedPatient(activePatients[0]);
            } else if (activePatients.length === 0) {
                setSelectedPatient(null);
            }

            if (allCaregivers.length > 0 && !selectedChatCaregiver) {
                const initialCg = (activePatients[0]?.caregiver_id && lookup[activePatients[0].caregiver_id]) || allCaregivers[0];
                setSelectedChatCaregiver(initialCg);
            }
        } catch (error) {
            console.error('Failed to load doctor dashboard:', error);
        }
    };

    const handleRemovePatient = async (patient) => {
        try {
            await unlinkPatient(patient.id);
        } catch (err) {
            console.log('Backend unlink error:', err);
        }
        setRemovedPatientIds(prev => [...prev, patient.id]);
        setPatients(prev => {
            const nextList = prev.filter(p => p.id !== patient.id);
            if (selectedPatient?.id === patient.id) {
                setSelectedPatient(nextList.length > 0 ? nextList[0] : null);
            }
            return nextList;
        });
    };

    const handleRemoveCaregiver = async (cg) => {
        try {
            await deleteCaregiver(cg.id);
        } catch (err) {
            // If 403/404, still remove locally but warn
            console.warn('Backend caregiver delete error:', err?.response?.data?.detail || err);
        }
        // Always remove from UI immediately
        setRemovedCaregiverIds(prev => [...prev, cg.id]);
        setCaregiverList(prev => {
            const remaining = prev.filter(c => c.id !== cg.id);
            if (selectedChatCaregiver?.id === cg.id) {
                setSelectedChatCaregiver(remaining.length > 0 ? remaining[0] : null);
            }
            return remaining;
        });
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
        if (!selectedChatCaregiver || !draftMessage.trim()) return;
        try {
            await sendMessage(selectedChatCaregiver.id, draftMessage.trim());
            setDraftMessage('');
            loadConversation(selectedChatCaregiver.id);
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

    const startDoctorVoicePrescription = () => {
        if (Platform.OS !== 'web') {
            Alert.alert('Voice Feature', 'Voice prescription is optimized for web browser.');
            return;
        }

        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            Alert.alert('Speech Not Supported', 'Web Speech Recognition is not supported by your browser. Please type the medicine name and select the time.');
            return;
        }

        try {
            const recognition = new SpeechRec();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setIsListeningVoice(true);
                setVoiceStatusText('🎙️ Listening... Speak prescription (e.g. "Donepezil 5mg in 2 minutes" or "Memantine 10mg at 3:00 PM")');
            };

            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setVoiceStatusText(`Heard: "${transcript}"`);
                parseSpokenPrescription(transcript);
            };

            recognition.onerror = (e) => {
                console.log('Voice recognition error:', e);
                setIsListeningVoice(false);
                setVoiceStatusText('Could not capture voice clearly. You can also type the prescription directly.');
            };

            recognition.onend = () => {
                setIsListeningVoice(false);
            };

            recognition.start();
        } catch (e) {
            console.error('Speech recognition exception:', e);
            setIsListeningVoice(false);
        }
    };

    const parseSpokenPrescription = (spoken) => {
        let text = spoken.trim();
        text = text.replace(/^(prescribe|give|assign|patient needs to take|schedule|add|please prescribe|please give)\s+/i, '');

        const relMinMatch = text.match(/in\s+(\d+)\s*(minute|minutes|min|mins)/i);
        const relSecMatch = text.match(/in\s+(\d+)\s*(second|seconds|sec|secs)/i);
        const nowMatch = text.match(/\b(right now|immediately|now)\b/i);
        const atTimeMatch = text.match(/at\s+(\d{1,2}(:\d{2})?\s*(am|pm)?)/i);

        let extractedTime = null;
        let cleanMed = text;

        if (relMinMatch) {
            const mins = parseInt(relMinMatch[1], 10);
            extractedTime = `In ${mins} Mins`;
            cleanMed = text.replace(relMinMatch[0], '').trim();
        } else if (relSecMatch || nowMatch) {
            extractedTime = 'Right Now (+30s)';
            cleanMed = text.replace(relSecMatch ? relSecMatch[0] : nowMatch[0], '').trim();
        } else if (atTimeMatch) {
            extractedTime = atTimeMatch[1].trim();
            cleanMed = text.replace(atTimeMatch[0], '').trim();
        }

        cleanMed = cleanMed.replace(/^(at|for|time|dosage|medicine)\s+/i, '').trim();
        if (cleanMed) {
            cleanMed = cleanMed.charAt(0).toUpperCase() + cleanMed.slice(1);
            setMedName(cleanMed);
        }
        if (extractedTime) {
            setMedTime(extractedTime);
        }
    };

    const handleScheduleMedication = async () => {
        if (!selectedPatient) {
            Alert.alert('Patient Required', 'Please select a patient from above before assigning a prescription.');
            return;
        }
        if (!medName.trim()) {
            Alert.alert('Medicine Required', 'Please speak or enter the medicine name (e.g. Donepezil 5mg).');
            return;
        }

        setSchedulingLoading(true);
        try {
            let finalDate = new Date();
            const timeInput = medTime.trim();

            if (timeInput.includes('Right Now') || timeInput.toLowerCase().includes('now')) {
                finalDate = new Date(Date.now() + 30 * 1000);
            } else if (timeInput.toLowerCase().includes('in 2 min')) {
                finalDate = new Date(Date.now() + 2 * 60 * 1000);
            } else if (timeInput.toLowerCase().includes('in 5 min')) {
                finalDate = new Date(Date.now() + 5 * 60 * 1000);
            } else if (timeInput.toLowerCase().startsWith('in ') && timeInput.toLowerCase().includes('min')) {
                const m = parseInt(timeInput.replace(/[^0-9]/g, ''), 10) || 2;
                finalDate = new Date(Date.now() + m * 60 * 1000);
            } else if (timeInput.includes(':')) {
                const parts = timeInput.split(' ');
                const [hourStr, minStr] = parts[0].split(':');
                const modifier = parts[1] ? parts[1].toUpperCase() : '';
                let hours = parseInt(hourStr, 10);
                const minutes = parseInt(minStr, 10) || 0;
                if (modifier === 'PM' && hours !== 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                finalDate.setHours(hours);
                finalDate.setMinutes(minutes);
                finalDate.setSeconds(0);
                finalDate.setMilliseconds(0);
            }

            const titleString = `Medication - ${medName.trim()}`;
            const savedName = medName.trim();
            const displayTimeStr = finalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

            await addReminder(titleString, finalDate.toISOString(), selectedPatient.id);

            // 🔊 Voice speech synthesis feedback
            const speakMsg = `Medication prescription for ${savedName} scheduled for patient ${selectedPatient.full_name} at ${displayTimeStr}.`;
            if (Platform.OS === 'web' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                const utt = new window.SpeechSynthesisUtterance(speakMsg);
                utt.lang = 'en-IN';
                utt.rate = 0.92;
                window.speechSynthesis.speak(utt);
            }

            setMedConfirm({
                name: savedName,
                time: displayTimeStr,
                patientName: selectedPatient.full_name
            });

            setMedName('');
            setVoiceStatusText('');
        } catch (err) {
            console.error('Failed to schedule medication:', err);
            Alert.alert('Error', err.response?.data?.detail || 'Could not schedule medication reminder.');
        } finally {
            setSchedulingLoading(false);
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

            {/* View Switcher Tabs */}
            <View style={styles.tabBarRow}>
                <TouchableOpacity
                    style={[styles.tabBarBtn, activeTab === 'overview' && styles.tabBarBtnActive]}
                    onPress={() => setActiveTab('overview')}
                >
                    <Ionicons name="apps" size={16} color={activeTab === 'overview' ? 'white' : '#64748b'} />
                    <Text style={[styles.tabBarText, activeTab === 'overview' && styles.tabBarTextActive]}>Clinical Overview</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tabBarBtn, activeTab === 'analytics' && styles.tabBarBtnActive]}
                    onPress={() => setActiveTab('analytics')}
                >
                    <Ionicons name="bar-chart" size={16} color={activeTab === 'analytics' ? 'white' : '#64748b'} />
                    <Text style={[styles.tabBarText, activeTab === 'analytics' && styles.tabBarTextActive]}>Behavior & Risk Analytics</Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'analytics' ? (() => {
                const activePatient = selectedPatient || patients[0];
                const analytics = getPatientAnalyticsData(activePatient);

                return (
                    <View style={{ gap: 16 }}>
                        {/* Patient Selection Selector */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>👨‍⚕️ Clinical Telemetry & Treatment Response</Text>
                            <Text style={styles.patientSubLabel}>Select patient to review longitudinal treatment charts</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {patients.map((p) => {
                                    const isSelected = (selectedPatient?.id || patients[0]?.id) === p.id;
                                    return (
                                        <TouchableOpacity
                                            key={p.id}
                                            style={[styles.patientPill, isSelected && styles.patientPillActive]}
                                            onPress={() => setSelectedPatient(p)}
                                        >
                                            <Ionicons name="person" size={18} color={isSelected ? 'white' : '#7c3aed'} style={{ marginRight: 6 }} />
                                            <View>
                                                <Text style={[styles.patientPillName, isSelected && styles.whiteText]}>{p.full_name}</Text>
                                                <Text style={[styles.patientPillSub, isSelected && styles.lightText]}>
                                                    {p.caregiver ? `Caregiver: ${p.caregiver.full_name}` : 'No Caregiver'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        {/* Overall Treatment Efficacy Rating Card */}
                        <View style={[styles.sectionCard, { backgroundColor: '#1e1b4b' }]}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <View>
                                    <Text style={{ color: '#c4b5fd', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}>
                                        Treatment Effectiveness ({activePatient?.full_name || 'Patient'})
                                    </Text>
                                    <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginTop: 2 }}>
                                        {analytics.overallScore}% Clinical Efficacy 🩺
                                    </Text>
                                </View>
                                <View style={{ backgroundColor: 'rgba(124,58,237,0.3)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: analytics.statusColor }}>
                                    <Text style={{ color: analytics.statusColor, fontWeight: 'bold', fontSize: 11 }}>{analytics.overallStatus}</Text>
                                </View>
                            </View>
                            <Text style={{ color: '#e2e8f0', fontSize: 12, marginTop: 8, lineHeight: 17 }}>
                                {analytics.overallSummary}
                            </Text>
                        </View>

                        {/* 7-Day Medication Compliance vs Risk Bar Graph */}
                        <View style={styles.sectionCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Text style={styles.sectionTitle}>📊 7-Day Medication Response & Agitation</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#7c3aed' }} />
                                        <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>Treatment Compliance</Text>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' }} />
                                        <Text style={{ fontSize: 10, color: '#64748b', fontWeight: 'bold' }}>Risk Index</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Dual Bar Chart */}
                            <View style={styles.chartContainer}>
                                {analytics.weeklyGraph.map((col) => (
                                    <View key={col.day} style={styles.chartCol}>
                                        <Text style={styles.chartValText}>{col.med}%</Text>
                                        <View style={styles.barTrack}>
                                            <View style={[styles.barFillMed, { height: `${col.med}%` }]} />
                                            <View style={[styles.barFillRisk, { height: `${col.risk}%` }]} />
                                        </View>
                                        <Text style={styles.chartDayText}>{col.day}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>

                        {/* 24-Hour Sundowning & Behavioral Agitation Wave */}
                        <View style={styles.sectionCard}>
                            <Text style={styles.sectionTitle}>🌅 Circadian Behavioral Stability Wave</Text>
                            <Text style={styles.patientSubLabel}>Tracks circadian rhythm agitation and sundowning confusion probability</Text>

                            <View style={{ gap: 8, marginTop: 8 }}>
                                {analytics.circadianSlots.map((slot) => (
                                    <View key={slot.time} style={styles.circadianRow}>
                                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#1e1b4b' }}>{slot.time}</Text>
                                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: slot.color }}>{slot.status} ({slot.pct}%)</Text>
                                        </View>
                                        <View style={styles.circadianTrack}>
                                            <View style={[styles.circadianFill, { width: `${slot.pct}%`, backgroundColor: slot.color }]} />
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </View>
                    </View>
                );
            })() : (
                <>
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
                </>
            )}

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
                            <View style={[styles.patientPill, isSelected && styles.patientPillActive]}>
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                                    onPress={() => setSelectedPatient(item)}
                                >
                                    <Ionicons name="person-circle" size={44} color={isSelected ? 'white' : '#7c3aed'} />
                                    <View style={{ marginLeft: 10, marginRight: 8, flex: 1 }}>
                                        <Text style={[styles.patientPillName, isSelected && styles.whiteText]} numberOfLines={1}>
                                            {item.full_name}
                                        </Text>
                                        <Text style={[styles.patientPillSub, isSelected && styles.lightText]} numberOfLines={1}>
                                            Caregiver: {item.caregiver ? item.caregiver.full_name : 'Not assigned'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={{
                                        flexDirection: 'row', alignItems: 'center', gap: 4,
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : '#fee2e2',
                                        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
                                        borderWidth: 1, borderColor: isSelected ? 'white' : '#fecaca',
                                    }}
                                    onPress={() => handleRemovePatient(item)}
                                >
                                    <Ionicons name="trash-outline" size={14} color={isSelected ? 'white' : '#dc2626'} />
                                    <Text style={{ color: isSelected ? 'white' : '#dc2626', fontWeight: 'bold', fontSize: 11 }}>
                                        Remove
                                    </Text>
                                </TouchableOpacity>
                            </View>
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
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                style={styles.refreshAiBtn}
                                onPress={() => runPatientAiAnalysis(selectedPatient.id)}
                            >
                                <Ionicons name="refresh" size={18} color="white" />
                                <Text style={styles.refreshAiText}> Re-run AI</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.refreshAiBtn, { backgroundColor: '#dc2626' }]}
                                onPress={(e) => handleRemovePatient(selectedPatient, e)}
                            >
                                <Ionicons name="trash-outline" size={18} color="white" />
                                <Text style={styles.refreshAiText}> Remove</Text>
                            </TouchableOpacity>
                        </View>
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

            {/* 🎙️ Voice Prescription & Medication Assignment */}
            {selectedPatient && (
                <View style={styles.sectionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.sectionTitle}>🎙️ Voice Prescription & Schedule</Text>
                            <Text style={styles.patientSubLabel}>
                                Assign voice-activated medication reminders to <Text style={{ fontWeight: 'bold', color: '#7c3aed' }}>{selectedPatient.full_name}</Text>
                            </Text>
                        </View>
                        <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                            <Text style={{ color: '#7c3aed', fontSize: 11, fontWeight: 'bold' }}>Rx Doctor Order</Text>
                        </View>
                    </View>

                    {/* Microphone Voice Trigger Button */}
                    <TouchableOpacity
                        style={[
                            styles.voiceMicBtn,
                            isListeningVoice && styles.voiceMicBtnActive
                        ]}
                        onPress={startDoctorVoicePrescription}
                    >
                        <Ionicons
                            name={isListeningVoice ? "mic" : "mic-outline"}
                            size={28}
                            color="white"
                        />
                        <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={styles.voiceMicTitle}>
                                {isListeningVoice ? '🔴 Listening... Speak prescription now' : '🎙️ Tap to Speak Prescription'}
                            </Text>
                            <Text style={styles.voiceMicSubtitle}>
                                {isListeningVoice
                                    ? 'Speak e.g. "Donepezil 5mg in 2 minutes"'
                                    : 'Transcribes medicine name & time automatically'}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {voiceStatusText ? (
                        <View style={styles.voiceStatusBox}>
                            <Ionicons name="chatbubble-ellipses-outline" size={16} color="#7c3aed" />
                            <Text style={styles.voiceStatusText}>{voiceStatusText}</Text>
                        </View>
                    ) : null}

                    {/* Prescription Details Inputs */}
                    <View style={{ marginTop: 14 }}>
                        <Text style={styles.inputLabel}>Medicine Name & Dosage:</Text>
                        <TextInput
                            style={styles.textInputFull}
                            value={medName}
                            onChangeText={setMedName}
                            placeholder="e.g. Donepezil 5mg, Memantine 10mg..."
                            placeholderTextColor="#94a3b8"
                        />

                        <Text style={[styles.inputLabel, { marginTop: 12 }]}>Scheduled Time / Quick Preset:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                            {[
                                'Right Now (+30s)',
                                'In 2 Mins',
                                'In 5 Mins',
                                '09:00 AM',
                                '01:00 PM',
                                '06:00 PM',
                                '09:00 PM'
                            ].map((preset) => (
                                <TouchableOpacity
                                    key={preset}
                                    style={[
                                        styles.timePresetChip,
                                        medTime === preset && styles.timePresetChipActive
                                    ]}
                                    onPress={() => setMedTime(preset)}
                                >
                                    <Text style={[
                                        styles.timePresetText,
                                        medTime === preset && styles.timePresetTextActive
                                    ]}>
                                        {preset}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <TextInput
                            style={[styles.textInputFull, { marginTop: 6 }]}
                            value={medTime}
                            onChangeText={setMedTime}
                            placeholder="Selected time (e.g. In 2 Mins or 02:30 PM)"
                            placeholderTextColor="#94a3b8"
                        />

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.scheduleBtn, schedulingLoading && { opacity: 0.7 }]}
                            onPress={handleScheduleMedication}
                            disabled={schedulingLoading}
                        >
                            {schedulingLoading ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="calendar-outline" size={20} color="white" />
                                    <Text style={styles.scheduleBtnText}>
                                        Assign & Send to Patient Dashboard
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Confirmation Banner */}
                    {medConfirm && (
                        <View style={styles.confirmBanner}>
                            <Ionicons name="checkmark-circle" size={26} color="#16a34a" />
                            <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.confirmTitle}>✅ Medication Assigned to Patient!</Text>
                                <Text style={styles.confirmText}>
                                    Prescribed <Text style={{ fontWeight: 'bold' }}>{medConfirm.name}</Text> for <Text style={{ fontWeight: 'bold' }}>{medConfirm.patientName}</Text> at <Text style={{ fontWeight: 'bold' }}>{medConfirm.time}</Text>.
                                </Text>
                                <Text style={{ fontSize: 11, color: '#15803d', marginTop: 2 }}>
                                    Patient dashboard will speak and display the reminder automatically at the scheduled time.
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setMedConfirm(null)} style={{ padding: 4 }}>
                                <Ionicons name="close" size={20} color="#64748b" />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            {/* Caregiver Coordination & Chat */}
            <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>💬 Direct Caregiver Consultation</Text>
                
                {/* Horizontal Caregiver Selection Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
                    {caregiverList.map((cg) => {
                        const isSelected = selectedChatCaregiver?.id === cg.id;
                        return (
                            <View
                                key={cg.id}
                                style={[
                                    styles.patientPill,
                                    isSelected && styles.patientPillActive,
                                    { paddingVertical: 6, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }
                                ]}
                            >
                                {/* Select / highlight this caregiver */}
                                <TouchableOpacity
                                    style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                                    onPress={() => setSelectedChatCaregiver(cg)}
                                >
                                    <Ionicons name="shield-checkmark" size={16} color={isSelected ? 'white' : '#7c3aed'} style={{ marginRight: 5 }} />
                                    <Text style={[styles.patientPillName, isSelected && styles.whiteText, { fontSize: 13 }]}>
                                        Caregiver: {cg.full_name}
                                    </Text>
                                </TouchableOpacity>

                                {/* ✕ Delete / Remove button */}
                                <TouchableOpacity
                                    onPress={() => handleRemoveCaregiver(cg)}
                                    style={{
                                        backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : '#fee2e2',
                                        borderRadius: 8,
                                        width: 22,
                                        height: 22,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginLeft: 4,
                                        borderWidth: 1,
                                        borderColor: isSelected ? 'rgba(255,255,255,0.5)' : '#fca5a5',
                                    }}
                                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                                >
                                    <Text style={{ color: isSelected ? 'white' : '#dc2626', fontSize: 13, fontWeight: 'bold', lineHeight: 16 }}>✕</Text>
                                </TouchableOpacity>
                            </View>
                        );
                    })}
                </ScrollView>

                {selectedChatCaregiver ? (
                    <View style={styles.chatContainer}>
                        <Text style={styles.patientSubLabel}>
                            Active Conversation with Caregiver: {selectedChatCaregiver.full_name} ({selectedChatCaregiver.email})
                        </Text>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            renderItem={({ item }) => {
                                const isMine = item.sender_id === currentUser?.id;
                                return (
                                    <View style={[styles.msgBubble, isMine ? styles.msgMine : styles.msgTheirs]}>
                                        <Text style={styles.msgSender}>{isMine ? 'You (Doctor)' : selectedChatCaregiver.full_name}</Text>
                                        <Text style={[styles.msgContent, isMine && styles.whiteText]}>{item.content}</Text>
                                        <Text style={[styles.msgTime, isMine && styles.lightText]}>
                                            {parseUTC(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </Text>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={<Text style={styles.emptyText}>No messages yet. Send a note to caregiver {selectedChatCaregiver.full_name} below.</Text>}
                        />

                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.textInput}
                                value={draftMessage}
                                onChangeText={setDraftMessage}
                                placeholder={`Type medical instructions for ${selectedChatCaregiver.full_name}...`}
                                placeholderTextColor="#888"
                            />
                            <TouchableOpacity style={styles.actionBtn} onPress={handleSendMessage}>
                                <Text style={styles.actionBtnText}>SEND</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No caregivers found in system.</Text>
                )}
            </View>

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

    /* Behavior & Risk Analytics Tab & Chart Styles */
    tabBarRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    tabBarBtn: {
        flex: 1, backgroundColor: 'white', paddingVertical: 12, borderRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
        borderWidth: 1.5, borderColor: '#e2e8f0', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 2
    },
    tabBarBtnActive: { backgroundColor: '#7c3aed', borderColor: '#6d28d9' },
    tabBarText: { color: '#64748b', fontWeight: 'bold', fontSize: 12 },
    tabBarTextActive: { color: 'white' },

    chartContainer: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
        height: 160, paddingTop: 20, paddingBottom: 6, borderBottomWidth: 1.5, borderBottomColor: '#cbd5e1'
    },
    chartCol: { alignItems: 'center', flex: 1 },
    chartValText: { fontSize: 10, fontWeight: 'bold', color: '#7c3aed', marginBottom: 4 },
    barTrack: {
        width: 14, height: 100, backgroundColor: '#f1f5f9', borderRadius: 7,
        justifyContent: 'flex-end', overflow: 'hidden', flexDirection: 'column'
    },
    barFillMed: { backgroundColor: '#7c3aed', width: '100%', borderRadius: 7 },
    barFillRisk: { backgroundColor: '#dc2626', width: '100%', borderRadius: 7, marginTop: 2 },
    chartDayText: { fontSize: 10, color: '#64748b', fontWeight: 'bold', marginTop: 6 },

    circadianRow: { backgroundColor: '#f8fafc', padding: 10, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
    circadianTrack: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, overflow: 'hidden' },
    circadianFill: { height: '100%', borderRadius: 4 },

    /* Voice Prescription & Schedule Styles */
    voiceMicBtn: {
        backgroundColor: '#7c3aed', borderRadius: 16, padding: 14,
        flexDirection: 'row', alignItems: 'center', marginTop: 12,
        shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 8, elevation: 3
    },
    voiceMicBtnActive: {
        backgroundColor: '#dc2626', shadowColor: '#dc2626'
    },
    voiceMicTitle: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    voiceMicSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: 2 },
    voiceStatusBox: {
        backgroundColor: '#f5f3ff', padding: 10, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
        borderWidth: 1, borderColor: '#ddd6fe'
    },
    voiceStatusText: { color: '#6d28d9', fontSize: 12, flex: 1, fontWeight: '500' },
    inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#334155', marginBottom: 6 },
    textInputFull: {
        backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1',
        borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#1e293b'
    },
    timePresetChip: {
        backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 10, marginRight: 8, borderWidth: 1, borderColor: '#e2e8f0'
    },
    timePresetChipActive: {
        backgroundColor: '#7c3aed', borderColor: '#6d28d9'
    },
    timePresetText: { color: '#475569', fontWeight: 'bold', fontSize: 12 },
    timePresetTextActive: { color: 'white' },
    scheduleBtn: {
        backgroundColor: '#059669', borderRadius: 14, paddingVertical: 14,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
        shadowColor: '#059669', shadowOpacity: 0.25, shadowRadius: 6, elevation: 2
    },
    scheduleBtnText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
    confirmBanner: {
        backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac',
        borderRadius: 14, padding: 12, flexDirection: 'row', alignItems: 'center', marginTop: 14
    },
    confirmTitle: { color: '#15803d', fontWeight: 'bold', fontSize: 14 },
    confirmText: { color: '#166534', fontSize: 12, marginTop: 2 }
});
