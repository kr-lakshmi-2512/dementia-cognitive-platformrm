import React from 'react';
import { View, StyleSheet } from 'react-native';
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

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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
    return (
        <NavigationContainer>
            <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
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
    }
});
