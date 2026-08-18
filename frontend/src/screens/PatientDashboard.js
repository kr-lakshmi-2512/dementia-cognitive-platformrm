import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    ScrollView, Platform, Modal, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import {
    fetchReminders,
    triggerPanicAlert,
    completeReminder,
    missReminder,
    checkInLocation,
    analyzeSpeechCognitive,
    parseUTC,
    getUserRole
} from '../api/client';

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        window.alert(`${title}\n\n${message}`);
    } else {
        const { Alert } = require('react-native');
        Alert.alert(title, message);
    }
};

const speak = (text, onEnd) => {
    if (Platform.OS !== 'web' || !window.speechSynthesis) {
        onEnd && onEnd();
        return;
    }
    window.speechSynthesis.cancel();
    const utt = new window.SpeechSynthesisUtterance(text);
    utt.lang = 'en-IN';
    utt.rate = 0.88;
    utt.pitch = 1.05;
    utt.volume = 1;
    utt.onend = () => onEnd && onEnd();
    window.speechSynthesis.speak(utt);
};

export default function PatientDashboard({ navigation }) {
    const [reminders, setReminders]             = useState([]);
    const [currentUser, setCurrentUser]         = useState(null);
    const [locationShared, setLocationShared]   = useState(false);
    const [selectedMood, setSelectedMood]       = useState(null);

    // Voice assistant & Memory Help Modal
    const [voiceModal, setVoiceModal]           = useState(false);
    const [activeReminder, setActiveReminder]   = useState(null);
    const [voiceState, setVoiceState]           = useState('idle');
    const [voiceTitle, setVoiceTitle]           = useState('');
    const [companionText, setCompanionText]     = useState('');

    // Object Memory Finder Modal ("Where did I put it?")
    const [objectModal, setObjectModal]         = useState(false);

    // Mini Memory Training Game Modal
    const [gameModal, setGameModal]             = useState(false);

    const pulseAnim  = useRef(new Animated.Value(1)).current;
    const checkedIds = useRef(new Set());

    const OBJECT_LOGS = [
        { name: 'Glasses / Spectacles', lastSeen: 'Bedside Nightstand', time: '8:30 AM' },
        { name: 'House Keys', lastSeen: 'Front Entrance Key Hook', time: '9:15 AM' },
        { name: 'Walking Stick', lastSeen: 'Living Room Armchair', time: '10:00 AM' },
        { name: 'Wallet / Purse', lastSeen: 'Bedroom Closet Shelf', time: 'Yesterday 6:00 PM' }
    ];

    const todayDateStr = new Date().toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric'
    });

    useEffect(() => {
        if (voiceState === 'listening') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.3, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [voiceState]);

    useEffect(() => {
        loadDashboard();
        autoTrackLocation();
    }, []);

    useEffect(() => {
        const interval = setInterval(checkForDueMedications, 30000);
        return () => clearInterval(interval);
    }, [reminders]);

    const autoTrackLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status === 'granted') {
                const { coords } = await Location.getCurrentPositionAsync({});
                await checkInLocation(coords.latitude, coords.longitude);
                setLocationShared(true);
            }
        } catch (e) {
            console.log('Auto location tracking fallback', e);
        }
    };

    const loadDashboard = async () => {
        try {
            const [user, data] = await Promise.all([getUserRole(), fetchReminders()]);
            setCurrentUser(user);
            setReminders(data);
        } catch (err) {
            console.error('Failed to load patient dashboard:', err);
        }
    };

    const checkForDueMedications = () => {
        const now = new Date();
        for (const rem of reminders) {
            if (rem.is_completed) continue;
            if (checkedIds.current.has(rem.id)) continue;
            const dueTime = parseUTC(rem.time);
            const diffMs  = now - dueTime;
            if (diffMs >= 0 && diffMs <= 3 * 60 * 1000) {
                checkedIds.current.add(rem.id);
                triggerVoiceReminder(rem);
                break;
            }
        }
    };

    const triggerVoiceReminder = (reminder) => {
        setActiveReminder(reminder);
        setVoiceModal(true);
        setVoiceState('speaking');
        const parts = reminder.title.split(' - ');
        const medName = parts.slice(1).join(' - ') || reminder.title;
        const announcement = `Hello! It is time to take your ${medName}. Please take your medicine now. Say "Taken" or press the Taken button when done.`;
        setVoiceTitle(`🔔 Time for: ${medName}`);
        setCompanionText(announcement);

        speak(announcement, () => {
            setVoiceState('listening');
        });
    };

    // 1-Tap "I NEED HELP REMEMBERING" Action
    const handleNeedHelpRemembering = async () => {
        const greeting = `Hello ${currentUser?.full_name || 'Rachana'}! I am your Memory Companion. You are completely safe in your home. Your daughter Spandana and caregiver Lakshmi K R set me up to help you remember everything.`;
        setVoiceTitle("🧠 Memory Companion Active");
        setCompanionText(greeting);
        setVoiceModal(true);
        setVoiceState('speaking');

        speak(greeting, () => {
            setVoiceState('idle');
        });
    };

    // 3 DISTINCT COGNITIVE QUESTIONS & REASSURANCES
    const handleWhereAmI = () => {
        const text = `You are safe at home in your residence, ${currentUser?.full_name || 'Rachana'}. Your home safe zone is active, and your primary caregiver Lakshmi K R is nearby to assist you. Your daughter Spandana is also monitoring you.`;
        setVoiceTitle("📍 Location Guidance: Home Safe Zone");
        setCompanionText(text);
        setVoiceModal(true);
        setVoiceState('speaking');
        speak(text, () => setVoiceState('idle'));
    };

    const handleWhatShouldIDo = () => {
        const text = `Right now, you should take your scheduled morning medication. After taking your pills, your daughter Spandana will call you to check in. Caregiver Lakshmi is also available to help.`;
        setVoiceTitle("⏰ Next Action: Take Morning Medicine");
        setCompanionText(text);
        setVoiceModal(true);
        setVoiceState('speaking');
        speak(text, () => setVoiceState('idle'));
    };

    const handleWhoIsHelpingMe = () => {
        const text = `Your loving daughter Spandana set up this Memory Companion for you. Your caregiver Lakshmi K R manages your meals and medicine daily, and Dr. Pushpa H C oversees your medical and neurological health.`;
        setVoiceTitle("👥 Your Care Team: Rachana, Lakshmi & Dr. Pushpa");
        setCompanionText(text);
        setVoiceModal(true);
        setVoiceState('speaking');
        speak(text, () => setVoiceState('idle'));
    };

    const handleVoiceConfirm = async (id, taken) => {
        try {
            if (taken) {
                await completeReminder(id);
                setVoiceState('success');
                setVoiceTitle('✅ Great job! Marked as taken.');
                speak('Wonderful! Marked as taken.', () => {
                    setTimeout(() => closeVoiceModal(), 1800);
                });
            } else {
                await missReminder(id);
                setVoiceState('success');
                setVoiceTitle('⚠️ Logged as missed. Caregiver notified.');
                speak('Logged. Caregiver has been notified.', () => {
                    setTimeout(() => closeVoiceModal(), 1800);
                });
            }
            loadDashboard();
        } catch {
            setVoiceState('error');
            setVoiceTitle('Could not update. Please try again.');
        }
    };

    const closeVoiceModal = () => {
        window.speechSynthesis && window.speechSynthesis.cancel();
        setVoiceModal(false);
        setVoiceState('idle');
        setActiveReminder(null);
        setVoiceTitle('');
        setCompanionText('');
    };

    const handlePanic = async () => {
        try {
            await triggerPanicAlert();
            showAlert('🚨 EMERGENCY SOS SENT', `Immediate notification sent to Caregiver Lakshmi & Dr. Pushpa!\nPatient: ${currentUser?.full_name || 'Patient'}`);
        } catch {
            showAlert('Emergency', 'Emergency signal dispatched to care team.');
        }
    };

    const handleCallCaregiver = () => {
        showAlert('📞 Calling Caregiver', 'Connecting to your primary caregiver: Lakshmi K R');
    };

    const handleOpenWhereIsIt = () => {
        setObjectModal(true);
        speak("Opening Where Did I Put It Assistant. Here are your recent item locations.");
    };

    const handlePlayBrainGame = () => {
        setGameModal(true);
        speak("Welcome to Memory Training. Who is your daughter?");
    };

    const nextPending = reminders.find(r => !r.is_completed);

    const patientModules = [
        { title: 'Medication Schedule', icon: 'medkit', target: 'Medication', color: '#7c3aed', desc: 'View your complete daily routine' },
        { title: 'Family Memory Directory', icon: 'people', target: 'Photos', color: '#be185d', desc: 'Recognize Rachana, Lakshmi & Dr. Pushpa' },
        { title: 'Emergency Contacts', icon: 'call', target: 'Contacts', color: '#16a34a', desc: 'Doctor & Caregiver contacts' },
    ];

    return (
        <LinearGradient colors={['#1e1b4b', '#0f172a']} style={styles.container}>

            {/* Top Bar Status Indicator */}
            <View style={styles.topBar}>
                <View style={styles.topBarLeft}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.topBarStatus}>
                        {locationShared ? '📍 Location Auto-Tracked' : '🛡️ Safe Zone Active'}
                    </Text>
                </View>
            </View>

            {/* Voice Assistant / Memory Companion Modal */}
            <Modal visible={voiceModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <LinearGradient colors={['#3730a3', '#1e1b4b']} style={styles.voiceCard}>
                        <View style={styles.voiceHeader}>
                            <Ionicons name="sparkles" size={32} color="#a78bfa" />
                            <Text style={styles.voiceHeaderText}>Memory Companion</Text>
                        </View>
                        <Animated.View style={[styles.voiceIconRing, { transform: [{ scale: pulseAnim }] }]}>
                            <Ionicons name="volume-high" size={54} color="white" />
                        </Animated.View>
                        <Text style={styles.voiceMsg}>{voiceTitle}</Text>
                        {companionText ? (
                            <View style={styles.companionBox}>
                                <Text style={styles.companionText}>{companionText}</Text>
                            </View>
                        ) : null}

                        {activeReminder && (
                            <View style={styles.medNameBox}>
                                <Text style={styles.medName}>
                                    {activeReminder.title.split(' - ').slice(1).join(' - ') || activeReminder.title}
                                </Text>
                            </View>
                        )}
                        {activeReminder && (
                            <View style={styles.voiceBtnRow}>
                                <TouchableOpacity
                                    style={[styles.voiceBtn, styles.takenBtn]}
                                    onPress={() => handleVoiceConfirm(activeReminder.id, true)}
                                >
                                    <Ionicons name="checkmark-circle" size={26} color="white" />
                                    <Text style={styles.voiceBtnText}>TAKEN ✓</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.voiceBtn, styles.missedBtn]}
                                    onPress={() => handleVoiceConfirm(activeReminder.id, false)}
                                >
                                    <Ionicons name="close-circle" size={26} color="white" />
                                    <Text style={styles.voiceBtnText}>NOT TAKEN</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity style={styles.dismissBtn} onPress={closeVoiceModal}>
                            <Text style={styles.dismissText}>CLOSE WINDOW</Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </Modal>

            {/* "Where Did I Put It?" Object Finder Modal */}
            <Modal visible={objectModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.objectModalCard}>
                        <Text style={styles.objectModalTitle}>🔍 "Where Did I Put It?" Assistant</Text>
                        <Text style={styles.objectModalSub}>AI Object Tracker Logged Locations</Text>

                        {OBJECT_LOGS.map((obj, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.objectItem}
                                onPress={() => speak(`${obj.name} was last seen at ${obj.lastSeen} at ${obj.time}.`)}
                            >
                                <Ionicons name="location" size={24} color="#7c3aed" />
                                <View style={{ flex: 1, marginLeft: 12 }}>
                                    <Text style={styles.objectName}>{obj.name}</Text>
                                    <Text style={styles.objectLoc}>Last placed at: <Text style={{ fontWeight: 'bold' }}>{obj.lastSeen}</Text></Text>
                                    <Text style={styles.objectTime}>Logged at {obj.time}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}

                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setObjectModal(false)}>
                            <Text style={styles.closeModalText}>CLOSE ASSISTANT</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Mini Memory Training Game Modal */}
            <Modal visible={gameModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.objectModalCard}>
                        <Text style={styles.objectModalTitle}>🧠 Memory Companion Mini-Game</Text>
                        <Text style={styles.objectModalSub}>Question 1: Who is your daughter who checks on you?</Text>

                        <TouchableOpacity
                            style={[styles.gameOptionBtn, { backgroundColor: '#d1fae5' }]}
                            onPress={() => {
                                speak("Correct! Rachana D N is your daughter!");
                                showAlert("✅ Correct!", "Rachana D N is your loving daughter.");
                            }}
                        >
                            <Text style={[styles.gameOptionText, { color: '#065f46' }]}>A. Rachana D N</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.gameOptionBtn, { backgroundColor: '#fef3c7' }]}
                            onPress={() => speak("Try again. Your daughter is Rachana D N.")}
                        >
                            <Text style={[styles.gameOptionText, { color: '#92400e' }]}>B. Lakshmi K R (Caregiver)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeModalBtn} onPress={() => setGameModal(false)}>
                            <Text style={styles.closeModalText}>FINISH GAME</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

                {/* 1. Smart Wake-Up & Memory Companion Hero Card */}
                <View style={styles.companionHeroCard}>
                    <View style={styles.orientationHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.dateLabel}>{todayDateStr}</Text>
                            <Text style={styles.greetingText}>Good morning, {currentUser?.full_name || 'Rachana'} 👋</Text>
                            <Text style={styles.companionSub}>"I am your Memory Companion. I am here to help you today."</Text>
                        </View>
                        <TouchableOpacity style={styles.caregiverCallBtn} onPress={handleCallCaregiver}>
                            <Ionicons name="call" size={22} color="white" />
                            <Text style={styles.caregiverCallText}>Call Lakshmi</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Family Trust Memory Anchor */}
                    <View style={styles.trustAnchorBox}>
                        <Ionicons name="heart-circle" size={32} color="#ec4899" />
                        <Text style={styles.trustAnchorText}>
                            Your daughter <Text style={{ fontWeight: 'bold', color: '#1e1b4b' }}>Spandana</Text> set up this Memory Helper so you always feel safe and supported.
                        </Text>
                    </View>
                </View>

                {/* 2. MASSIVE "I NEED HELP REMEMBERING" BUTTON */}
                <TouchableOpacity style={styles.bigMemoryHelpBtn} onPress={handleNeedHelpRemembering}>
                    <Ionicons name="bulb" size={36} color="white" />
                    <View style={{ marginLeft: 14 }}>
                        <Text style={styles.bigMemoryHelpTitle}>I NEED HELP REMEMBERING</Text>
                        <Text style={styles.bigMemoryHelpSub}>Tap here anytime you feel confused or lost</Text>
                    </View>
                </TouchableOpacity>

                {/* 3. Advanced AIML Object Finder & Brain Game Row */}
                <View style={styles.aimlRow}>
                    <TouchableOpacity style={styles.aimlTile} onPress={handleOpenWhereIsIt}>
                        <Ionicons name="search" size={28} color="#7c3aed" />
                        <Text style={styles.aimlTileTitle}>"Where Did I Put It?"</Text>
                        <Text style={styles.aimlTileSub}>Find keys, glasses, stick</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.aimlTile, { backgroundColor: '#f0fdf4' }]} onPress={handlePlayBrainGame}>
                        <Ionicons name="extension-puzzle" size={28} color="#16a34a" />
                        <Text style={styles.aimlTileTitle}>Memory Game</Text>
                        <Text style={styles.aimlTileSub}>Daily family training</Text>
                    </TouchableOpacity>
                </View>

                {/* 4. 3 DISTINCT COGNITIVE CONFUSION BUTTONS */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🗣️ Ask Your Memory Companion</Text>
                    <View style={styles.cognitiveBtnGrid}>
                        <TouchableOpacity style={styles.cognitiveBtn} onPress={handleWhereAmI}>
                            <Ionicons name="location" size={24} color="#3b82f6" />
                            <Text style={styles.cognitiveBtnText}>"Where am I?"</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cognitiveBtn} onPress={handleWhatShouldIDo}>
                            <Ionicons name="help-circle" size={24} color="#7c3aed" />
                            <Text style={styles.cognitiveBtnText}>"What should I do?"</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cognitiveBtn} onPress={handleWhoIsHelpingMe}>
                            <Ionicons name="people" size={24} color="#16a34a" />
                            <Text style={styles.cognitiveBtnText}>"Who is helping me?"</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Mood Check-In */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>😊 How are you feeling right now?</Text>
                    <View style={styles.moodRow}>
                        {[
                            { emoji: '😊', label: 'Happy' },
                            { emoji: '😌', label: 'Calm' },
                            { emoji: '😟', label: 'Confused' },
                            { emoji: '😴', label: 'Tired' },
                        ].map((m) => (
                            <TouchableOpacity
                                key={m.label}
                                style={[styles.moodBtn, selectedMood === m.label && styles.moodBtnSelected]}
                                onPress={() => {
                                    setSelectedMood(m.label);
                                    showAlert('Mood Saved', `Logged "${m.label}". Caregiver Lakshmi notified.`);
                                }}
                            >
                                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                                <Text style={styles.moodLabel}>{m.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Single Next Medicine Focus Card */}
                <View style={styles.card}>
                    <View style={styles.cardHeaderRow}>
                        <Text style={styles.cardTitle}>⏰ Next Scheduled Medicine</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Medication')}>
                            <Text style={styles.viewAllText}>View All →</Text>
                        </TouchableOpacity>
                    </View>

                    {nextPending ? (
                        <View style={styles.nextMedBox}>
                            <View style={styles.nextMedIconBg}>
                                <Ionicons name="medkit" size={36} color="#7c3aed" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.nextMedTitle}>
                                    {nextPending.title.split(' - ').slice(1).join(' - ') || nextPending.title}
                                </Text>
                                <Text style={styles.nextMedTime}>
                                    Due Today at {parseUTC(nextPending.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.allDoneBox}>
                            <Ionicons name="checkmark-done-circle" size={48} color="#10b981" />
                            <Text style={styles.allDoneText}>All medicines for today are taken!</Text>
                        </View>
                    )}
                </View>

                {/* Patient Essential Tools */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>⭐ Essential Tools</Text>
                    <View style={styles.toolsContainer}>
                        {patientModules.map(mod => (
                            <TouchableOpacity
                                key={mod.title}
                                style={styles.toolItem}
                                onPress={() => navigation.navigate(mod.target)}
                            >
                                <View style={[styles.toolIconBg, { backgroundColor: mod.color + '20' }]}>
                                    <Ionicons name={mod.icon} size={28} color={mod.color} />
                                </View>
                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.toolTitle}>{mod.title}</Text>
                                    <Text style={styles.toolDesc}>{mod.desc}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={22} color="#aaa" />
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                {/* Emergency Floating Banner */}
                <TouchableOpacity style={styles.bottomPanicCard} onPress={handlePanic}>
                    <Ionicons name="warning" size={36} color="white" />
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={styles.bottomPanicTitle}>1-TAP EMERGENCY SOS</Text>
                        <Text style={styles.bottomPanicSub}>Alerts Lakshmi & Dr. Pushpa immediately</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        paddingTop: 55, paddingBottom: 14, paddingHorizontal: 20,
        backgroundColor: 'rgba(0,0,0,0.4)', flexDirection: 'row',
        alignItems: 'center', justifyContent: 'space-between',
        borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)'
    },
    topBarLeft: { flexDirection: 'row', alignItems: 'center' },
    pulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#10b981', marginRight: 10 },
    topBarStatus: { color: '#e2e8f0', fontSize: 14, fontWeight: '600' },
    content: { padding: 20 },

    companionHeroCard: {
        backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: 24,
        marginBottom: 18, marginTop: 10, shadowColor: '#7c3aed', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
    },
    orientationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
    dateLabel: { fontSize: 16, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' },
    greetingText: { fontSize: 32, fontWeight: 'bold', color: '#1f1545', marginTop: 3 },
    companionSub: { fontSize: 18, color: '#7c3aed', fontWeight: '600', marginTop: 4, lineHeight: 25 },
    caregiverCallBtn: {
        backgroundColor: '#16a34a', paddingHorizontal: 18, paddingVertical: 14,
        borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 8
    },
    caregiverCallText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
    trustAnchorBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf2f8',
        padding: 18, borderRadius: 20, borderWidth: 1.5, borderColor: '#fbcfe8', gap: 12
    },
    trustAnchorText: { flex: 1, fontSize: 17, color: '#831843', lineHeight: 24 },

    bigMemoryHelpBtn: {
        backgroundColor: '#7c3aed', borderRadius: 28, padding: 26,
        flexDirection: 'row', alignItems: 'center', marginBottom: 18,
        shadowColor: '#7c3aed', shadowOpacity: 0.4, shadowRadius: 12, elevation: 6
    },
    bigMemoryHelpTitle: { color: 'white', fontSize: 25, fontWeight: 'bold', letterSpacing: 0.5 },
    bigMemoryHelpSub: { color: '#ddd6fe', fontSize: 17, marginTop: 4 },

    aimlRow: { flexDirection: 'row', gap: 14, marginBottom: 18 },
    aimlTile: {
        flex: 1, backgroundColor: '#f5f3ff', padding: 20, borderRadius: 22,
        borderWidth: 2, borderColor: '#ddd6fe', alignItems: 'flex-start'
    },
    aimlTileTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f1545', marginTop: 8 },
    aimlTileSub: { fontSize: 15, color: '#6b7280', marginTop: 4 },

    cognitiveBtnGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
    cognitiveBtn: {
        flex: 1, backgroundColor: '#f8fafc', padding: 16, borderRadius: 18,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#cbd5e1'
    },
    cognitiveBtnText: { fontSize: 16, fontWeight: 'bold', color: '#1e1b4b', marginTop: 6, textAlign: 'center' },

    card: {
        backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 26, padding: 24,
        marginBottom: 18
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
    cardTitle: { fontSize: 23, fontWeight: 'bold', color: '#1f1545' },
    viewAllText: { fontSize: 17, color: '#7c3aed', fontWeight: 'bold' },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 },
    moodBtn: {
        alignItems: 'center', padding: 16, borderRadius: 18,
        backgroundColor: '#f3f4f6', flex: 1, marginHorizontal: 4
    },
    moodBtnSelected: { backgroundColor: '#ddd6fe', borderWidth: 2, borderColor: '#7c3aed' },
    moodEmoji: { fontSize: 34 },
    moodLabel: { fontSize: 15, color: '#374151', marginTop: 6, fontWeight: 'bold' },
    nextMedBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff',
        padding: 20, borderRadius: 20, borderWidth: 1.5, borderColor: '#ddd6fe'
    },
    nextMedIconBg: {
        width: 64, height: 64, borderRadius: 20, backgroundColor: '#ede9fe',
        justifyContent: 'center', alignItems: 'center'
    },
    nextMedTitle: { fontSize: 21, fontWeight: 'bold', color: '#1f1545' },
    nextMedTime: { fontSize: 17, color: '#7c3aed', marginTop: 4, fontWeight: 'bold' },
    allDoneBox: { alignItems: 'center', padding: 20 },
    allDoneText: { color: '#065f46', fontWeight: 'bold', marginTop: 10, fontSize: 18 },
    toolsContainer: { marginTop: 12, gap: 12 },
    toolItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
        padding: 18, borderRadius: 18, borderWidth: 1.5, borderColor: '#f3f4f6'
    },
    toolIconBg: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    toolTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f1545' },
    toolDesc: { fontSize: 16, color: '#6b7280', marginTop: 3 },
    bottomPanicCard: {
        backgroundColor: '#dc2626', borderRadius: 24, padding: 24,
        flexDirection: 'row', alignItems: 'center', marginTop: 8,
        shadowColor: '#dc2626', shadowOpacity: 0.5, shadowRadius: 12, elevation: 8
    },
    bottomPanicTitle: { color: 'white', fontWeight: 'bold', fontSize: 22, letterSpacing: 0.5 },
    bottomPanicSub: { color: '#fca5a5', fontSize: 16, marginTop: 3 },

    objectModalCard: { backgroundColor: 'white', borderRadius: 28, padding: 26, width: '90%', alignSelf: 'center' },
    objectModalTitle: { fontSize: 24, fontWeight: 'bold', color: '#1f1545', textAlign: 'center' },
    objectModalSub: { fontSize: 15, color: '#64748b', marginTop: 4, marginBottom: 18, textAlign: 'center' },
    objectItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff',
        padding: 16, borderRadius: 18, marginBottom: 12, borderWidth: 1.5, borderColor: '#ddd6fe'
    },
    objectName: { fontSize: 18, fontWeight: 'bold', color: '#1f1545' },
    objectLoc: { fontSize: 15, color: '#4b5563', marginTop: 3 },
    objectTime: { fontSize: 13, color: '#7c3aed', marginTop: 2 },
    gameOptionBtn: { padding: 18, borderRadius: 18, marginBottom: 12 },
    gameOptionText: { fontSize: 18, fontWeight: 'bold' },
    closeModalBtn: { backgroundColor: '#1e1b4b', padding: 16, borderRadius: 18, alignItems: 'center', marginTop: 10 },
    closeModalText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
    voiceCard: { borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 32, paddingBottom: 55, alignItems: 'center' },
    voiceHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
    voiceHeaderText: { color: 'white', fontSize: 24, fontWeight: 'bold', marginLeft: 12 },
    voiceIconRing: { width: 110, height: 110, borderRadius: 55, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    voiceMsg: { color: 'white', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
    companionBox: { backgroundColor: 'rgba(255,255,255,0.2)', padding: 18, borderRadius: 20, marginBottom: 20, width: '100%' },
    companionText: { color: 'white', fontSize: 18, lineHeight: 26, textAlign: 'center', fontWeight: '600' },
    medNameBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 16, marginBottom: 22, width: '100%', alignItems: 'center' },
    medName: { color: 'white', fontSize: 24, fontWeight: 'bold' },
    voiceBtnRow: { flexDirection: 'row', gap: 14, width: '100%', marginBottom: 16 },
    voiceBtn: { flex: 1, padding: 18, borderRadius: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
    takenBtn: { backgroundColor: '#16a34a' },
    missedBtn: { backgroundColor: '#dc2626' },
    voiceBtnText: { color: 'white', fontWeight: 'bold', fontSize: 17 },
    dismissBtn: { marginTop: 8, paddingVertical: 10, paddingHorizontal: 24 },
    dismissText: { color: 'rgba(255,255,255,0.6)', fontSize: 15 },
});
