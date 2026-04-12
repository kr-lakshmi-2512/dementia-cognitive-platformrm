import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { registerUser } from '../api/client';

export default function RegisterScreen({ navigation }) {
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('Patient'); // Default role

    const handleRegister = async () => {
        if (!fullName || !email || !password) {
            Alert.alert("Validation Error", "All fields are required.");
            return;
        }
        if (!email.includes('@')) {
            Alert.alert("Validation Error", "Please enter a valid email address.");
            return;
        }
        try {
            await registerUser(fullName, email, password, role);
            Alert.alert('Success', 'Account created! Please log in.');
            navigation.navigate('Login');
        } catch (error) {
            Alert.alert('Registration Failed', error.response?.data?.detail || 'An error occurred. Check email formatting.');
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.title}>Create Account</Text>
                
                <TextInput style={styles.input} placeholder="Full Name" value={fullName} onChangeText={setFullName}/>
                <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none"/>
                <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry/>
                
                <View style={styles.pickerContainer}>
                    <Text style={styles.roleLabel}>Select Role:</Text>
                    <View style={styles.roleButtons}>
                        {['Patient', 'Caregiver', 'Doctor'].map((r) => (
                            <TouchableOpacity 
                                key={r}
                                style={[styles.roleButton, role === r && styles.roleButtonActive]}
                                onPress={() => setRole(r)}
                            >
                                <Text style={[styles.roleText, role === r && styles.roleTextActive]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleRegister}>
                    <Text style={styles.primaryButtonText}>REGISTER</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.secondaryButtonText}>BACK TO LOGIN</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { width: '90%', backgroundColor: 'white', borderRadius: 30, padding: 30, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#333' },
    input: { height: 50, backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#eee', marginBottom: 15, paddingHorizontal: 15, borderRadius: 10 },
    pickerContainer: { marginBottom: 20 },
    roleLabel: { fontSize: 16, marginBottom: 10, fontWeight: '600', color: '#555' },
    roleButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
    roleButton: { paddingVertical: 10, paddingHorizontal: 10, backgroundColor: '#f0f0f0', borderRadius: 8, flex: 1, marginHorizontal: 5, alignItems: 'center' },
    roleButtonActive: { backgroundColor: '#3b5bdb' },
    roleText: { color: '#666', fontWeight: 'bold', fontSize: 13 },
    roleTextActive: { color: 'white' },
    primaryButton: { backgroundColor: '#3b5bdb', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
    primaryButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    secondaryButton: { backgroundColor: 'white', borderWidth: 1, borderColor: '#ccc', padding: 15, borderRadius: 10, alignItems: 'center' },
    secondaryButtonText: { color: '#3b5bdb', fontWeight: 'bold', fontSize: 16 }
});
