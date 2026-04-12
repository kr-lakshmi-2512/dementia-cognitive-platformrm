import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchReminders, parseUTC } from '../api/client';

export default function CalendarScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);

    useEffect(() => {
        loadTasks();
    }, []);

    const loadTasks = async () => {
        const data = await fetchReminders();
        // Sort chronologically
        const sorted = data.sort((a, b) => parseUTC(a.time).getTime() - parseUTC(b.time).getTime());
        setTasks(sorted);
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Daily Outlook</Text>
                <View style={{width: 24}}/>
            </View>

            <View style={styles.content}>
                <View style={styles.card}>
                    <Text style={styles.subtitle}>Today's Schedule</Text>
                    <FlatList
                        data={tasks}
                        keyExtractor={(item) => item.id.toString()}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }) => (
                            <View style={styles.timelineRow}>
                                {/* Timeline Column */}
                                <View style={styles.timeColumn}>
                                    <Text style={styles.timeText}>{parseUTC(item.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                                </View>

                                {/* Mapping line */}
                                <View style={styles.lineColumn}>
                                    <View style={[styles.dot, item.is_completed && styles.dotCompleted]} />
                                    {index !== tasks.length - 1 && <View style={styles.line} />}
                                </View>

                                {/* Agenda Card */}
                                <View style={[styles.agendaCard, item.is_completed && styles.agendaCompleted]}>
                                    <Text style={[styles.agendaTitle, item.is_completed && styles.agendaTitleCompleted]}>{item.title}</Text>
                                    <Text style={styles.agendaStatus}>{item.is_completed ? 'Completed' : 'Scheduled'}</Text>
                                </View>
                            </View>
                        )}
                        ListEmptyComponent={<Text style={{textAlign: 'center', marginTop: 40, color:'#888'}}>Looks like a free day!</Text>}
                    />
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, padding: 20 },
    card: { backgroundColor: 'white', borderRadius: 24, padding: 20, flex: 1, elevation: 2 },
    subtitle: { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 20 },
    timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
    timeColumn: { width: 75, alignItems: 'center', paddingTop: 10 },
    timeText: { fontSize: 13, fontWeight: 'bold', color: '#666' },
    lineColumn: { width: 30, alignItems: 'center' },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#ccc', zIndex: 10, marginTop: 12 },
    dotCompleted: { backgroundColor: '#4dabf7' },
    line: { width: 2, height: '100%', backgroundColor: '#eee', position: 'absolute', top: 20, bottom: 0 },
    agendaCard: { flex: 1, backgroundColor: '#f8f9fa', borderRadius: 12, padding: 16, marginBottom: 16, marginLeft: 5 },
    agendaCompleted: { backgroundColor: '#f1f8ff', opacity: 0.7 },
    agendaTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
    agendaTitleCompleted: { textDecorationLine: 'line-through', color: '#888' },
    agendaStatus: { fontSize: 12, color: '#888', marginTop: 6, fontWeight: '500' }
});
