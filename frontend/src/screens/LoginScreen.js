import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { login, getUserRole } from '../api/client';

const showGlobalAlert = (title, msg) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
    } else {
        Alert.alert(title, msg);
    }
};

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (customEmail, customPass) => {
        const targetEmail = customEmail || email;
        const targetPass = customPass || password;

        if (!targetEmail || !targetPass) {
            showGlobalAlert('Required Fields', 'Please enter your email address and password.');
            return;
        }

        setLoading(true);
        try {
            await login(targetEmail, targetPass);
            const user = await getUserRole();
            
            showGlobalAlert('✅ Welcome!', `Welcome back, ${user.full_name}!`);
            
            if (user.role === 'Caregiver') {
                navigation.replace('CaregiverDashboard');
            } else if (user.role === 'Doctor') {
                navigation.replace('DoctorDashboard');
            } else {
                navigation.replace('PatientDashboard');
            }
        } catch (error) {
            showGlobalAlert('Login Failed', error.response?.data?.detail || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    const fillPersona = (pEmail, pPass) => {
        setEmail(pEmail);
        setPassword(pPass);
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    {/* Header Branding */}
                    <View style={styles.logoBadge}>
                        <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.logoGradient}>
                            <Text style={styles.logoIcon}>🧠</Text>
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>DementiaCare AI</Text>
                    <Text style={styles.subtitle}>Cognitive Assistant & Care Network</Text>

                    {/* Quick Demo Persona Chips */}
                    <View style={styles.personaSection}>
                        <Text style={styles.personaLabel}>⚡ QUICK LOGIN PERSONAS:</Text>
                        <View style={styles.personaRow}>
                            <TouchableOpacity 
                                style={styles.personaChip} 
                                onPress={() => fillPersona('rachana@patient.com', 'patient123')}
                            >
                                <Text style={styles.personaChipText}>👵 Patient</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.personaChip} 
                                onPress={() => fillPersona('lakshmi@caregiver.com', 'caregiver123')}
                            >
                                <Text style={styles.personaChipText}>🛡️ Caregiver</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={styles.personaChip} 
                                onPress={() => fillPersona('pushpa@doctor.com', 'doctor123')}
                            >
                                <Text style={styles.personaChipText}>🩺 Doctor</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Form Inputs */}
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={22} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email address..."
                                placeholderTextColor="#94a3b8"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <Text style={styles.inputLabel}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={22} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter password..."
                                placeholderTextColor="#94a3b8"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                        
                        <TouchableOpacity 
                            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                            onPress={() => handleLogin()}
                            disabled={loading}
                        >
                            <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.buttonGradient}>
                                <Text style={styles.primaryButtonText}>
                                    {loading ? 'AUTHENTICATING...' : 'LOG IN TO PORTAL'}
                                </Text>
                                <Ionicons name="arrow-forward" size={22} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.secondaryButton} 
                            onPress={() => navigation.navigate('Register')}
                        >
                            <Text style={styles.secondaryButtonText}>Create New Account</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footerSecurity}>
                        <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                        <Text style={styles.footerSecurityText}>256-bit Encrypted Healthcare Session</Text>
                    </View>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { 
        flexGrow: 1, 
        justify: 'center', 
        alignItems: 'center', 
        paddingVertical: 40,
        paddingHorizontal: 20 
    },
    card: {
        width: '100%',
        maxWidth: 480,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 32,
        padding: 36,
        alignItems: 'center',
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 16,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.6)'
    },
    logoBadge: {
        marginBottom: 16,
        borderRadius: 30,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8
    },
    logoGradient: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoIcon: { fontSize: 40 },
    title: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center', letterSpacing: -0.3 },
    subtitle: { fontSize: 12, color: '#6d28d9', marginBottom: 18, fontWeight: '600', textAlign: 'center', marginTop: 3 },
    
    personaSection: {
        width: '100%',
        backgroundColor: '#f8fafc',
        borderRadius: 16,
        padding: 10,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        alignItems: 'center'
    },
    personaLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748b',
        letterSpacing: 0.5,
        marginBottom: 8
    },
    personaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        justifyContent: 'center'
    },
    personaChip: {
        backgroundColor: 'white',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#ddd6fe',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4
    },
    personaChipText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#5b21b6'
    },

    formContainer: { width: '100%' },
    inputLabel: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 6 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderWidth: 1.5,
        borderColor: '#cbd5e1',
        borderRadius: 14,
        paddingHorizontal: 12,
        marginBottom: 14,
        height: 46
    },
    inputIcon: { marginRight: 10 },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 14,
        color: '#0f172a',
        fontWeight: '600'
    },
    primaryButton: { 
        borderRadius: 14, 
        overflow: 'hidden', 
        marginBottom: 12, 
        marginTop: 4,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4
    },
    buttonGradient: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    buttonDisabled: { opacity: 0.7 },
    primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.3 },
    secondaryButton: { 
        backgroundColor: '#f1f5f9', 
        borderWidth: 1.5, 
        borderColor: '#cbd5e1', 
        paddingVertical: 12, 
        borderRadius: 14, 
        alignItems: 'center' 
    },
    secondaryButtonText: { color: '#334155', fontWeight: 'bold', fontSize: 13 },
    footerSecurity: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 24
    },
    footerSecurityText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500'
    }
});
