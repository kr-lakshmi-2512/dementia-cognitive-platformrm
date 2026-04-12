import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { fetchConversation, fetchPatients, getUserById, getUserRole, sendMessage, predictRisk, linkPatientByEmail } from '../api/client';

export default function DoctorDashboard() {
    const [currentUser, setCurrentUser] = useState(null);
    const [patients, setPatients] = useState([]);
    const [caregiverMap, setCaregiverMap] = useState({});
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draftMessage, setDraftMessage] = useState('');
    const [linkPatientEmail, setLinkPatientEmail] = useState('');
    const [age, setAge] = useState('75');
    const [memoryScore, setMemoryScore] = useState('15');
    const [activityLevel, setActivityLevel] = useState('2');
    const [missedMeds, setMissedMeds] = useState('3');
    const [predictionResult, setPredictionResult] = useState(null);
    const [sundownResult, setSundownResult] = useState(null);

    const selectedCaregiver = selectedPatient ? caregiverMap[selectedPatient.caregiver_id] : null;

    useEffect(() => {
        loadDashboardData();
    }, []);

    useEffect(() => {
        if (selectedCaregiver) {
            loadConversation(selectedCaregiver.id);
        }
    }, [selectedCaregiver]);

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

            const caregiverIds = [...new Set(fetchedPatients.map((patient) => patient.caregiver_id).filter(Boolean))];
            const caregivers = await Promise.all(caregiverIds.map((caregiverId) => getUserById(caregiverId)));
            const caregiverLookup = caregivers.reduce((acc, caregiver) => {
                acc[caregiver.id] = caregiver;
                return acc;
            }, {});
            setCaregiverMap(caregiverLookup);

            if (fetchedPatients.length > 0) {
                setSelectedPatient(fetchedPatients[0]);
            }
        } catch (error) {
            console.error('Failed to load doctor dashboard:', error);
        }
    };

    const loadConversation = async (caregiverId) => {
        try {
            const conversation = await fetchConversation(caregiverId);
            setMessages(conversation);
        } catch (error) {
            console.error('Failed to load doctor messages:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!selectedCaregiver || !draftMessage.trim()) return;
        try {
            await sendMessage(selectedCaregiver.id, draftMessage.trim());
            setDraftMessage('');
            loadConversation(selectedCaregiver.id);
        } catch (error) {
            Alert.alert('Chat error', 'Message could not be sent.');
        }
    };

    const handlePredict = async () => {
        if (!selectedPatient) {
            Alert.alert('Analysis Failed', 'Please select a patient to analyze.');
            return;
        }
        try {
            const result = await predictRisk(selectedPatient.id);
            setPredictionResult(result);
        } catch (error) {
            Alert.alert('Prediction Failed', error.response?.data?.detail || 'Make sure ML model is trained.');
        }
    };

    const handlePredictSundowning = async () => {
        if (!selectedPatient) {
            Alert.alert("Analysis Failed", "Please select a patient to analyze.");
            return;
        }
        try {
            const result = await predictRisk(selectedPatient.id);
            setSundownResult(result.sundowning_window);
        } catch (error) {
            Alert.alert("Analysis Error", "Failed to predict sundowning window.");
        }
    };

    const handleLinkPatient = async () => {
        if (!linkPatientEmail.trim()) return;
        try {
            await linkPatientByEmail(linkPatientEmail.trim());
            Alert.alert('Success', 'Patient linked successfully!');
            setLinkPatientEmail('');
            loadDashboardData();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.detail || 'Could not link patient.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>Doctor Dashboard</Text>
            <Text style={styles.subHeader}>
                {currentUser ? `Signed in as Dr. ${currentUser.full_name}` : 'Monitor patients and coordinate with caregivers'}
            </Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Link new patient</Text>
                <View style={styles.messageRow}>
                    <TextInput
                        style={styles.messageInput}
                        value={linkPatientEmail}
                        onChangeText={setLinkPatientEmail}
                        placeholder="Patient email address..."
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TouchableOpacity style={styles.sendButton} onPress={handleLinkPatient}>
                        <Text style={styles.sendText}>Link</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Your patients</Text>
                <FlatList
                    data={patientsWithCaregivers}
                    keyExtractor={(item) => item.id.toString()}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[styles.patientCard, selectedPatient?.id === item.id && styles.patientCardActive]}
                            onPress={() => setSelectedPatient(item)}
                        >
                            <Text style={[styles.patientName, selectedPatient?.id === item.id && styles.patientNameActive]}>
                                {item.full_name}
                            </Text>
                            <Text style={[styles.patientMeta, selectedPatient?.id === item.id && styles.patientMetaActive]}>
                                {item.email}
                            </Text>
                            <Text style={[styles.patientMeta, selectedPatient?.id === item.id && styles.patientMetaActive]}>
                                Caregiver: {item.caregiver ? item.caregiver.full_name : 'Not linked'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No patients are linked to this doctor yet.</Text>}
                />
            </View>

            {selectedPatient && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Patient details</Text>
                    <View style={styles.detailCard}>
                        <Text style={styles.detailLabel}>Patient</Text>
                        <Text style={styles.detailValue}>{selectedPatient.full_name}</Text>
                        <Text style={styles.detailMeta}>{selectedPatient.email}</Text>
                    </View>

                    <View style={styles.detailCard}>
                        <Text style={styles.detailLabel}>Caregiver</Text>
                        {selectedCaregiver ? (
                            <>
                                <Text style={styles.detailValue}>{selectedCaregiver.full_name}</Text>
                                <Text style={styles.detailMeta}>{selectedCaregiver.email}</Text>
                            </>
                        ) : (
                            <Text style={styles.detailMeta}>No caregiver linked to this patient yet.</Text>
                        )}
                    </View>
                </View>
            )}

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Direct caregiver chat</Text>
                {selectedCaregiver ? (
                    <View style={styles.chatCard}>
                        <Text style={styles.chatTitle}>Conversation with {selectedCaregiver.full_name}</Text>
                        <FlatList
                            data={messages}
                            keyExtractor={(item) => item.id.toString()}
                            scrollEnabled={false}
                            renderItem={({ item }) => {
                                const isMine = item.sender_id === currentUser?.id;
                                return (
                                    <View style={[styles.messageBubble, isMine ? styles.mine : styles.theirs]}>
                                        <Text style={[styles.messageText, isMine && styles.mineText]}>{item.content}</Text>
                                    </View>
                                );
                            }}
                            ListEmptyComponent={<Text style={styles.emptyText}>No messages yet. Start with a care update.</Text>}
                        />

                        <View style={styles.messageRow}>
                            <TextInput
                                style={styles.messageInput}
                                value={draftMessage}
                                onChangeText={setDraftMessage}
                                placeholder="Write to caregiver..."
                            />
                            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                                <Text style={styles.sendText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.emptyText}>Select a patient with a linked caregiver to start chatting.</Text>
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Behavioral AI Risk Assessment</Text>

                <TouchableOpacity style={styles.assessButton} onPress={handlePredict}>
                    <Text style={styles.assessText}>Process Telemetry Footprint</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.assessButton, {backgroundColor: '#e67e22', marginTop: 10}]} onPress={handlePredictSundowning}>
                    <Text style={styles.assessText}>Predict Sundowning Window</Text>
                </TouchableOpacity>

                {predictionResult && (
                    <View style={styles.resultCard}>
                        <Text style={styles.resultHeader}>Neural Assessment</Text>
                        <Text style={styles.resultText}>
                            Status: <Text style={styles.resultStrong}>{predictionResult.status}</Text>
                        </Text>
                        <Text style={styles.resultText}>
                            Risk Score: {predictionResult.score}%
                        </Text>
                        <Text style={styles.resultText}>
                            Missed Tasks: {predictionResult.raw_metrics?.missed}
                        </Text>
                    </View>
                )}

                {sundownResult && (
                    <View style={[styles.resultCard, {borderColor: '#ffe0b2', backgroundColor: '#fff4e6'}]}>
                        <Text style={[styles.resultHeader, {color: '#e67e22'}]}>Sundowning Projection</Text>
                        <Text style={[styles.resultText, {color: '#d35400', fontWeight: 'bold'}]}>
                            High Risk Period: {sundownResult}
                        </Text>
                    </View>
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#eef3f8' },
    content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#183153' },
    subHeader: { color: '#667085', marginTop: 6, marginBottom: 18 },
    section: { backgroundColor: 'white', borderRadius: 20, padding: 18, marginBottom: 16 },
    sectionTitle: { fontSize: 19, fontWeight: 'bold', marginBottom: 14, color: '#183153' },
    patientCard: { width: 260, backgroundColor: '#f5f7fb', borderRadius: 16, padding: 16, marginRight: 12 },
    patientCardActive: { backgroundColor: '#183153' },
    patientName: { fontSize: 18, fontWeight: 'bold', color: '#183153' },
    patientNameActive: { color: 'white' },
    patientMeta: { marginTop: 6, color: '#667085' },
    patientMetaActive: { color: '#d7deea' },
    detailCard: { backgroundColor: '#f6f8fc', borderRadius: 16, padding: 14, marginBottom: 12 },
    detailLabel: { fontSize: 12, textTransform: 'uppercase', color: '#667085', marginBottom: 4 },
    detailValue: { fontSize: 18, fontWeight: 'bold', color: '#183153' },
    detailMeta: { marginTop: 4, color: '#667085' },
    emptyText: { color: '#777', textAlign: 'center', marginVertical: 10 },
    chatCard: { backgroundColor: '#f8fafd', borderRadius: 16, padding: 14 },
    chatTitle: { fontWeight: 'bold', color: '#183153', marginBottom: 12 },
    messageBubble: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: '85%' },
    mine: { alignSelf: 'flex-end', backgroundColor: '#183153' },
    theirs: { alignSelf: 'flex-start', backgroundColor: '#dde6f2' },
    messageText: { color: '#183153' },
    mineText: { color: 'white' },
    messageRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
    messageInput: { flex: 1, borderWidth: 1, borderColor: '#d8deea', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white' },
    sendButton: { marginLeft: 10, backgroundColor: '#183153', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
    sendText: { color: 'white', fontWeight: 'bold' },
    label: { fontSize: 15, marginBottom: 5, color: '#333' },
    input: { height: 42, borderColor: '#d8deea', borderWidth: 1, marginBottom: 14, paddingHorizontal: 10, borderRadius: 10, backgroundColor: 'white' },
    assessButton: { backgroundColor: '#0f766e', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
    assessText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    resultCard: { marginTop: 16, backgroundColor: '#e8f4f8', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#b3d4fc' },
    resultHeader: { fontSize: 18, fontWeight: 'bold', color: '#0056b3', marginBottom: 10 },
    resultText: { fontSize: 16, marginBottom: 5 },
    resultStrong: { fontWeight: 'bold', color: 'darkblue' }
});
