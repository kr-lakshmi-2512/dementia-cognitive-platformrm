import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { logout } from '../api/client';

export default function SettingsScreen({ navigation }) {
    const handleLogout = async () => {
        await logout();
        navigation.replace('Login');
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Settings</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.card}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="settings" size={60} color="#3b185f" />
                    </View>
                    <Text style={styles.title}>Settings</Text>
                    <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                        <Text style={styles.logoutText}>LOGOUT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 60, paddingBottom: 20, backgroundColor: 'white', alignItems: 'center', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, padding: 20, justifyContent: 'center' },
    card: { backgroundColor: 'white', borderRadius: 20, padding: 40, alignItems: 'center', elevation: 5 },
    iconContainer: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 40 },
    logoutBtn: { width: '100%', borderWidth: 1, borderColor: '#eee', padding: 15, borderRadius: 10, alignItems: 'center' },
    logoutText: { color: '#3b5bdb', fontWeight: 'bold', fontSize: 16 }
});
