import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Alert } from 'react-native';

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

function EmergencyDummyScreen() {
    return null;
}

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
                        return <Ionicons name={iconName} size={size} color={color} />;
                    },
                    tabBarActiveTintColor: '#3b5bdb',
                    tabBarInactiveTintColor: 'gray',
                    tabBarStyle: {
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        backgroundColor: 'white',
                        position: 'absolute',
                        paddingBottom: 5,
                        height: 60
                    }
                })}
            >
                <Tab.Screen name="Dashboard" component={DashboardComponent} />
                {showEmergency && (
                    <Tab.Screen
                        name="Emergency"
                        component={EmergencyDummyScreen}
                        listeners={{
                            tabPress: e => {
                                e.preventDefault();
                                triggerPanicAlert().then(() =>
                                    Alert.alert('Emergency Hit', 'The caregiver network has been notified.')
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
    return (
        <NavigationContainer>
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
        </NavigationContainer>
    );
}
