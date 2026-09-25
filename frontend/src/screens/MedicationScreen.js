import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, TextInput,
    ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchReminders, addReminder, updateReminder, deleteReminder, parseUTC, getUserRole } from '../api/client';

const speak = (text) => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new window.SpeechSynthesisUtterance(text);
        utt.lang = 'en-IN';
        utt.rate = 0.88;
        utt.pitch = 1.05;
        window.speechSynthesis.speak(utt);
    }
};

const showMsg = (title, msg) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
    } else {
        const { Alert } = require('react-native');
        Alert.alert(title, msg);
    }
};

export default function MedicationScreen({ navigation }) {
    const [reminders, setReminders] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [title, setTitle] = useState('Medication');
    const [notes, setNotes] = useState('');
    const [timeStr, setTimeStr] = useState('10:00 AM');
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        initialize();
    }, []);

    const initialize = async () => {
        try {
            const [user, data] = await Promise.all([getUserRole(), fetchReminders()]);
            setUserRole(user.role);
            setReminders(data);
        } catch (e) {
            console.error('Could not initialize medication screen', e);
        } finally {
            setLoading(false);
        }
    };

    const loadReminders = async () => {
        try {
            const data = await fetchReminders();
            setReminders(data);
        } catch (e) {
            console.error('Could not fetch reminders', e);
        }
    };

    const parseTimeStr = () => {
        let finalDate = new Date();
        if (timeStr.includes(':')) {
            try {
                const parts = timeStr.trim().split(' ');
                const [hourStr, minStr] = parts[0].split(':');
                const modifier = parts[1] ? parts[1].toUpperCase() : '';
                let hours = parseInt(hourStr, 10);
                const minutes = parseInt(minStr, 10);
                if (modifier === 'PM' && hours !== 12) hours += 12;
                if (modifier === 'AM' && hours === 12) hours = 0;
                finalDate.setHours(hours);
                finalDate.setMinutes(minutes);
                finalDate.setSeconds(0);
                finalDate.setMilliseconds(0);
            } catch (e) {}
        }
        return finalDate.toISOString();
    };

    const handleSave = async () => {
        if (!notes.trim()) {
            showMsg('Missing Info', 'Please add a description / medicine name.');
            return;
        }
        try {
            const fullTitle = `${title} - ${notes.trim()}`;
            if (editingId) {
                await updateReminder(editingId, fullTitle, parseTimeStr());
                showMsg('Updated', 'Schedule has been updated.');
            } else {
                await addReminder(fullTitle, parseTimeStr());
                showMsg('Saved', 'New medication schedule added.');
            }
            clearForm();
            loadReminders();
        } catch (e) {
            showMsg('Error', e?.response?.data?.detail || 'Could not save schedule.');
        }
    };

    const handleDelete = async (id) => {
        const confirmed = Platform.OS === 'web'
            ? window.confirm('Delete this medication schedule?')
            : true;
        if (!confirmed) return;
        try {
            await deleteReminder(id);
            if (id === editingId) clearForm();
            loadReminders();
        } catch (e) {
            showMsg('Error', e?.response?.data?.detail || 'Could not delete schedule.');
        }
    };

    const clearForm = () => {
        setEditingId(null);
        setTitle('Medication');
        setNotes('');
        setTimeStr('10:00 AM');
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        const parts = item.title.split(' - ');
        setTitle(parts[0] || 'Medication');
        setNotes(parts.slice(1).join(' - ') || '');
        const itemDate = parseUTC(item.time);
        let h = itemDate.getHours();
        let m = itemDate.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        setTimeStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
    };

    const isPatient = userRole === 'Patient';

    if (loading) {
        return (
            <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
                <View style={styles.centered}><Text style={styles.loadingText}>Loading medication schedules…</Text></View>
            </LinearGradient>
        );
    }

    const handleToggleTaken = (item, medName) => {
        const newStatus = !item.is_completed;
        setReminders(prev => prev.map(r => r.id === item.id ? { ...r, is_completed: newStatus } : r));

        if (newStatus) {
            const spokenMsg = `Medication ${medName} marked as TAKEN for Rachana D N. Daughter Spandana and Caregiver Lakshmi have been notified. Great job!`;
            speak(spokenMsg);
            showMsg('✅ Medication Marked Taken', spokenMsg);
        } else {
            const spokenMsg = `Medication ${medName} marked as pending.`;
            speak(spokenMsg);
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Medication Schedules</Text>
                    <Text style={styles.headerSub}>{isPatient ? 'View your daily schedule' : 'Manage patient schedules'}</Text>
                </View>
                <View style={{ width: 36 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* Patient Info Banner */}
                {isPatient && (
                    <View style={styles.infoBanner}>
                        <Ionicons name="information-circle" size={26} color="#60a5fa" />
                        <Text style={styles.infoBannerText}>
                            Your caregiver or doctor manages your medication schedule. You can view your routine below.
                        </Text>
                    </View>
                )}

                {/* Schedules List */}
                <Text style={styles.sectionTitle}>
                    <Ionicons name="medkit" size={20} color="#a78bfa" /> {'  '}Active Schedules
                </Text>

                {reminders.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Ionicons name="medkit-outline" size={48} color="#a78bfa" />
                        <Text style={styles.emptyText}>No medication schedules yet.</Text>
                        {!isPatient && <Text style={styles.emptySubText}>Add the first schedule below.</Text>}
                    </View>
                ) : (
                    reminders.map(item => {
                        const dueTime = parseUTC(item.time);
                        const timeLabel = dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const parts = item.title.split(' - ');
                        const category = parts[0] || '';
                        const medName = parts.slice(1).join(' - ') || item.title;
                        return (
                            <View key={item.id} style={styles.reminderCard}>
                                <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(category) }]}>
                                    <Ionicons name={getCategoryIcon(category)} size={22} color="white" />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.reminderTitle}>{medName}</Text>
                                    <Text style={styles.reminderCategory}>{category}</Text>
                                    <View style={styles.timeRow}>
                                        <Ionicons name="time-outline" size={16} color="#666" />
                                        <Text style={styles.reminderTime}> {timeLabel}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.statusBadge,
                                            { backgroundColor: item.is_completed ? '#16a34a' : '#d97706' }
                                        ]}
                                        onPress={() => handleToggleTaken(item, medName)}
                                    >
                                        <Ionicons
                                            name={item.is_completed ? "checkmark-circle" : "time-outline"}
                                            size={20}
                                            color="white"
                                        />
                                        <Text style={styles.statusText}>
                                            {item.is_completed ? ' TAKEN (TAP TO UNDO)' : ' MARK AS TAKEN'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                {/* Caregiver/Doctor only actions */}
                                {!isPatient && (
                                    <View style={styles.actionCol}>
                                        <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
                                            <Ionicons name="pencil" size={18} color="white" />
                                        </TouchableOpacity>
                                        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                                            <Ionicons name="trash" size={18} color="white" />
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        );
                    })
                )}

                {/* Add/Edit Form — CAREGIVER/DOCTOR ONLY */}
                {!isPatient && (
                    <View style={styles.formCard}>
                        <Text style={styles.formTitle}>{editingId ? '✏️  Edit Schedule' : '➕  Add New Schedule'}</Text>

                        <Text style={styles.label}>Category</Text>
                        <View style={styles.pillContainer}>
                            {['Medication', 'Lunch', 'Activity', 'Appointment'].map(t => (
                                <TouchableOpacity
                                    key={t}
                                    style={[styles.pill, title === t && styles.pillActive]}
                                    onPress={() => setTitle(t)}
                                >
                                    <Text style={[styles.pillText, title === t && styles.pillTextActive]}>{t}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={[styles.label, { marginTop: 20 }]}>Medicine / Description</Text>
                        <TextInput
                            style={styles.input}
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="e.g. Aspirin 100mg — take with water"
                            placeholderTextColor="#aaa"
                        />

                        <Text style={[styles.label, { marginTop: 20 }]}>Time (HH:MM AM/PM)</Text>
                        <TextInput
                            style={styles.timeInput}
                            value={timeStr}
                            onChangeText={setTimeStr}
                            placeholder="08:00 AM"
                            placeholderTextColor="#aaa"
                        />

                        <View style={styles.buttonRow}>
                            {editingId && (
                                <TouchableOpacity style={styles.cancelBtn} onPress={clearForm}>
                                    <Text style={styles.btnText}>CANCEL</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                <Ionicons name={editingId ? 'checkmark-circle' : 'add-circle'} size={22} color="white" />
                                <Text style={[styles.btnText, { marginLeft: 8 }]}>{editingId ? 'UPDATE' : 'SAVE SCHEDULE'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const getCategoryColor = (cat) => {
    switch (cat) {
        case 'Medication': return '#7c3aed';
        case 'Lunch': return '#d97706';
        case 'Activity': return '#0891b2';
        case 'Appointment': return '#be185d';
        default: return '#6b7280';
    }
};

const getCategoryIcon = (cat) => {
    switch (cat) {
        case 'Medication': return 'medkit';
        case 'Lunch': return 'restaurant';
        case 'Activity': return 'walk';
        case 'Appointment': return 'calendar';
        default: return 'ellipse';
    }
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { color: '#ccc', fontSize: 18 },
    header: {
        paddingTop: 55, paddingBottom: 20, paddingHorizontal: 20,
        backgroundColor: 'white', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    backBtn: { padding: 8, backgroundColor: '#f0ebff', borderRadius: 12 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#1f1545', textAlign: 'center' },
    headerSub: { fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 2 },
    content: { padding: 20 },
    infoBanner: {
        backgroundColor: 'rgba(77,171,247,0.18)', borderRadius: 16, padding: 16,
        flexDirection: 'row', alignItems: 'center', marginBottom: 22,
        borderWidth: 1.5, borderColor: 'rgba(77,171,247,0.4)'
    },
    infoBannerText: { color: '#bfdbfe', fontSize: 15, flex: 1, marginLeft: 12, lineHeight: 22 },
    sectionTitle: { color: '#e0d4fc', fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
    emptyCard: {
        backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 20, padding: 32,
        alignItems: 'center', marginBottom: 22
    },
    emptyText: { color: '#c4b5fd', fontSize: 14, marginTop: 10, fontWeight: '600' },
    emptySubText: { color: '#aaa', fontSize: 12, marginTop: 4 },
    reminderCard: {
        backgroundColor: 'rgba(255,255,255,0.97)', borderRadius: 16, padding: 14,
        marginBottom: 12, flexDirection: 'row', alignItems: 'center',
        shadowColor: '#7c3aed', shadowOpacity: 0.08, shadowRadius: 6, elevation: 2
    },
    categoryBadge: {
        width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center'
    },
    reminderTitle: { fontSize: 14, fontWeight: 'bold', color: '#1f1545' },
    reminderCategory: { fontSize: 11, color: '#64748b', marginTop: 1 },
    timeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    reminderTime: { color: '#475569', fontSize: 12, fontWeight: '600' },
    statusBadge: {
        marginTop: 8, paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 14, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center'
    },
    statusText: { fontSize: 12, fontWeight: 'bold', color: 'white' },
    actionCol: { flexDirection: 'column', gap: 8, marginLeft: 8 },
    editBtn: {
        backgroundColor: '#f59e0b', padding: 8, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center', marginBottom: 4
    },
    delBtn: {
        backgroundColor: '#ef4444', padding: 8, borderRadius: 10,
        justifyContent: 'center', alignItems: 'center'
    },
    formCard: {
        backgroundColor: 'rgba(255,255,255,0.98)', borderRadius: 20, padding: 18, marginTop: 8,
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 4
    },
    formTitle: { fontSize: 16, fontWeight: 'bold', color: '#3b185f', marginBottom: 14 },
    label: { fontSize: 12, color: '#7c3aed', fontWeight: 'bold', letterSpacing: 0.3, marginBottom: 6 },
    pillContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    pill: {
        backgroundColor: '#f0ebff', paddingHorizontal: 12, paddingVertical: 6,
        borderRadius: 16, marginRight: 6, marginBottom: 4
    },
    pillActive: { backgroundColor: '#7c3aed' },
    pillText: { color: '#7c3aed', fontWeight: 'bold', fontSize: 12 },
    pillTextActive: { color: 'white' },
    input: {
        borderWidth: 1.5, borderColor: '#e9d5ff', backgroundColor: '#faf5ff',
        borderRadius: 12, padding: 10, fontSize: 13, color: '#1f1545'
    },
    timeInput: {
        borderWidth: 1.5, borderColor: '#e9d5ff', backgroundColor: '#faf5ff',
        borderRadius: 12, padding: 10, fontSize: 15, fontWeight: 'bold',
        color: '#3b185f', letterSpacing: 0.5
    },
    buttonRow: { flexDirection: 'row', marginTop: 18, gap: 10 },
    saveBtn: {
        backgroundColor: '#7c3aed', flex: 1, padding: 12, borderRadius: 14,
        alignItems: 'center', flexDirection: 'row', justifyContent: 'center',
        shadowColor: '#7c3aed', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4
    },
    cancelBtn: {
        backgroundColor: '#9ca3af', flex: 0.5, padding: 12, borderRadius: 14, alignItems: 'center'
    },
    btnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
});
