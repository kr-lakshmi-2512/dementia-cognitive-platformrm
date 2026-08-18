import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

    const handleLogin = async () => {
        try {
            await login(email, password);
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
        }
    };

    return (
        <LinearGradient colors={['#1e1b4b', '#0f172a']} style={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={{uri: 'https://cdn-icons-png.flaticon.com/512/3004/3004416.png'}} 
                        style={styles.logo} 
                    />
                </View>
                <Text style={styles.title}>DementiaCare Platform</Text>
                <Text style={styles.subtitle}>Memory Companion & Care Network</Text>
                
                <View style={styles.formContainer}>
                    <Text style={styles.inputLabel}>Email Address</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter email address..."
                        placeholderTextColor="#888"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter password..."
                        placeholderTextColor="#888"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    
                    <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                        <Text style={styles.primaryButtonText}>LOG IN</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.secondaryButtonText}>CREATE NEW ACCOUNT</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    card: {
        width: '90%', maxWidth: 520, backgroundColor: 'white', borderRadius: 32,
        padding: 36, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 12}, shadowOpacity: 0.3, shadowRadius: 24, elevation: 12
    },
    logoContainer: { width: 110, height: 110, backgroundColor: '#f0f4ff', borderRadius: 55, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
    logo: { width: 70, height: 70 },
    title: { fontSize: 34, fontWeight: 'bold', color: '#1e1b4b', textAlign: 'center' },
    subtitle: { fontSize: 18, color: '#7c3aed', marginBottom: 32, fontWeight: '600', textAlign: 'center', marginTop: 4 },
    formContainer: { width: '100%' },
    inputLabel: { fontSize: 18, fontWeight: 'bold', color: '#1e1b4b', marginBottom: 8 },
    input: {
        height: 60, backgroundColor: '#f8fafc', borderWidth: 2, borderColor: '#cbd5e1',
        marginBottom: 20, paddingHorizontal: 20, borderRadius: 18, fontSize: 20, color: '#1e1b4b'
    },
    primaryButton: { backgroundColor: '#7c3aed', paddingVertical: 18, borderRadius: 18, alignItems: 'center', marginBottom: 16, marginTop: 10 },
    primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 20, letterSpacing: 0.5 },
    secondaryButton: { backgroundColor: '#f1f5f9', borderWidth: 2, borderColor: '#cbd5e1', paddingVertical: 18, borderRadius: 18, alignItems: 'center' },
    secondaryButtonText: { color: '#1e1b4b', fontWeight: 'bold', fontSize: 18 }
});
