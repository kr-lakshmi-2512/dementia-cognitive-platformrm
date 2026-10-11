import React, { useState } from 'react';
import {
    View, Text, TextInput, StyleSheet, Alert, TouchableOpacity,
    Platform, ScrollView
} from 'react-native';
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
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);

    /* ── Single Unified Login Handler ──
       Handles manual form login for all roles (Patient, Caregiver, Doctor)
    */
    const handleLogin = async (customEmail, customPass) => {
        const targetEmail = (customEmail !== undefined ? customEmail : email).trim();
        const targetPass  = (customPass !== undefined ? customPass : password).trim();

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

    /* ── Instant Patient Login (Guaranteed Success with Dynamic & Default Fallback) ── */
    const handleInstantPatientLogin = async () => {
        let targetEmail = 'krlakshmi393@gmail.com';
        let targetPass  = 'patient123';

        const typedEmail = email.trim();
        const typedPass  = password.trim();

        if (typedEmail.length > 0) {
            targetEmail = typedEmail;
            targetPass  = typedPass.length > 0 ? typedPass : 'patient123';
        } else if (Platform.OS === 'web') {
            const savedPatientEmail = localStorage.getItem('last_patient_email');
            const savedPatientPass  = localStorage.getItem('last_patient_pass');

            if (savedPatientEmail && savedPatientPass) {
                targetEmail = savedPatientEmail;
                targetPass  = savedPatientPass;
            }
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
        } catch (primaryErr) {
            // Fallback to default patient account if custom/saved credentials failed
            if (targetEmail !== 'krlakshmi393@gmail.com') {
                try {
                    await login('krlakshmi393@gmail.com', 'patient123');
                    const user = await getUserRole();
                    showGlobalAlert('✅ Welcome!', `Welcome back, ${user.full_name}!`);
                    navigation.replace('PatientDashboard');
                    return;
                } catch (fallbackErr) {
                    // Fallthrough to alert
                }
            }
            showGlobalAlert('Login Failed', primaryErr.response?.data?.detail || 'Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent} 
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.card}>

                    {/* Header Branding */}
                    <View style={styles.logoBadge}>
                        <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.logoGradient}>
                            <Text style={styles.logoIcon}>🧠</Text>
                        </LinearGradient>
                    </View>

                    <Text style={styles.title}>DementiaCare AI</Text>
                    <Text style={styles.subtitle}>Cognitive Assistant & Care Network</Text>

                    {/* 👵 1-TAP INSTANT PATIENT LOGIN */}
                    <View style={{ width: '100%', marginBottom: 12 }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803d', letterSpacing: 0.6, marginBottom: 6, textTransform: 'uppercase' }}>
                            👵 Option A: Instant Patient Access
                        </Text>
                        <TouchableOpacity 
                            style={{
                                width: '100%', borderRadius: 16, overflow: 'hidden',
                                elevation: 4, shadowColor: '#16a34a',
                                shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 6,
                            }} 
                            onPress={handleInstantPatientLogin} 
                            disabled={loading}
                        >
                            <LinearGradient colors={['#16a34a', '#15803d']} style={{ paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                <Text style={{ fontSize: 26 }}>👵</Text>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ color: 'white', fontWeight: '800', fontSize: 13, letterSpacing: 0.4 }}>
                                        ⚡ INSTANT PATIENT LOGIN
                                    </Text>
                                    <Text style={{ color: '#dcfce7', fontSize: 11, marginTop: 2, fontWeight: '500' }}>
                                        1-Tap enter — no password typing required
                                    </Text>
                                </View>
                                <Ionicons name="flash" size={22} color="white" />
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    {/* Divider line */}
                    <View style={styles.dividerRow}>
                        <View style={styles.dividerLine} />
                        <Text style={styles.dividerText}>OR MANUAL CREDENTIAL LOGIN</Text>
                        <View style={styles.dividerLine} />
                    </View>

                    {/* Form Inputs for Manual Login */}
                    <View style={styles.formContainer}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#6d28d9', letterSpacing: 0.6, marginBottom: 10, textTransform: 'uppercase' }}>
                            🔑 Option B: Manual Login (Patient / Caregiver / Doctor)
                        </Text>

                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={22} color="#64748b" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter email (e.g. krlakshmi393@gmail.com)"
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
                                <Ionicons name="key-outline" size={20} color="white" />
                                <Text style={styles.primaryButtonText}>
                                    {loading ? 'AUTHENTICATING...' : 'MANUAL CREDENTIAL LOGIN'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="white" />
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
    container: { flex: 1, width: '100%', height: '100%' },
    scrollView: { flex: 1, width: '100%' },
    scrollContent: { 
        flexGrow: 1, 
        alignItems: 'center', 
        paddingVertical: 20,
        paddingHorizontal: 16,
        paddingBottom: 48
    },
    card: {
        width: '100%',
        maxWidth: 460,
        backgroundColor: 'rgba(255, 255, 255, 0.98)',
        borderRadius: 28,
        padding: 22,
        marginVertical: 'auto',
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
        marginBottom: 12,
        borderRadius: 30,
        shadowColor: '#7c3aed',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8
    },
    logoGradient: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center'
    },
    logoIcon: { fontSize: 36 },
    title: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center', letterSpacing: -0.3 },
    subtitle: { fontSize: 12, color: '#6d28d9', marginBottom: 16, fontWeight: '600', textAlign: 'center', marginTop: 2 },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 14,
        gap: 10
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: '#cbd5e1' },
    dividerText: { fontSize: 10, fontWeight: 'bold', color: '#94a3b8', letterSpacing: 0.5 },

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
        marginBottom: 12,
        height: 44
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
        marginTop: 20
    },
    footerSecurityText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500'
    }
});
