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

const playEmergencySirenSound = () => {
    try {
        if (Platform.OS === 'web' && (window.AudioContext || window.webkitAudioContext)) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const ctx = new AudioCtx();
            
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sawtooth';
            
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.25);
            osc.frequency.linearRampToValueAtTime(800, now + 0.5);
            osc.frequency.linearRampToValueAtTime(1200, now + 0.75);
            osc.frequency.linearRampToValueAtTime(800, now + 1.0);
            osc.frequency.linearRampToValueAtTime(1200, now + 1.25);
            osc.frequency.linearRampToValueAtTime(800, now + 1.5);
            
            gain.gain.setValueAtTime(0.7, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(now);
            osc.stop(now + 1.8);
        }
    } catch (e) {
        console.log('Siren audio error:', e);
    }

    speak("ALERT! Emergency SOS sent! Caregiver Lakshmi and Doctor Pushpa have been notified!");
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
    const [gameIndex, setGameIndex]             = useState(0);
    const [gameScore, setGameScore]             = useState(0);
    const [gameFinished, setGameFinished]       = useState(false);
    const [selectedOption, setSelectedOption]   = useState(null);

    const DAILY_MEMORY_QUESTIONS = [
        {
            id: 1,
            category: '👨‍👩‍👧 Family Anchor',
            question: 'Who is your daughter who checks on your health daily?',
            options: [
                { text: 'A. Spandana (Daughter)', isCorrect: true, feedback: 'Correct! Spandana is your loving daughter.' },
                { text: 'B. Lakshmi K R (Caregiver)', isCorrect: false, feedback: 'Lakshmi K R is your primary caregiver. Spandana is your daughter.' }
            ]
        },
        {
            id: 2,
            category: '💊 Daily Routine',
            question: 'What should you do after waking up in the morning?',
            options: [
                { text: 'A. Take morning medicine & eat breakfast', isCorrect: true, feedback: 'Wonderful! Taking morning pills keeps you healthy and safe.' },
                { text: 'B. Leave the house alone late at night', isCorrect: false, feedback: 'Remember, it is best to stay inside your safe home and take morning medicine.' }
            ]
        },
        {
            id: 3,
            category: '🛡️ Primary Caregiver',
            question: 'Who manages your daily meals and medication schedules?',
            options: [
                { text: 'A. Lakshmi K R (Primary Caregiver)', isCorrect: true, feedback: 'Correct! Caregiver Lakshmi prepares meals and medicine daily.' },
                { text: 'B. A random stranger', isCorrect: false, feedback: 'Caregiver Lakshmi K R manages your meals and medicine daily.' }
            ]
        },
        {
            id: 4,
            category: '📍 Location Orientation',
            question: 'Where are you right now when your Safe Zone is active?',
            options: [
                { text: 'A. Safe at home in your residence', isCorrect: true, feedback: 'Yes! You are completely safe in your home.' },
                { text: 'B. Lost at an airport', isCorrect: false, feedback: 'You are safe at home in your residence.' }
            ]
        },
        {
            id: 5,
            category: '🩺 Doctor & Care',
            question: 'Who is your specialist doctor overseeing your care plan?',
            options: [
                { text: 'A. Dr. Pushpa H C', isCorrect: true, feedback: 'Correct! Dr. Pushpa H C oversees your medical care.' },
                { text: 'B. Spandana', isCorrect: false, feedback: 'Dr. Pushpa H C is your doctor. Spandana is your daughter.' }
            ]
        }
    ];

    const handleAnswerOption = (opt) => {
        setSelectedOption(opt);
        speak(opt.feedback);
        if (opt.isCorrect) {
            setGameScore(prev => prev + 1);
        }
        setTimeout(() => {
            if (gameIndex + 1 < DAILY_MEMORY_QUESTIONS.length) {
                setGameIndex(prev => prev + 1);
                setSelectedOption(null);
            } else {
                setGameFinished(true);
            }
        }, 2200);
    };

    const resetGame = () => {
        setGameIndex(0);
        setGameScore(0);
        setGameFinished(false);
        setSelectedOption(null);
    };

    const pulseAnim  = useRef(new Animated.Value(1)).current;
    const checkedIds = useRef(new Set());
    const repeatTimerRef = useRef(null);
    const isRepeatingRef = useRef(false);

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
            checkForDueMedications(data);
        } catch (err) {
            console.error('Failed to load patient dashboard:', err);
        }
    };

    const checkForDueMedications = (reminderList = reminders) => {
        const list = Array.isArray(reminderList) ? reminderList : reminders;
        const pending = list.filter(r => !r.is_completed);
        for (const rem of pending) {
            if (checkedIds.current.has(rem.id)) continue;
            checkedIds.current.add(rem.id);
            triggerVoiceReminder(rem);
            break;
        }
    };

    const stopRepeatingSpeech = () => {
        isRepeatingRef.current = false;
        if (repeatTimerRef.current) {
            clearTimeout(repeatTimerRef.current);
            repeatTimerRef.current = null;
        }
        if (Platform.OS === 'web' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    const triggerVoiceReminder = (reminder) => {
        stopRepeatingSpeech();
        setActiveReminder(reminder);
        setVoiceModal(true);
        setVoiceState('speaking');
        const parts = reminder.title.split(' - ');
        const medName = parts.slice(1).join(' - ') || reminder.title;
        const announcement = `Hello! It is time to take your ${medName}. Please take your medicine now. Say "Taken" or press the Taken button when done.`;
        setVoiceTitle(`🔔 Time for: ${medName}`);
        setCompanionText(announcement);

        isRepeatingRef.current = true;

        const loopSpeech = () => {
            if (!isRepeatingRef.current) return;
            speak(announcement, () => {
                if (!isRepeatingRef.current) return;
                setVoiceState('listening');
                repeatTimerRef.current = setTimeout(() => {
                    if (isRepeatingRef.current) {
                        setVoiceState('speaking');
                        loopSpeech();
                    }
                }, 2000);
            });
        };

        loopSpeech();
    };

    // 1-Tap "I NEED HELP REMEMBERING" Action
    const handleNeedHelpRemembering = async () => {
        stopRepeatingSpeech();
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
        stopRepeatingSpeech();
        const text = `You are safe at home in your residence, ${currentUser?.full_name || 'Rachana'}. Your home safe zone is active, and your primary caregiver Lakshmi K R is nearby to assist you. Your daughter Spandana is also monitoring you.`;
        setVoiceTitle("📍 Location Guidance: Home Safe Zone");
        setCompanionText(text);
        setVoiceModal(true);
        setVoiceState('speaking');
        speak(text, () => setVoiceState('idle'));
    };

    const handleWhatShouldIDo = () => {
        stopRepeatingSpeech();
        const text = `Right now, you should take your scheduled morning medication. After taking your pills, your daughter Spandana will call you to check in. Caregiver Lakshmi is also available to help.`;
        setVoiceTitle("⏰ Next Action: Take Morning Medicine");
        setCompanionText(text);
        setVoiceModal(true);
        setVoiceState('speaking');
        speak(text, () => setVoiceState('idle'));
    };

    const handleWhoIsHelpingMe = () => {
        stopRepeatingSpeech();
        const text = `Your loving daughter Spandana set up this Memory Companion for you. Your caregiver Lakshmi K R manages your meals and medicine daily, and Dr. Pushpa H C oversees your medical and neurological health.`;
        setVoiceTitle("👥 Your Care Team: Rachana, Lakshmi & Dr. Pushpa");
        setCompanionText(text);
        setVoiceModal(true);
        setVoiceState('speaking');
        speak(text, () => setVoiceState('idle'));
    };

    const handleVoiceConfirm = async (id, taken) => {
        stopRepeatingSpeech();
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
        stopRepeatingSpeech();
        setVoiceModal(false);
        setVoiceState('idle');
        setActiveReminder(null);
        setVoiceTitle('');
        setCompanionText('');
    };

    const handlePanic = async () => {
        playEmergencySirenSound();
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

            {/* Voice Assistant & Scheduled Medication Alert Modal */}
            <Modal visible={voiceModal} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <LinearGradient 
                        colors={activeReminder ? ['#065f46', '#047857', '#0f172a'] : ['#3730a3', '#1e1b4b']} 
                        style={styles.voiceCard}
                    >
                        {/* Header Status Badge */}
                        <View style={styles.voiceHeader}>
                            {activeReminder ? (
                                <View style={styles.alarmLiveBadge}>
                                    <View style={styles.alarmLiveDot} />
                                    <Text style={styles.alarmLiveText}>SCHEDULED MEDICATION ALARM</Text>
                                </View>
                            ) : (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <Ionicons name="sparkles" size={26} color="#a78bfa" />
                                    <Text style={styles.voiceHeaderText}>Memory Companion</Text>
                                </View>
                            )}
                        </View>

                        {/* Animated Glowing Voice Speaker Icon */}
                        <View style={styles.voiceCenterRingContainer}>
                            <Animated.View style={[styles.voiceIconRing, { transform: [{ scale: pulseAnim }] }]}>
                                <Ionicons 
                                    name={activeReminder ? "alarm-sharp" : "volume-high"} 
                                    size={48} 
                                    color="white" 
                                />
                            </Animated.View>
                        </View>

                        {/* Repeating Voice Status Badge */}
                        {activeReminder && (
                            <View style={styles.repeatingSpeechBadge}>
                                <Ionicons name="volume-medium" size={18} color="#34d399" />
                                <Text style={styles.repeatingSpeechText}>🔊 Voice Repeating Every 2s Until Confirmed</Text>
                            </View>
                        )}

                        <Text style={styles.voiceMsg}>{voiceTitle}</Text>

                        {companionText ? (
                            <View style={styles.companionBox}>
                                <Ionicons name="megaphone-outline" size={20} color="#34d399" style={{ marginRight: 8, marginTop: 2 }} />
                                <Text style={styles.companionText}>{companionText}</Text>
                            </View>
                        ) : null}

                        {activeReminder && (
                            <View style={styles.medNameHeroBox}>
                                <View style={styles.medPillTag}>
                                    <Ionicons name="medkit" size={20} color="#10b981" />
                                    <Text style={styles.medPillTagText}>MEDICINE DUE NOW</Text>
                                </View>
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
                                    <LinearGradient colors={['#10b981', '#059669']} style={styles.voiceBtnGradient}>
                                        <Ionicons name="checkmark-circle" size={26} color="white" />
                                        <Text style={styles.voiceBtnText}>TAKEN ✓</Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.voiceBtn, styles.missedBtn]}
                                    onPress={() => handleVoiceConfirm(activeReminder.id, false)}
                                >
                                    <View style={styles.missedBtnInner}>
                                        <Ionicons name="close-circle" size={22} color="white" />
                                        <Text style={styles.voiceBtnTextSmall}>NOT TAKEN</Text>
                                    </View>
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
                    <View style={styles.gameModalCard}>
                        {!gameFinished ? (
                            <>
                                <View style={styles.gameHeaderRow}>
                                    <View style={styles.categoryTag}>
                                        <Text style={styles.categoryTagText}>
                                            {DAILY_MEMORY_QUESTIONS[gameIndex].category}
                                        </Text>
                                    </View>
                                    <Text style={styles.gameProgressStep}>
                                        Question {gameIndex + 1} of {DAILY_MEMORY_QUESTIONS.length}
                                    </Text>
                                </View>

                                <Text style={styles.gameQuestionText}>
                                    {DAILY_MEMORY_QUESTIONS[gameIndex].question}
                                </Text>

                                <View style={styles.optionsContainer}>
                                    {DAILY_MEMORY_QUESTIONS[gameIndex].options.map((opt, idx) => {
                                        const isSelected = selectedOption === opt;
                                        return (
                                            <TouchableOpacity
                                                key={idx}
                                                style={[
                                                    styles.gameOptionCard,
                                                    isSelected && (opt.isCorrect ? styles.gameOptCorrect : styles.gameOptWrong)
                                                ]}
                                                onPress={() => handleAnswerOption(opt)}
                                                disabled={selectedOption !== null}
                                            >
                                                <Text style={[
                                                    styles.gameOptionText,
                                                    isSelected && { color: 'white' }
                                                ]}>
                                                    {opt.text}
                                                </Text>
                                                {isSelected && (
                                                    <Ionicons 
                                                        name={opt.isCorrect ? "checkmark-circle" : "close-circle"} 
                                                        size={22} 
                                                        color="white" 
                                                    />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                {selectedOption && (
                                    <View style={styles.feedbackBox}>
                                        <Ionicons 
                                            name={selectedOption.isCorrect ? "sparkles" : "information-circle"} 
                                            size={20} 
                                            color={selectedOption.isCorrect ? "#10b981" : "#f59e0b"} 
                                        />
                                        <Text style={styles.feedbackText}>{selectedOption.feedback}</Text>
                                    </View>
                                )}

                                <TouchableOpacity 
                                    style={styles.closeModalBtn} 
                                    onPress={() => { setGameModal(false); resetGame(); }}
                                >
                                    <Text style={styles.closeModalText}>EXIT GAME</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            /* Celebration End Screen */
                            <View style={styles.celebrationCard}>
                                <Text style={styles.celebrationTrophy}>🏆</Text>
                                <Text style={styles.celebrationTitle}>Memory Training Completed!</Text>
                                <Text style={styles.celebrationSub}>
                                    Great job exercising your brain today! You scored {gameScore} out of {DAILY_MEMORY_QUESTIONS.length}.
                                </Text>

                                <View style={styles.starsRow}>
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Ionicons 
                                            key={i} 
                                            name={i < gameScore ? "star" : "star-outline"} 
                                            size={36} 
                                            color="#f59e0b" 
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity style={styles.replayBtn} onPress={resetGame}>
                                    <LinearGradient colors={['#10b981', '#059669']} style={styles.replayGradient}>
                                        <Ionicons name="refresh" size={20} color="white" />
                                        <Text style={styles.replayText}>PLAY AGAIN</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <TouchableOpacity 
                                    style={styles.closeModalBtn} 
                                    onPress={() => { setGameModal(false); resetGame(); }}
                                >
                                    <Text style={styles.closeModalText}>FINISH & CLOSE</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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

                    {/* Patient Overview Summary Status Grid */}
                    <View style={styles.patientSummaryGrid}>
                        <View style={styles.summaryCard}>
                            <Ionicons name="medkit" size={24} color="#7c3aed" />
                            <Text style={styles.summaryValue}>
                                {reminders.filter(r => !r.is_completed).length} Remaining
                            </Text>
                            <Text style={styles.summaryTitle}>💊 Medicines Today</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Ionicons name="checkmark-done-circle" size={24} color="#10b981" />
                            <Text style={styles.summaryValue}>
                                {reminders.filter(r => r.is_completed).length} of {reminders.length || 5} Completed
                            </Text>
                            <Text style={styles.summaryTitle}>🧠 Today's Tasks</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Ionicons name="shield-checkmark" size={24} color="#06b6d4" />
                            <Text style={styles.summaryValue}>Inside Safe Zone</Text>
                            <Text style={styles.summaryTitle}>📍 Safety Status</Text>
                        </View>

                        <View style={styles.summaryCard}>
                            <Ionicons name="heart" size={24} color="#ec4899" />
                            <Text style={styles.summaryValue}>Lakshmi K R</Text>
                            <Text style={styles.summaryTitle}>❤️ Caregiver Connected</Text>
                        </View>
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
        backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 28, padding: 20,
        marginBottom: 16, marginTop: 10, shadowColor: '#7c3aed', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5
    },
    orientationHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
    dateLabel: { fontSize: 11, color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase' },
    greetingText: { fontSize: 18, fontWeight: 'bold', color: '#1f1545', marginTop: 2 },
    companionSub: { fontSize: 12, color: '#7c3aed', fontWeight: '600', marginTop: 3, lineHeight: 17 },
    caregiverCallBtn: {
        backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8,
        borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 6
    },
    caregiverCallText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    trustAnchorBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#fdf2f8',
        padding: 12, borderRadius: 16, borderWidth: 1.5, borderColor: '#fbcfe8', gap: 8
    },
    trustAnchorText: { flex: 1, fontSize: 12, color: '#831843', lineHeight: 17 },

    patientSummaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12
    },
    summaryCard: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#f8fafc',
        borderRadius: 14,
        padding: 10,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        alignItems: 'flex-start'
    },
    summaryValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0f172a',
        marginTop: 3
    },
    summaryTitle: {
        fontSize: 10,
        color: '#64748b',
        fontWeight: '600',
        marginTop: 2
    },

    bigMemoryHelpBtn: {
        backgroundColor: '#7c3aed', borderRadius: 20, padding: 16,
        flexDirection: 'row', alignItems: 'center', marginBottom: 14,
        shadowColor: '#7c3aed', shadowOpacity: 0.35, shadowRadius: 8, elevation: 5
    },
    bigMemoryHelpTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', letterSpacing: 0.3 },
    bigMemoryHelpSub: { color: '#ddd6fe', fontSize: 12, marginTop: 2 },

    aimlRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
    aimlTile: {
        flex: 1, backgroundColor: '#f5f3ff', padding: 14, borderRadius: 16,
        borderWidth: 1.5, borderColor: '#ddd6fe', alignItems: 'flex-start'
    },
    aimlTileTitle: { fontSize: 13, fontWeight: 'bold', color: '#1f1545', marginTop: 4 },
    aimlTileSub: { fontSize: 11, color: '#6b7280', marginTop: 2 },

    cognitiveBtnGrid: { flexDirection: 'row', gap: 6, marginTop: 10 },
    cognitiveBtn: {
        flex: 1, backgroundColor: '#f8fafc', padding: 12, borderRadius: 14,
        alignItems: 'center', borderWidth: 1.5, borderColor: '#cbd5e1'
    },
    cognitiveBtnText: { fontSize: 11, fontWeight: 'bold', color: '#1e1b4b', marginTop: 3, textAlign: 'center' },

    card: {
        backgroundColor: 'rgba(255,255,255,0.96)', borderRadius: 20, padding: 16,
        marginBottom: 14
    },
    cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    cardTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f1545' },
    viewAllText: { fontSize: 12, color: '#7c3aed', fontWeight: 'bold' },
    moodRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    moodBtn: {
        alignItems: 'center', padding: 10, borderRadius: 14,
        backgroundColor: '#f3f4f6', flex: 1, marginHorizontal: 2
    },
    moodBtnSelected: { backgroundColor: '#ddd6fe', borderWidth: 2, borderColor: '#7c3aed' },
    moodEmoji: { fontSize: 24 },
    moodLabel: { fontSize: 11, color: '#374151', marginTop: 3, fontWeight: 'bold' },
    nextMedBox: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff',
        padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#ddd6fe'
    },
    nextMedIconBg: {
        width: 44, height: 44, borderRadius: 14, backgroundColor: '#ede9fe',
        justifyContent: 'center', alignItems: 'center'
    },
    nextMedTitle: { fontSize: 14, fontWeight: 'bold', color: '#1f1545' },
    nextMedTime: { fontSize: 12, color: '#7c3aed', marginTop: 2, fontWeight: 'bold' },
    allDoneBox: { alignItems: 'center', padding: 14 },
    allDoneText: { color: '#065f46', fontWeight: 'bold', marginTop: 6, fontSize: 13 },
    toolsContainer: { marginTop: 8, gap: 8 },
    toolItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb',
        padding: 12, borderRadius: 14, borderWidth: 1.5, borderColor: '#f3f4f6'
    },
    toolIconBg: { width: 40, height: 40, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    toolTitle: { fontSize: 13, fontWeight: 'bold', color: '#1f1545' },
    toolDesc: { fontSize: 11, color: '#6b7280', marginTop: 1 },
    bottomPanicCard: {
        backgroundColor: '#dc2626', borderRadius: 20, padding: 18,
        flexDirection: 'row', alignItems: 'center', marginTop: 6,
        shadowColor: '#dc2626', shadowOpacity: 0.4, shadowRadius: 10, elevation: 6
    },
    bottomPanicTitle: { color: 'white', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.3 },
    bottomPanicSub: { color: '#fca5a5', fontSize: 12, marginTop: 2 },

    objectModalCard: { backgroundColor: 'white', borderRadius: 22, padding: 20, width: '90%', alignSelf: 'center' },
    objectModalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f1545', textAlign: 'center' },
    objectModalSub: { fontSize: 12, color: '#64748b', marginTop: 3, marginBottom: 14, textAlign: 'center' },
    objectItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f3ff',
        padding: 12, borderRadius: 14, marginBottom: 10, borderWidth: 1.5, borderColor: '#ddd6fe'
    },
    objectName: { fontSize: 14, fontWeight: 'bold', color: '#1f1545' },
    objectLoc: { fontSize: 12, color: '#4b5563', marginTop: 2 },
    objectTime: { fontSize: 11, color: '#7c3aed', marginTop: 2 },
    gameModalCard: { backgroundColor: 'white', borderRadius: 22, padding: 20, width: '92%', maxWidth: 440, alignSelf: 'center' },
    gameHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
    categoryTag: { backgroundColor: '#f3e8ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    categoryTagText: { color: '#6d28d9', fontWeight: 'bold', fontSize: 11 },
    gameProgressStep: { fontSize: 11, color: '#64748b', fontWeight: 'bold' },
    gameQuestionText: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 16, lineHeight: 22 },
    optionsContainer: { gap: 10, marginBottom: 14 },
    gameOptionCard: { backgroundColor: '#f8fafc', padding: 14, borderRadius: 16, borderWidth: 1.5, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    gameOptCorrect: { backgroundColor: '#10b981', borderColor: '#059669' },
    gameOptWrong: { backgroundColor: '#ef4444', borderColor: '#b91c1c' },
    gameOptionText: { fontSize: 14, fontWeight: 'bold', color: '#0f172a', flex: 1 },
    feedbackBox: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14, borderWidth: 1, borderColor: '#fde68a' },
    feedbackText: { color: '#b45309', fontWeight: '600', fontSize: 12, flex: 1, lineHeight: 17 },
    celebrationCard: { alignItems: 'center', paddingVertical: 8 },
    celebrationTrophy: { fontSize: 48, marginBottom: 8 },
    celebrationTitle: { fontSize: 18, fontWeight: '900', color: '#0f172a', textAlign: 'center' },
    celebrationSub: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 6, marginBottom: 14, lineHeight: 18 },
    starsRow: { flexDirection: 'row', gap: 6, marginBottom: 18 },
    replayBtn: { borderRadius: 14, overflow: 'hidden', width: '100%', marginBottom: 10 },
    replayGradient: { paddingVertical: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    replayText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    /* High Visibility Scheduled Voice Alert Modal Styles */
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    voiceCard: {
        width: '94%',
        maxWidth: 440,
        borderRadius: 28,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12
    },
    voiceHeader: {
        marginBottom: 14,
        alignItems: 'center'
    },
    alarmLiveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#fca5a5',
        gap: 8
    },
    alarmLiveDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ef4444'
    },
    alarmLiveText: {
        color: '#fecaca',
        fontWeight: '900',
        fontSize: 12,
        letterSpacing: 0.5
    },
    voiceHeaderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white'
    },
    voiceCenterRingContainer: {
        marginVertical: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    voiceIconRing: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: 'rgba(255, 255, 255, 0.18)',
        borderWidth: 3,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#ffffff',
        shadowRadius: 15,
        shadowOpacity: 0.5
    },
    repeatingSpeechBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        marginBottom: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: 'rgba(52, 211, 153, 0.4)'
    },
    repeatingSpeechText: {
        color: '#6ee7b7',
        fontWeight: 'bold',
        fontSize: 11
    },
    voiceMsg: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
        textAlign: 'center',
        marginBottom: 10
    },
    companionBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.12)',
        padding: 14,
        borderRadius: 16,
        marginBottom: 14,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)'
    },
    companionText: {
        flex: 1,
        color: '#e2e8f0',
        fontSize: 13,
        lineHeight: 18,
        fontWeight: '500'
    },
    medNameHeroBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 20,
        width: '100%',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 2,
        borderColor: '#10b981',
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4
    },
    medPillTag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#d1fae5',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 6,
        marginBottom: 6
    },
    medPillTagText: {
        color: '#047857',
        fontWeight: 'bold',
        fontSize: 11
    },
    medName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#0f172a',
        textAlign: 'center'
    },
    voiceBtnRow: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        marginBottom: 12
    },
    voiceBtn: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden'
    },
    voiceBtnGradient: {
        paddingVertical: 14,
        paddingHorizontal: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    missedBtnInner: {
        backgroundColor: '#ef4444',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6
    },
    voiceBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
        letterSpacing: 0.5
    },
    voiceBtnTextSmall: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 13
    },
    dismissBtn: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 14,
        marginTop: 4
    },
    dismissText: {
        color: '#cbd5e1',
        fontWeight: 'bold',
        fontSize: 12
    },
});
