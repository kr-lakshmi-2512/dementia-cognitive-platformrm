import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchReminders, addReminder, updateReminder, deleteReminder, parseUTC } from '../api/client';

export default function MedicationScreen({ navigation }) {
    const [reminders, setReminders] = useState([]);
    const [title, setTitle] = useState('Medication');
    const [notes, setNotes] = useState('Take Pills');
    const [timeStr, setTimeStr] = useState('10:00 AM');
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadReminders();
    }, []);

    const loadReminders = async () => {
        try {
            const data = await fetchReminders();
            setReminders(data);
        } catch (e) {
            console.error("Could not fetch reminders", e);
        }
    };

    const parseTimeStr = () => {
        let finalDate = new Date();
        if (timeStr.includes(':')) {
            try {
                const [time, modifier] = timeStr.trim().split(' ');
                let [hours, minutes] = time.split(':');
                hours = parseInt(hours, 10);
                minutes = parseInt(minutes, 10);
                
                if (hours === 12) hours = 0;
                if (modifier && modifier.toUpperCase() === 'PM') {
                    hours += 12;
                }
                finalDate.setHours(hours);
                finalDate.setMinutes(minutes);
                finalDate.setSeconds(0);
                finalDate.setMilliseconds(0);
            } catch (e) {}
        }
        return finalDate.toISOString();
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateReminder(editingId, title + " - " + notes, parseTimeStr());
            } else {
                await addReminder(title + " - " + notes, parseTimeStr());
            }
            clearForm();
            loadReminders();
        } catch (e) {
            Alert.alert("Error", "Could not save task.");
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteReminder(id);
            if (id === editingId) clearForm();
            loadReminders();
        } catch (e) {
            Alert.alert("Error", "Could not delete task.");
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
        setTitle(parts[0] || '');
        setNotes(parts[1] || '');
        const itemDate = parseUTC(item.time);
        let h = itemDate.getHours();
        let m = itemDate.getMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        setTimeStr(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`);
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Manage Tasks</Text>
                <View style={{width: 24}}/>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                
                {/* Current Reminders List */}
                <Text style={styles.sectionTitle}>Active Reminders</Text>
                {reminders.length === 0 ? <Text style={styles.emptyText}>No reminders scheduled.</Text> : null}
                {reminders.map(item => (
                    <View key={item.id} style={styles.reminderCard}>
                        <View style={{flex: 1}}>
                            <Text style={styles.reminderTitle}>{item.title}</Text>
                            <Text style={styles.reminderTime}>{parseUTC(item.time).toLocaleTimeString()}</Text>
                        </View>
                        <TouchableOpacity style={styles.editBtn} onPress={() => startEdit(item)}>
                            <Ionicons name="pencil" size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(item.id)}>
                            <Ionicons name="trash" size={16} color="white" />
                        </TouchableOpacity>
                    </View>
                ))}

                <View style={[styles.card, {marginTop: 20}]}>
                    <Text style={styles.label}>{editingId ? "Edit Task" : "Add New Task"}</Text>
                    
                    <View style={styles.pillContainer}>
                        <TouchableOpacity style={[styles.pill, title === 'Medication' && styles.pillActive]} onPress={() => setTitle('Medication')}>
                            <Text style={[styles.pillText, title === 'Medication' && styles.pillTextActive]}>Medication</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.pill, title === 'Lunch' && styles.pillActive]} onPress={() => setTitle('Lunch')}>
                            <Text style={[styles.pillText, title === 'Lunch' && styles.pillTextActive]}>Lunch</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.pill, title === 'Activity' && styles.pillActive]} onPress={() => setTitle('Activity')}>
                            <Text style={[styles.pillText, title === 'Activity' && styles.pillTextActive]}>Activity</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={[styles.label, {marginTop: 20}]}>Notes / Details</Text>
                    <TextInput 
                        style={styles.input}
                        value={notes}
                        onChangeText={setNotes}
                        placeholder="e.g. Take with water"
                    />

                    <Text style={[styles.label, {marginTop: 20}]}>Times (HH:MM AM/PM)</Text>
                    <TextInput
                        style={styles.timeInput}
                        value={timeStr}
                        onChangeText={setTimeStr}
                        placeholder="10:00 AM"
                    />

                    <View style={styles.buttonRow}>
                        {editingId && (
                            <TouchableOpacity style={styles.cancelBtn} onPress={clearForm}>
                                <Text style={styles.btnText}>CANCEL</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={styles.updateBtn} onPress={handleSave}>
                            <Text style={styles.btnText}>{editingId ? "UPDATE" : "SAVE"}</Text>
                        </TouchableOpacity>
                    </View>
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
    sectionTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
    emptyText: { color: '#ccc', marginBottom: 10 },
    reminderCard: { backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    reminderTitle: { fontWeight: 'bold', fontSize: 16, color: '#333' },
    reminderTime: { color: '#666', marginTop: 4 },
    editBtn: { backgroundColor: '#f5a623', padding: 10, borderRadius: 8, marginRight: 8 },
    delBtn: { backgroundColor: '#ff6b6b', padding: 10, borderRadius: 8 },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
    label: { fontSize: 13, color: '#888', fontWeight: 'bold' },
    pillContainer: { flexDirection: 'row', marginTop: 10 },
    pill: { backgroundColor: '#f0f0f0', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10 },
    pillActive: { backgroundColor: '#4dabf7' },
    pillText: { color: '#666', fontWeight: 'bold' },
    pillTextActive: { color: 'white' },
    input: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5, marginTop: 5, fontSize: 16 },
    timeInput: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 5, marginTop: 5, fontSize: 16, fontWeight: 'bold' },
    buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
    updateBtn: { backgroundColor: '#3b5bdb', flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginLeft: 5 },
    cancelBtn: { backgroundColor: '#888', flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginRight: 5 },
    btnText: { color: 'white', fontWeight: 'bold' }
});
