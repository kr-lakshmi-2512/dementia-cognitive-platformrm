import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { registerUser } from '../api/client';

const showGlobalAlert = (title, msg) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
    } else {
        Alert.alert(title, msg);
    }
};

export default function RegisterScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Patient'); // Default role
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            showGlobalAlert("Validation Error", "All fields are required.");
            return;
        }
        if (!email.includes('@')) {
            showGlobalAlert("Validation Error", "Please enter a valid email address.");
            return;
        }
        setLoading(true);
        try {
            await registerUser(fullName, email, password, role);
            showGlobalAlert('Success', 'Account created! Please log in.');
            navigation.navigate('Login');
        } catch (error) {
            showGlobalAlert('Registration Failed', error.response?.data?.detail || 'An error occurred. Check email formatting.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#0f172a', '#1e1b4b', '#0f172a']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    {/* Header */}
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join the AI Dementia Care & Support Network</Text>
                    
                    <View style={styles.formContainer}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={22} color="#64748b" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="e.g. Rachana D N" 
                                placeholderTextColor="#94a3b8"
                                value={fullName} 
                                onChangeText={setFullName}
                            />
                        </View>

                        <Text style={styles.inputLabel}>Email Address</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="mail-outline" size={22} color="#64748b" style={styles.inputIcon} />
                            <TextInput 
                                style={styles.input} 
                                placeholder="name@example.com" 
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
                                placeholder="Create a secure password" 
                                placeholderTextColor="#94a3b8"
                                value={password} 
                                onChangeText={setPassword} 
                                secureTextEntry
                            />
                        </View>
                        
                        {/* Role Selector */}
                        <View style={styles.pickerContainer}>
                            <Text style={styles.roleLabel}>Select Account Role:</Text>
                            <View style={styles.roleButtons}>
                                {[
                                    { name: 'Patient', icon: 'person', desc: 'Cognitive Aid' },
                                    { name: 'Caregiver', icon: 'shield', desc: 'Safety & Meds' },
                                    { name: 'Doctor', icon: 'medical', desc: 'ML Risk Analytics' }
                                ].map((item) => (
                                    <TouchableOpacity 
                                        key={item.name}
                                        style={[styles.roleCard, role === item.name && styles.roleCardActive]}
                                        onPress={() => setRole(item.name)}
                                    >
                                        <Ionicons 
                                            name={item.icon} 
                                            size={20} 
                                            color={role === item.name ? 'white' : '#6d28d9'} 
                                        />
                                        <Text style={[styles.roleTitle, role === item.name && styles.roleTitleActive]}>
                                            {item.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <LinearGradient colors={['#7c3aed', '#6d28d9']} style={styles.buttonGradient}>
                                <Text style={styles.primaryButtonText}>
                                    {loading ? 'CREATING ACCOUNT...' : 'REGISTER ACCOUNT'}
                                </Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={styles.secondaryButton} 
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.secondaryButtonText}>Back to Login</Text>
                        </TouchableOpacity>
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
        justifyContent: 'center', 
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
    title: { fontSize: 20, fontWeight: '800', color: '#0f172a', textAlign: 'center', letterSpacing: -0.3 },
    subtitle: { fontSize: 12, color: '#6d28d9', marginBottom: 18, fontWeight: '600', textAlign: 'center', marginTop: 3 },
    
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
    
    pickerContainer: { marginBottom: 18, marginTop: 4 },
    roleLabel: { fontSize: 12, fontWeight: '700', color: '#1e293b', marginBottom: 8 },
    roleButtons: { flexDirection: 'row', gap: 8 },
    roleCard: { 
        flex: 1, 
        backgroundColor: '#f8fafc', 
        borderWidth: 1.5, 
        borderColor: '#cbd5e1', 
        borderRadius: 14, 
        paddingVertical: 10, 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 4
    },
    roleCardActive: { 
        backgroundColor: '#7c3aed', 
        borderColor: '#6d28d9' 
    },
    roleTitle: { fontSize: 12, fontWeight: '700', color: '#334155' },
    roleTitleActive: { color: 'white' },

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
        alignItems: 'center',
        justifyContent: 'center'
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
    secondaryButtonText: { color: '#334155', fontWeight: 'bold', fontSize: 13 }
});
