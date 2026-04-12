import React, { useEffect, useState } from 'react';
import { Alert, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Linking } from 'react-native';
import * as Location from 'expo-location';
import { getUserRole, getUserById, fetchAlerts, fetchConversation, fetchPatients, fetchReminders, sendMessage, linkPatientByEmail, fetchPatientLocation, parseUTC } from '../api/client';

export default function CaregiverDashboard({ navigation }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [patients, setPatients] = useState([]);
    const [alerts, setAlerts] = useState([]);
    const [reminders, setReminders] = useState([]);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draftMessage, setDraftMessage] = useState('');
    const [linkPatientEmail, setLinkPatientEmail] = useState('');
    
    // Modal & Action State
    const [selectedPatientModal, setSelectedPatientModal] = useState(null);
    const [liveLocation, setLiveLocation] = useState(null);
    const [patientPhone, setPatientPhone] = useState('');

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (selectedChatUser) {
            loadConversation(selectedChatUser.id);
        }
    }, [selectedChatUser]);

    const loadDashboardData = async () => {
        try {
            const [user, fetchedPatients, fetchedAlerts, fetchedReminders] = await Promise.all([
                getUserRole(),
                fetchPatients(),
                fetchAlerts(),
                fetchReminders()
            ]);

            const patientIds = new Set(fetchedPatients.map((patient) => patient.id));
            setCurrentUser(user);
            setPatients(fetchedPatients);
            setAlerts(fetchedAlerts.filter((alert) => patientIds.size === 0 || patientIds.has(alert.user_id)));
            setReminders(fetchedReminders.filter((reminder) => patientIds.size === 0 || patientIds.has(reminder.user_id)));

            const doctorIds = [...new Set(fetchedPatients.map((patient) => patient.doctor_id).filter(Boolean))];
            const doctors = await Promise.all(doctorIds.map((doctorId) => getUserById(doctorId)));
            setTeamMembers(doctors);
            if (!selectedChatUser && doctors.length > 0) {
                setSelectedChatUser(doctors[0]);
            }
        } catch (error) {
            console.error('Failed to load caregiver data:', error);
        }
    };

    const loadConversation = async (otherUserId) => {
        try {
            const conversation = await fetchConversation(otherUserId);
            setMessages(conversation);
        } catch (error) {
            console.error('Failed to load messages:', error);
        }
    };
    
    const handleTrackLocation = async (patient) => {
        try {
            const loc = await fetchPatientLocation(patient.id);
            setLiveLocation(loc);
            setSelectedPatientModal(patient);

            if (loc && loc.latitude && loc.longitude) {
                // To drop a pin explicitly named "Patient Location", `geo:` coordinates mapping is used:
                const url = `https://www.google.com/maps/search/?api=1&query=${loc.latitude},${loc.longitude}`;
                Linking.openURL(url).catch(err => {
                    console.error('Could not open map router', err);
                });
            } else {
                Alert.alert("No Location", "Patient hasn't logged an active GPS ping yet.");
            }
        } catch (e) {
            Alert.alert("Error", "Could not fetch location data.");
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

    const handleSendMessage = async () => {
        if (!selectedChatUser || !draftMessage.trim()) return;
        try {
            await sendMessage(selectedChatUser.id, draftMessage.trim());
            setDraftMessage('');
            loadConversation(selectedChatUser.id);
        } catch (error) {
            Alert.alert('Chat error', 'Message could not be sent.');
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.header}>Caregiver Dashboard</Text>
            <Text style={styles.subHeader}>
                {currentUser ? `Welcome, ${currentUser.full_name}` : 'Tracking your assigned patients and doctors'}
            </Text>

            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryNumber}>{patients.length}</Text>
                    <Text style={styles.summaryLabel}>Patients</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryNumber}>{alerts.length}</Text>
                    <Text style={styles.summaryLabel}>Alerts</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryNumber}>{reminders.filter((item) => !item.is_completed).length}</Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                </View>
            </View>

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
                <Text style={styles.sectionTitle}>Assigned patients</Text>
                {patients.length === 0 ? (
                    <Text style={styles.emptyText}>No patients are linked to this caregiver yet.</Text>
                ) : (
                    patients.map((patient) => (
                        <View key={patient.id} style={styles.infoCard}>
                            <Text style={styles.cardTitle}>{patient.full_name}</Text>
                            <Text style={styles.metaText}>{patient.email}</Text>
                            <Text style={styles.metaText}>
                                Doctor ID: {patient.doctor_id ? patient.doctor_id : 'Not assigned'}
                            </Text>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 12}}>
                                <TouchableOpacity style={[styles.trackButton, {flex: 1, marginRight: 5, marginTop: 0}]} onPress={() => handleTrackLocation(patient)}>
                                    <Text style={styles.trackText}>📍 Map</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.trackButton, {flex: 1, marginRight: 5, backgroundColor: '#e8f4f8', marginTop: 0}]} onPress={() => navigation.navigate('Medication')}>
                                    <Text style={[styles.trackText, {color: '#0f766e'}]}>📝 Tasks</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.trackButton, {flex: 1, backgroundColor: '#fdf4ff', marginTop: 0}]} onPress={() => navigation.navigate('AIRisk', { patientId: patient.id })}>
                                    <Text style={[styles.trackText, {color: '#86198f'}]}>🧠 AI Insight</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 8}}>
                                <TouchableOpacity style={[styles.trackButton, {flex: 1, marginRight: 5, backgroundColor: '#25D366', marginTop: 0}]} onPress={() => {
                                    Linking.openURL(`whatsapp://send?text=Emergency check-in: Are you okay?`);
                                }}>
                                    <Text style={[styles.trackText, {color: 'white'}]}>💬 WhatsApp Alert</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.trackButton, {flex: 1, backgroundColor: '#d9534f', marginTop: 0}]} onPress={() => {
                                    Linking.openURL(`mailto:${patient.email}?subject=Emergency Check-in&body=Are you okay?`);
                                }}>
                                    <Text style={[styles.trackText, {color: 'white'}]}>✉️ Email Alert</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent patient alerts</Text>
                <FlatList
                    data={alerts}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                        <View style={styles.alertCard}>
                            <Text style={styles.alertTitle}>{item.alert_type}</Text>
                            <Text>{item.description}</Text>
                            <Text style={styles.timeText}>{parseUTC(item.timestamp).toLocaleString()}</Text>
                        </View>
                    )}
                    ListEmptyComponent={<Text style={styles.emptyText}>No recent alerts.</Text>}
                />
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Care team chat</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                    {teamMembers.map((member) => (
                        <TouchableOpacity
                            key={member.id}
                            style={[styles.chip, selectedChatUser?.id === member.id && styles.chipActive]}
                            onPress={() => setSelectedChatUser(member)}
                        >
                            <Text style={[styles.chipText, selectedChatUser?.id === member.id && styles.chipTextActive]}>
                                Dr. {member.full_name}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {selectedChatUser ? (
                    <View style={styles.chatCard}>
                        <Text style={styles.chatTitle}>Chat with Dr. {selectedChatUser.full_name}</Text>
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
                            ListEmptyComponent={<Text style={styles.emptyText}>No messages yet. Start the conversation.</Text>}
                        />
                        <View style={styles.messageRow}>
                            <TextInput
                                style={styles.messageInput}
                                value={draftMessage}
                                onChangeText={setDraftMessage}
                                placeholder="Write a message..."
                            />
                            <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
                                <Text style={styles.sendText}>Send</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.emptyText}>No doctor is linked to your patients yet.</Text>
                )}
            </View>
            
            {selectedPatientModal && (
                <Modal visible={true} transparent={true} animationType="slide">
                    <View style={styles.modalBg}>
                        <View style={styles.modalCard}>
                            <Text style={styles.modalHeader}>Full Patient Details</Text>
                            <Text style={styles.modalLabel}>Name: <Text style={styles.modalValue}>{selectedPatientModal.full_name}</Text></Text>
                            <Text style={styles.modalLabel}>Email: <Text style={styles.modalValue}>{selectedPatientModal.email}</Text></Text>
                            
                            <View style={styles.modalDivider}/>
                            
                            <Text style={styles.modalHeader}>Live Tracking</Text>
                            {liveLocation && liveLocation.latitude ? (
                                <View style={styles.gpsBox}>
                                    <Text style={styles.gpsLabel}>Lat: {liveLocation.latitude.toFixed(4)}</Text>
                                    <Text style={styles.gpsLabel}>Lng: {liveLocation.longitude.toFixed(4)}</Text>
                                    <Text style={styles.gpsTime}>Last updated: {parseUTC(liveLocation.timestamp).toLocaleTimeString()}</Text>
                                </View>
                            ) : (
                                <Text style={styles.modalValue}>No GPS check-ins yet.</Text>
                            )}

                            <View style={styles.modalDivider}/>

                            <TouchableOpacity 
                                style={[styles.closeButton, {marginTop: 20}]}
                                onPress={() => setSelectedPatientModal(null)}
                            >
                                <Text style={styles.closeText}>Close Window</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}
            
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f4f6fb' },
    content: { padding: 20, paddingTop: 50, paddingBottom: 100 },
    header: { fontSize: 28, fontWeight: 'bold', color: '#1f2a44' },
    subHeader: { color: '#667085', marginTop: 6, marginBottom: 18 },
    summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    summaryCard: { width: '31%', backgroundColor: 'white', borderRadius: 16, padding: 16, alignItems: 'center' },
    summaryNumber: { fontSize: 26, fontWeight: 'bold', color: '#3b5bdb' },
    infoCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, marginBottom: 10 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2a44' },
    metaText: { color: '#667085', marginTop: 4 },
    alertCard: { backgroundColor: '#ffe5e5', padding: 16, borderRadius: 16, marginBottom: 10 },
    alertTitle: { fontSize: 16, fontWeight: 'bold', color: '#d9534f', marginBottom: 4 },
    timeText: { color: '#888', marginTop: 8, fontSize: 12 },
    chipRow: { marginBottom: 12 },
    chip: { backgroundColor: '#e7ecf7', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    chipActive: { backgroundColor: '#3b5bdb' },
    chipText: { color: '#3b5bdb', fontWeight: 'bold' },
    chipTextActive: { color: 'white' },
    chatTitle: { fontWeight: 'bold', color: '#223', marginBottom: 12 },
    messageBubble: { borderRadius: 14, padding: 12, marginBottom: 8, maxWidth: '85%' },
    mine: { alignSelf: 'flex-end', backgroundColor: '#3b5bdb' },
    theirs: { alignSelf: 'flex-start', backgroundColor: '#e7ecf7' },
    messageText: { color: '#24324a' },
    mineText: { color: 'white' },
    messageRow: { flexDirection: 'row', marginTop: 12, alignItems: 'center' },
    messageInput: { flex: 1, borderWidth: 1, borderColor: '#d8deea', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white' },
    sendButton: { marginLeft: 10, backgroundColor: '#3b5bdb', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
    sendText: { color: 'white', fontWeight: 'bold' },
    
    // Tracks and modals
    trackButton: { marginTop: 12, backgroundColor: '#e7ecf7', padding: 10, borderRadius: 8, alignItems: 'center' },
    trackText: { color: '#3b5bdb', fontWeight: 'bold' },
    modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalCard: { width: '100%', backgroundColor: 'white', borderRadius: 20, padding: 24 },
    modalHeader: { fontSize: 20, fontWeight: 'bold', color: '#1f2a44', marginBottom: 15 },
    modalLabel: { color: '#667085', fontSize: 16, marginBottom: 5 },
    modalValue: { fontWeight: 'bold', color: '#333' },
    modalDivider: { height: 1, backgroundColor: '#eee', marginVertical: 15 },
    gpsBox: { backgroundColor: '#f0fdf4', padding: 15, borderRadius: 10, borderWidth: 1, borderColor: '#bbf7d0' },
    gpsLabel: { fontSize: 16, fontWeight: 'bold', color: '#15803d', marginBottom:4 },
    gpsTime: { color: '#166534', fontSize: 13, marginTop: 4 },
    closeButton: { padding: 12, alignItems: 'center' },
    closeText: { color: '#888', fontWeight: 'bold', fontSize: 16 }
});
