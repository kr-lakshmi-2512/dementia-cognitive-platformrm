import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchReminders } from '../api/client';

export default function MainDashboard({ navigation }) {
    const [pendingTasks, setPendingTasks] = useState(0);

    const modules = [
        { title: 'Calendar', icon: 'calendar', target: 'Calendar', subtitle: 'Explore now' },
        { title: 'Medication', icon: 'medkit', target: 'Medication', subtitle: 'Explore now' },
        { title: 'Photos', icon: 'image', target: 'Photos', subtitle: 'Explore now' },
        { title: 'Notes', icon: 'document-text', target: 'Notes', subtitle: 'Explore now' },
        { title: 'Contacts', icon: 'people', target: 'Contacts', subtitle: 'Explore now' }
    ];

    useEffect(() => {
        const checkTasks = async () => {
            try {
                const data = await fetchReminders();
                const count = data.filter(t => !t.is_completed).length;
                setPendingTasks(count);
            } catch (err) {}
        };
        
        checkTasks();
        const intv = setInterval(checkTasks, 5000);
        return () => clearInterval(intv);
    }, []);

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Dashboard</Text>
            </View>
            <ScrollView contentContainerStyle={styles.scroll}>
                
                {pendingTasks > 0 && (
                    <View style={styles.alertBanner}>
                        <Ionicons name="notifications" size={24} color="white" />
                        <Text style={styles.alertText}>You have {pendingTasks} pending tasks scheduled by your Caretaker!</Text>
                        <TouchableOpacity style={styles.viewBtn} onPress={() => navigation.navigate('Calendar')}>
                            <Text style={styles.viewBtnText}>VIEW</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {modules.map((mod, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={styles.card} 
                        onPress={() => navigation.navigate(mod.target)}
                    >
                        <View style={styles.iconContainer}>
                            <Ionicons name={mod.icon} size={36} color="#3b185f" />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={styles.cardTitle}>{mod.title}</Text>
                            <Text style={styles.cardSubtitle}>{mod.subtitle}</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, alignItems: 'center', backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    scroll: { padding: 20, paddingBottom: 100 },
    alertBanner: { backgroundColor: '#ff6b6b', borderRadius: 15, padding: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center', elevation: 5 },
    alertText: { flex: 1, color: 'white', fontWeight: 'bold', marginLeft: 10, marginRight: 10 },
    viewBtn: { backgroundColor: 'rgba(255,255,255,0.3)', paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20 },
    viewBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    card: { 
        backgroundColor: 'white', 
        borderRadius: 20, 
        padding: 20, 
        marginBottom: 20, 
        flexDirection: 'row', 
        alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    iconContainer: {
        width: 60, height: 60, borderRadius: 30, backgroundColor: '#f0e6fa', justifyContent: 'center', alignItems: 'center', marginRight: 20
    },
    textContainer: { flex: 1 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#111' },
    cardSubtitle: { fontSize: 13, color: '#888', marginTop: 5 }
});
