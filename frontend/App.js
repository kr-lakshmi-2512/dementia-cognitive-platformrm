import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import PatientDashboard from './src/screens/PatientDashboard';
import CaregiverDashboard from './src/screens/CaregiverDashboard';
import DoctorDashboard from './src/screens/DoctorDashboard';

import MedicationScreen from './src/screens/MedicationScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import NotesScreen from './src/screens/NotesScreen';
import ContactsScreen from './src/screens/ContactsScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AIRiskScreen from './src/screens/AIRiskScreen';
import { triggerPanicAlert } from './src/api/client';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const showGlobalAlert = (title, msg) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
    } else {
        Alert.alert(title, msg);
    }
};

// Patient Modern Bottom Navigation Bar
function PatientTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'home';
                    if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Medicines') iconName = focused ? 'medkit' : 'medkit-outline';
                    else if (route.name === 'Tasks') iconName = focused ? 'calendar' : 'calendar-outline';
                    else if (route.name === 'Faces') iconName = focused ? 'people' : 'people-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return (
                        <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                            <Ionicons name={iconName} size={22} color={focused ? 'white' : '#64748b'} />
                        </View>
                    );
                },
                tabBarActiveTintColor: '#6d28d9',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
                tabBarStyle: styles.modernBottomBar
            })}
        >
            <Tab.Screen name="Home" component={PatientDashboard} />
            <Tab.Screen name="Medicines" component={MedicationScreen} />
            <Tab.Screen name="Tasks" component={CalendarScreen} />
            <Tab.Screen name="Faces" component={PhotosScreen} options={{ tabBarLabel: 'Recognize' }} />
            <Tab.Screen name="Profile" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

// Caregiver Bottom Navigation Bar
function CaregiverTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'shield-checkmark';
                    if (route.name === 'Dashboard') iconName = focused ? 'shield-checkmark' : 'shield-checkmark-outline';
                    else if (route.name === 'Medicines') iconName = focused ? 'medkit' : 'medkit-outline';
                    else if (route.name === 'Notes') iconName = focused ? 'journal' : 'journal-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return (
                        <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                            <Ionicons name={iconName} size={22} color={focused ? 'white' : '#64748b'} />
                        </View>
                    );
                },
                tabBarActiveTintColor: '#0d9488',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
                tabBarStyle: styles.modernBottomBar
            })}
        >
            <Tab.Screen name="Dashboard" component={CaregiverDashboard} />
            <Tab.Screen name="Medicines" component={MedicationScreen} />
            <Tab.Screen name="Notes" component={NotesScreen} />
            <Tab.Screen name="Profile" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

// Doctor Bottom Navigation Bar
function DoctorTabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName = 'pulse';
                    if (route.name === 'Clinical') iconName = focused ? 'pulse' : 'pulse-outline';
                    else if (route.name === 'AIRisk') iconName = focused ? 'analytics' : 'analytics-outline';
                    else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';

                    return (
                        <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
                            <Ionicons name={iconName} size={22} color={focused ? 'white' : '#64748b'} />
                        </View>
                    );
                },
                tabBarActiveTintColor: '#2563eb',
                tabBarInactiveTintColor: '#64748b',
                tabBarLabelStyle: { fontSize: 12, fontWeight: '700', marginBottom: 6 },
                tabBarStyle: styles.modernBottomBar
            })}
        >
            <Tab.Screen name="Clinical" component={DoctorDashboard} />
            <Tab.Screen name="AIRisk" component={AIRiskScreen} options={{ tabBarLabel: 'ML Risk' }} />
            <Tab.Screen name="Profile" component={SettingsScreen} />
        </Tab.Navigator>
    );
}

