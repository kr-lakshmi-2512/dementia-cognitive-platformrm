import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
    fetchReminders,
    triggerPanicAlert,
    completeReminder,
    missReminder,
    checkInLocation,
    analyzeBehavior,
    parseUTC,
    getUserRole
} from '../api/client';

export default function PatientDashboard({ navigation }) {
    const [reminders, setReminders] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [quote, setQuote] = useState("Every day is a fresh beginning.");

    const QUOTES = [
        "Every day is a fresh beginning.",
        "Your journey is beautiful.",
        "Take it one step at a time.",
        "You are surrounded by people who care.",
        "Breathe. You are safe and loved."
    ];

    const modules = [
        { title: 'Calendar', icon: 'calendar', target: 'Calendar' },
        { title: 'Medication', icon: 'medkit', target: 'Medication' },
        { title: 'Photos', icon: 'image', target: 'Photos' },
        { title: 'Notes', icon: 'document-text', target: 'Notes' },
        { title: 'Contacts', icon: 'people', target: 'Contacts' }
    ];

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const user = await getUserRole();
            setCurrentUser(user);
            setQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
            
            const data = await fetchReminders();
            setReminders(data);
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        }
    };



    const handleComplete = async (id) => {
        try {
            await completeReminder(id);
            loadDashboard();
        } catch (error) {
            Alert.alert('Error', 'Could not complete reminder.');
        }
    };

    const handleMiss = async (id) => {
        try {
            await missReminder(id);
            loadDashboard();
            Alert.alert('Status Logged', 'We let your caretaker know you missed this.');
        } catch (error) {
            Alert.alert('Error', 'Could not update reminder.');
        }
    };

    const handleLocationCheckIn = async () => {
        try {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Please allow location tracking for your care team.');
                return;
            }
            const myLoc = await Location.getCurrentPositionAsync({});
            await checkInLocation(myLoc.coords.latitude, myLoc.coords.longitude);
            Alert.alert('Check-In', 'Your live location has been logged securely.');
        } catch (error) {
            Alert.alert('Error', 'Failed to update location.');
        }
    };

    const handleAnalyze = async () => {
        try {
            const result = await analyzeBehavior();
            // result is the ML predictive matrix payload
            const lines = result.insights && result.insights.length > 0 
                ? result.insights.join("\n") 
                : "Your behavioral pattern is highly stable.";
                
            Alert.alert(
                `🧠 Cognitive Status: ${result.status}`, 
                `AI Decline Risk Score: ${result.score || 0}%\n\n${lines}`
            );
        } catch (error) {
            Alert.alert('Analysis', 'Could not run logic analysis at this moment.');
        }
    };

    const handlePanic = async () => {
        try {
            await triggerPanicAlert();
            Alert.alert('Emergency', 'Caregiver has been notified!');
        } catch (error) {
            Alert.alert('Error', 'Could not send panic alert.');
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroCard}>
                    <Text style={styles.header}>Hello {currentUser ? currentUser.full_name : 'Patient'}!</Text>
                    <Text style={styles.subtext}>&quot;{quote}&quot;</Text>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Today&apos;s reminders</Text>
                    <FlatList
                        data={reminders}
                        keyExtractor={(item) => item.id.toString()}
                        scrollEnabled={false}
                        renderItem={({ item }) => (
                            <View style={styles.reminderCard}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.title}>{item.title}</Text>
                                    <Text style={styles.timeText}>{parseUTC(item.time).toLocaleString()}</Text>
                                    <Text style={{ color: item.is_completed ? 'green' : 'orange', fontWeight: 'bold' }}>
                                        {item.is_completed ? 'Completed / Cleared' : 'Pending'}
                                    </Text>
                                </View>
                                {!item.is_completed && (
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity style={styles.missButton} onPress={() => handleMiss(item.id)}>
                                            <Text style={styles.missText}>Missed</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.completeButton} onPress={() => handleComplete(item.id)}>
                                            <Text style={styles.completeText}>Done</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        )}
                        ListEmptyComponent={<Text style={styles.emptyText}>No reminders yet.</Text>}
                    />
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Quick actions</Text>
                    <View style={styles.grid}>
                        <TouchableOpacity style={[styles.gridButton, { backgroundColor: '#4dabf7' }]} onPress={handleLocationCheckIn}>
                            <Text style={styles.gridButtonText}>Check In</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.gridButton, { backgroundColor: '#a61e4d' }]} onPress={handleAnalyze}>
                            <Text style={styles.gridButtonText}>Analyze Day</Text>
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.panicButton} onPress={handlePanic}>
                        <Text style={styles.panicText}>PANIC (SOS)</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.sectionCard}>
                    <Text style={styles.sectionTitle}>Explore tools</Text>
                    <View style={styles.moduleGrid}>
                        {modules.map((mod) => (
                            <TouchableOpacity
                                key={mod.title}
                                style={styles.moduleCard}
                                onPress={() => navigation.navigate(mod.target)}
                            >
                                <Ionicons name={mod.icon} size={24} color="#3b185f" />
                                <Text style={styles.moduleText}>{mod.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 20, paddingBottom: 100 },
    heroCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginTop: 50, marginBottom: 16 },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: '#333' },
    subtext: { fontSize: 14, color: '#666', marginBottom: 16 },
    addRow: { flexDirection: 'row' },
    input: { flex: 1, height: 44, borderColor: '#ddd', borderWidth: 1, paddingHorizontal: 12, borderRadius: 10, backgroundColor: 'white' },
    addButton: { backgroundColor: '#28a745', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 10, marginLeft: 10 },
    buttonText: { color: 'white', fontWeight: 'bold' },
    sectionCard: { backgroundColor: 'white', borderRadius: 24, padding: 20, marginBottom: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14, color: '#222' },
    reminderCard: { backgroundColor: '#f8f9fb', padding: 15, borderRadius: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    title: { fontSize: 17, fontWeight: 'bold' },
    timeText: { color: '#666', marginVertical: 4 },
    completeButton: { backgroundColor: '#eee', padding: 10, borderRadius: 8, marginLeft: 10 },
    completeText: { color: '#007bff', fontWeight: 'bold' },
    missButton: { backgroundColor: '#ffe5e5', padding: 10, borderRadius: 8 },
    missText: { color: '#dc3545', fontWeight: 'bold' },
    emptyText: { color: '#777', textAlign: 'center', marginVertical: 10 },
    grid: { flexDirection: 'row', justifyContent: 'space-between' },
    gridButton: { flex: 1, padding: 15, borderRadius: 14, alignItems: 'center', marginHorizontal: 5 },
    gridButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    panicButton: { backgroundColor: 'red', padding: 18, borderRadius: 14, alignItems: 'center', marginTop: 14 },
    panicText: { color: 'white', fontWeight: 'bold', fontSize: 20 },
    moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    moduleCard: { width: '48%', backgroundColor: '#f3eef9', borderRadius: 16, padding: 16, marginBottom: 12, alignItems: 'center' },
    moduleText: { marginTop: 8, fontWeight: '600', color: '#3b185f' }
});
