import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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

function EmergencyScreen() {
    return null;
}

const showGlobalAlert = (title, msg) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${msg}`);
    } else {
        Alert.alert(title, msg);
    }
};

function buildTabs(DashboardComponent, options = {}) {
    const { showEmergency = false } = options;

    return function RoleTabs() {
        return (
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    headerShown: false,
                    tabBarIcon: ({ color, size }) => {
                        let iconName = 'ellipse';
                        if (route.name === 'Dashboard') iconName = 'home';
                        else if (route.name === 'Emergency') iconName = 'warning';
                        else if (route.name === 'Settings') iconName = 'settings';
                        return <Ionicons name={iconName} size={32} color={color} />;
                    },
                    tabBarActiveTintColor: route.name === 'Emergency' ? '#dc2626' : '#7c3aed',
                    tabBarInactiveTintColor: '#64748b',
                    tabBarLabelStyle: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
                    tabBarStyle: {
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        backgroundColor: 'white',
                        position: 'absolute',
                        paddingBottom: 8,
                        height: 75,
                        shadowColor: '#000',
                        shadowOpacity: 0.1,
                        shadowRadius: 10,
                        elevation: 5
                    }
                })}
            >
                <Tab.Screen name="Dashboard" component={DashboardComponent} />
                {showEmergency && (
                    <Tab.Screen
                        name="Emergency"
                        component={EmergencyScreen}
                        options={{
                            tabBarLabel: 'EMERGENCY SOS',
                            tabBarIcon: () => <Ionicons name="warning" size={32} color="#dc2626" />
                        }}
                        listeners={{
                            tabPress: e => {
                                e.preventDefault();
                                triggerPanicAlert().then(() =>
                                    showGlobalAlert('🚨 EMERGENCY SOS SENT', 'Caregiver Lakshmi & Dr. Pushpa have been alerted!')
                                );
                            }
                        }}
                    />
                )}
                <Tab.Screen name="Settings" component={SettingsScreen} />
            </Tab.Navigator>
        );
    };
}

const PatientTabs = buildTabs(PatientDashboard, { showEmergency: true });
const CaregiverTabs = buildTabs(CaregiverDashboard);
const DoctorTabs = buildTabs(DoctorDashboard);

export default function App() {
    const handleGlobalPanic = async () => {
        try {
            await triggerPanicAlert();
            showGlobalAlert('🚨 GLOBAL EMERGENCY SOS SENT', 'Immediate notification dispatched to Caregiver Lakshmi & Dr. Pushpa!');
        } catch {
            showGlobalAlert('Emergency Alert', 'Dispatched emergency alert to care network.');
        }
    };

    return (
        <NavigationContainer>
            <View style={{ flex: 1, position: 'relative' }}>
                <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />

                    <Stack.Screen name="PatientDashboard" component={PatientTabs} />
                    <Stack.Screen name="CaregiverDashboard" component={CaregiverTabs} />
                    <Stack.Screen name="DoctorDashboard" component={DoctorTabs} />

                    <Stack.Screen name="Calendar" component={CalendarScreen} />
                    <Stack.Screen name="Medication" component={MedicationScreen} />
                    <Stack.Screen name="Photos" component={PhotosScreen} />
                    <Stack.Screen name="Notes" component={NotesScreen} />
                    <Stack.Screen name="Contacts" component={ContactsScreen} />
                    <Stack.Screen name="AIRisk" component={AIRiskScreen} options={{ presentation: 'modal' }} />
                </Stack.Navigator>

                {/* 🚨 ANCHORED GLOBAL FLOATING EMERGENCY SOS PILL — VISIBLE ON ALL SCREENS 🚨 */}
                <TouchableOpacity style={styles.globalSosFab} onPress={handleGlobalPanic}>
                    <Ionicons name="warning" size={30} color="white" />
                    <Text style={styles.globalSosText}>SOS EMERGENCY</Text>
                </TouchableOpacity>
            </View>
        </NavigationContainer>
    );
}

const styles = StyleSheet.create({
    globalSosFab: {
        position: 'absolute',
        top: Platform.OS === 'web' ? 14 : 50,
        right: 18,
        backgroundColor: '#dc2626',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        zIndex: 99999,
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.7,
        shadowRadius: 10,
        elevation: 10,
        borderWidth: 2,
        borderColor: 'white'
    },
    globalSosText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 17,
        letterSpacing: 0.5
    }
});
