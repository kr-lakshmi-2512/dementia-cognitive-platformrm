import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { login, getUserRole } from '../api/client';

export default function LoginScreen({ navigation }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            await login(email, password);
            const user = await getUserRole();
            
            Alert.alert(`Welcome back, ${user.full_name}!`);
            
            if (user.role === 'Caregiver') {
                navigation.replace('CaregiverDashboard');
            } else if (user.role === 'Doctor') {
                navigation.replace('DoctorDashboard');
            } else {
                navigation.replace('PatientDashboard');
            }
        } catch (error) {
            Alert.alert('Login Failed', error.response?.data?.detail || 'Invalid email or password');
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.card}>
                <View style={styles.logoContainer}>
                    <Image 
                        source={{uri: 'https://cdn-icons-png.flaticon.com/512/3004/3004416.png'}} 
                        style={styles.logo} 
                    />
                </View>
                <Text style={styles.title}>DementiaCare</Text>
                <Text style={styles.subtitle}>your everyday buddy</Text>
                
                <View style={styles.formContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    
                    <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
                        <Text style={styles.primaryButtonText}>LOGIN</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.secondaryButtonText}>SIGN UP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { width: '85%', backgroundColor: 'white', borderRadius: 30, padding: 30, alignItems: 'center', shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    logoContainer: { width: 100, height: 100, backgroundColor: '#f0f4ff', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
    logo: { width: 60, height: 60 },
    title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
    subtitle: { fontSize: 13, color: '#888', marginBottom: 30 },
    formContainer: { width: '100%' },
    input: { height: 50, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', marginBottom: 15, paddingHorizontal: 15, borderRadius: 10 },
    primaryButton: { backgroundColor: '#3b5bdb', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    secondaryButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 10, alignItems: 'center' },
    secondaryButtonText: { color: '#3b5bdb', fontWeight: 'bold', fontSize: 16 }
});
