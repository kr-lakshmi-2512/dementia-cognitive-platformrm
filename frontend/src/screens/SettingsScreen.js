import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getUserRole, logout } from '../api/client';

export default function SettingsScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [highContrast, setHighContrast] = useState(true);
    const [gpsTracking, setGpsTracking] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        try {
            const userData = await getUserRole();
            setUser(userData);
        } catch (e) {
            console.error('Could not fetch user profile', e);
        }
    };

    const handleLogout = async () => {
        await logout();
        if (Platform.OS === 'web') {
            window.alert('Logged out safely.');
        } else {
            Alert.alert('Logged Out', 'You have been logged out.');
        }
        navigation.replace('Login');
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0f172a', '#1e1b4b']} style={styles.header}>
                <View style={styles.profileBadgeRow}>
                    <View style={styles.avatarCircle}>
                        <Text style={styles.avatarText}>
                            {user?.full_name ? user.full_name.charAt(0).toUpperCase() : '👤'}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>{user?.full_name || 'Account User'}</Text>
                        <Text style={styles.userEmail}>{user?.email || 'user@dementiacare.ai'}</Text>
                        <View style={styles.roleTag}>
                            <Ionicons name="shield-checkmark" size={14} color="#34d399" />
                            <Text style={styles.roleTagText}>{user?.role || 'Patient'} Account</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Account Details Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👤 Profile & Account</Text>

                    <View style={styles.infoRow}>
                        <Ionicons name="person-outline" size={20} color="#6d28d9" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.infoLabel}>Full Name</Text>
                            <Text style={styles.infoValue}>{user?.full_name || 'Loading...'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="mail-outline" size={20} color="#6d28d9" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.infoLabel}>Email Address</Text>
                            <Text style={styles.infoValue}>{user?.email || 'Loading...'}</Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="key-outline" size={20} color="#6d28d9" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.infoLabel}>Role Permissions</Text>
                            <Text style={styles.infoValue}>{user?.role || 'Patient'} Access</Text>
                        </View>
                    </View>
                </View>

                {/* Accessibility & Voice Preferences */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>⚙️ Accessibility & Preferences</Text>

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitle}>Voice Companion Speech</Text>
                            <Text style={styles.switchSub}>Speak medication & reassurance aloud</Text>
                        </View>
                        <Switch value={voiceEnabled} onValueChange={setVoiceEnabled} trackColor={{ true: '#6d28d9' }} />
                    </View>

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitle}>High Contrast Accessibility</Text>
                            <Text style={styles.switchSub}>Enhanced readability for elderly users</Text>
                        </View>
                        <Switch value={highContrast} onValueChange={setHighContrast} trackColor={{ true: '#6d28d9' }} />
                    </View>

                    <View style={styles.switchRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.switchTitle}>Real-Time GPS Safe Zone</Text>
                            <Text style={styles.switchSub}>Continuous telemetry check-in</Text>
                        </View>
                        <Switch value={gpsTracking} onValueChange={setGpsTracking} trackColor={{ true: '#10b981' }} />
                    </View>
                </View>

                {/* Care Team Network Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👥 Linked Care Network</Text>
                    <View style={styles.teamItem}>
                        <Ionicons name="heart" size={22} color="#ec4899" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.teamName}>Spandana</Text>
                            <Text style={styles.teamRole}>Daughter & Memory Companion</Text>
                        </View>
                    </View>

                    <View style={styles.teamItem}>
                        <Ionicons name="shield-checkmark" size={22} color="#10b981" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.teamName}>Lakshmi K R</Text>
                            <Text style={styles.teamRole}>Primary Caregiver</Text>
                        </View>
                    </View>

                    <View style={styles.teamItem}>
                        <Ionicons name="medkit" size={22} color="#2563eb" />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                            <Text style={styles.teamName}>Dr. Pushpa H C</Text>
                            <Text style={styles.teamRole}>Attending Neurologist</Text>
                        </View>
                    </View>
                </View>

                {/* Logout Button */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.logoutGradient}>
                        <Ionicons name="log-out-outline" size={22} color="white" />
                        <Text style={styles.logoutButtonText}>LOG OUT OF ACCOUNT</Text>
                    </LinearGradient>
                </TouchableOpacity>

                <View style={styles.appFooter}>
                    <Text style={styles.appFooterText}>DementiaCare AI Platform • Version 2.5.0</Text>
                    <Text style={styles.appFooterSub}>Encrypted Healthcare Network</Text>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8fafc' },
    header: {
        paddingTop: 55,
        paddingBottom: 24,
        paddingHorizontal: 20,
        borderBottomLeftRadius: 28,
        borderBottomRightRadius: 28,
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)'
    },
    profileBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16
    },
    avatarCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        alignItems: 'center',
        justifyContent: 'center'
    },
    avatarText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold'
    },
    userName: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold'
    },
    userEmail: {
        color: '#cbd5e1',
        fontSize: 12,
        marginTop: 2
    },
    roleTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 6,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)'
    },
    roleTagText: {
        color: '#34d399',
        fontSize: 11,
        fontWeight: 'bold'
    },

    scrollContent: {
        padding: 16,
        paddingBottom: 110
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 3
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0f172a',
        marginBottom: 12
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    infoLabel: {
        fontSize: 11,
        color: '#64748b',
        fontWeight: '600'
    },
    infoValue: {
        fontSize: 13,
        color: '#0f172a',
        fontWeight: '700',
        marginTop: 1
    },

    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9'
    },
    switchTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a'
    },
    switchSub: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 1
    },

    teamItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        padding: 10,
        borderRadius: 14,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0'
    },
    teamName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#0f172a'
    },
    teamRole: {
        fontSize: 11,
        color: '#64748b',
        marginTop: 1
    },

    logoutButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 6,
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4
    },
    logoutGradient: {
        paddingVertical: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    logoutButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13,
        letterSpacing: 0.3
    },

    appFooter: {
        alignItems: 'center',
        marginTop: 18
    },
    appFooterText: {
        fontSize: 11,
        color: '#94a3b8',
        fontWeight: '600'
    },
    appFooterSub: {
        fontSize: 10,
        color: '#cbd5e1',
        marginTop: 1
    }
});