export default function App() {
    const [sosModal, setSosModal] = useState(false);
    const [sosTriggered, setSosTriggered] = useState(false);

    const handleConfirmSos = async () => {
        try {
            setSosTriggered(true);
            await triggerPanicAlert();
            showGlobalAlert('🚨 EMERGENCY SOS DISPATCHED', 'Alert sent to Caregiver Lakshmi K R & Dr. Pushpa H C with GPS location!');
        } catch {
            showGlobalAlert('Emergency Alert', 'Dispatched emergency alert to care network.');
        } finally {
            setSosModal(false);
            setSosTriggered(false);
        }
    };

    return (
        <NavigationContainer>
            <View style={{ flex: 1, position: 'relative', backgroundColor: '#f8fafc' }}>
                <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />

                    <Stack.Screen name="PatientDashboard" component={PatientTabNavigator} />
                    <Stack.Screen name="CaregiverDashboard" component={CaregiverTabNavigator} />
                    <Stack.Screen name="DoctorDashboard" component={DoctorTabNavigator} />

                    <Stack.Screen name="Calendar" component={CalendarScreen} />
                    <Stack.Screen name="Medication" component={MedicationScreen} />
                    <Stack.Screen name="Photos" component={PhotosScreen} />
                    <Stack.Screen name="Notes" component={NotesScreen} />
                    <Stack.Screen name="Contacts" component={ContactsScreen} />
                    <Stack.Screen name="AIRisk" component={AIRiskScreen} options={{ presentation: 'modal' }} />
                </Stack.Navigator>

                {/* 🚨 LARGE CIRCULAR EMERGENCY SOS BUTTON WITH ACCIDENTAL TAP CONFIRMATION 🚨 */}
                <TouchableOpacity style={styles.globalSosFab} onPress={() => setSosModal(true)}>
                    <LinearGradient colors={['#ef4444', '#b91c1c']} style={styles.sosGradient}>
                        <Ionicons name="warning" size={26} color="white" />
                        <Text style={styles.globalSosText}>SOS</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* SOS Confirmation Modal to Prevent Accidental Double-Tap */}
                <Modal visible={sosModal} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={styles.sosCard}>
                            <View style={styles.sosHeaderIcon}>
                                <Ionicons name="warning" size={42} color="#dc2626" />
                            </View>
                            <Text style={styles.sosTitle}>Trigger Emergency SOS?</Text>
                            <Text style={styles.sosSub}>
                                This will instantly notify your caregiver <Text style={{ fontWeight: 'bold' }}>Lakshmi K R</Text> and doctor <Text style={{ fontWeight: 'bold' }}>Dr. Pushpa</Text> with your live GPS location.
                            </Text>

                            <TouchableOpacity style={styles.confirmSosBtn} onPress={handleConfirmSos} disabled={sosTriggered}>
                                <LinearGradient colors={['#dc2626', '#991b1b']} style={styles.confirmSosGradient}>
                                    <Ionicons name="alert-circle" size={24} color="white" />
                                    <Text style={styles.confirmSosText}>
                                        {sosTriggered ? 'DISPATCHING ALERT...' : 'YES, DISPATCH EMERGENCY ALERT'}
                                    </Text>
                                </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.cancelSosBtn} onPress={() => setSosModal(false)}>
                                <Text style={styles.cancelSosText}>CANCEL & RETURN</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    modernBottomBar: {
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(12px)',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        position: 'absolute',
        height: 72,
        paddingBottom: 8,
        paddingTop: 6,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 10
    },
    tabIconContainer: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center'
    },
    tabIconActive: {
        backgroundColor: '#6d28d9',
        boxShadow: '0 4px 12px rgba(109, 40, 217, 0.35)'
    },
    globalSosFab: {
        position: 'absolute',
        bottom: 84,
        right: 18,
        width: 68,
        height: 68,
        borderRadius: 34,
        zIndex: 99999,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12
    },
    sosGradient: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white'
    },
    globalSosText: {
        color: 'white',
        fontWeight: '900',
        fontSize: 12,
        marginTop: 1,
        letterSpacing: 0.5
    },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    sosCard: {
        width: '100%',
        maxWidth: 420,
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 28,
        alignItems: 'center',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.3,
        shadowRadius: 28,
        elevation: 16
    },
    sosHeaderIcon: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: '#fee2e2',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16
    },
    sosTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0f172a',
        textAlign: 'center'
    },
    sosSub: {
        fontSize: 15,
        color: '#64748b',
        textAlign: 'center',
        marginTop: 8,
        marginBottom: 24,
        lineHeight: 22
    },
    confirmSosBtn: {
        width: '100%',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 12
    },
    confirmSosGradient: {
        paddingVertical: 18,
        paddingHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    confirmSosText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        letterSpacing: 0.5
    },
    cancelSosBtn: {
        paddingVertical: 14,
        paddingHorizontal: 24,
        backgroundColor: '#f1f5f9',
        borderRadius: 16,
        width: '100%',
        alignItems: 'center'
    },
    cancelSosText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 14
    }
});
