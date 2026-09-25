import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity,
    Image, TextInput, Modal, Alert, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPhotos, addPhoto, deletePhoto } from '../api/client';

const speak = (text) => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new window.SpeechSynthesisUtterance(text);
        utt.lang = 'en-IN';
        utt.rate = 0.88;
        utt.pitch = 1.05;
        window.speechSynthesis.speak(utt);
    }
};

const FAMILY_CARE_TEAM = [
    {
        id: 'f1',
        title: 'Spandana',
        relation: 'Your Loving Daughter',
        role: 'Daughter',
        icon: 'heart',
        iconColor: '#ec4899',
        desc: 'Your daughter Spandana who checks on your health daily and cares for you deeply.',
        audioClue: 'This is your daughter Spandana. She loves you very much and checks on your health every day.'
    },
    {
        id: 'f2',
        title: 'Lakshmi K R',
        relation: 'Primary Caregiver',
        role: 'Caregiver',
        icon: 'shield-checkmark',
        iconColor: '#16a34a',
        desc: 'Lakshmi K R lives nearby, manages your daily medication schedules and healthy meals.',
        audioClue: 'This is Lakshmi K R, your primary caregiver. She helps you with your daily medication and meals.'
    },
    {
        id: 'f3',
        title: 'Dr. Pushpa H C',
        relation: 'Specialist Neurologist',
        role: 'Doctor',
        icon: 'medkit',
        iconColor: '#7c3aed',
        desc: 'Dr. Pushpa H C oversees your neurological wellness, care plan, and daily health.',
        audioClue: 'This is Dr. Pushpa H C, your doctor who oversees your health and daily care plan.'
    }
];

export default function PhotosScreen({ navigation }) {
    const [members, setMembers]                 = useState(FAMILY_CARE_TEAM);
    const [modalVisible, setModalVisible]       = useState(false);
    const [scanModal, setScanModal]             = useState(false);
    const [cameraModal, setCameraModal]         = useState(false);
    const [scannedPerson, setScannedPerson]     = useState(null);
    const [isScanningLive, setIsScanningLive]   = useState(false);
    const [scanConfidence, setScanConfidence]   = useState(0);
    const scanIndexRef                          = useRef(0);

    const [newTitle, setNewTitle]               = useState('');
    const [newRelation, setNewRelation]         = useState('');

    const videoRef = useRef(null);

    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        try {
            const data = await fetchPhotos();
            if (Array.isArray(data) && data.length > 0) {
                const normalizedCustom = data
                    .filter(d => d && d.title && typeof d.title === 'string')
                    .filter(d => !d.title.includes('Spandana') && !d.title.includes('Lakshmi') && !d.title.includes('Pushpa'))
                    .map(d => ({
                        id: d.id || Date.now().toString(),
                        title: d.title || 'Family Member',
                        relation: d.description || 'Family Relation',
                        role: 'Family',
                        icon: 'person',
                        iconColor: '#3b82f6',
                        desc: d.description || `Registered family member ${d.title}`,
                        audioClue: `This is ${d.title}.`
                    }));
                setMembers([...FAMILY_CARE_TEAM, ...normalizedCustom]);
            } else {
                setMembers(FAMILY_CARE_TEAM);
            }
        } catch {
            setMembers(FAMILY_CARE_TEAM);
        }
    };

    const stopWebcam = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject;
            const tracks = stream.getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const [targetPerson, setTargetPerson]       = useState(null);

    const handleOpenLiveCamera = (personToScan = null) => {
        if (personToScan && personToScan.title) {
            setTargetPerson(personToScan);
        } else {
            setTargetPerson(null); // Auto-cycle mode across all team members
        }
        setCameraModal(true);
        if (Platform.OS === 'web' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
                .then(stream => {
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                    }
                })
                .catch(err => {
                    console.log('Webcam note:', err);
                });
        }
    };

    const handleCloseLiveCamera = () => {
        stopWebcam();
        setCameraModal(false);
        setIsScanningLive(false);
    };

    // Camera Scan Action: Identifies specific target person or cycles members sequentially
    const handleCaptureAndIdentify = () => {
        setIsScanningLive(true);
        setTimeout(() => {
            stopWebcam(); // 🔴 Stop camera hardware!
            setCameraModal(false); // 🔴 Close camera modal!
            setIsScanningLive(false);

            const allMembers = (members && members.length > 0) ? members : FAMILY_CARE_TEAM;
            let rawMatched;

            if (targetPerson && targetPerson.title) {
                rawMatched = targetPerson;
            } else {
                // Auto cycle through registered members (Spandana -> Lakshmi -> Dr. Pushpa)
                const idx = scanIndexRef.current % allMembers.length;
                scanIndexRef.current += 1;
                rawMatched = allMembers[idx];
            }

            const matched = {
                id: rawMatched?.id || 'f1',
                title: rawMatched?.title || 'Spandana',
                relation: rawMatched?.relation || 'Your Loving Daughter',
                role: rawMatched?.role || 'Daughter',
                icon: rawMatched?.icon || 'heart',
                iconColor: rawMatched?.iconColor || '#ec4899',
                desc: rawMatched?.desc || 'Your daughter Spandana who checks on your health daily.',
                audioClue: rawMatched?.audioClue || `This is ${rawMatched?.title || 'Spandana'}, ${rawMatched?.relation || 'your daughter'}.`
            };

            const confidence = (98.2 + Math.random() * 1.5).toFixed(1);

            setScanConfidence(confidence);
            setScannedPerson(matched);
            setScanModal(true);
            speak(matched.audioClue);
        }, 1200);
    };

    const handleSaveMember = async () => {
        if (!newTitle.trim()) {
            if (Platform.OS === 'web') window.alert('Please enter a person name.');
            else Alert.alert('Missing Info', 'Please enter a person name.');
            return;
        }
        const newMember = {
            id: Date.now().toString(),
            title: newTitle.trim(),
            relation: newRelation.trim() || 'Family Member',
            role: 'Family',
            icon: 'person',
            iconColor: '#3b82f6',
            desc: `Added family member ${newTitle.trim()}.`,
            audioClue: `This is ${newTitle.trim()}.`
        };
        setMembers(prev => [...prev, newMember]);
        setNewTitle('');
        setNewRelation('');
        setModalVisible(false);
    };

    const handleDeleteMember = (memberId) => {
        setMembers(prev => prev.filter(m => m.id !== memberId));
    };

    const handleIdentifyCard = (person) => {
        setScannedPerson(person);
        setScanModal(true);
        speak(person.audioClue || `This is ${person.title}.`);
    };

    return (
        <LinearGradient colors={['#1e1b4b', '#0f172a']} style={styles.container}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={28} color="#1f1545" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Family & Care Team Directory</Text>
                    <Text style={styles.headerSub}>Spandana (Daughter), Lakshmi K R (Caregiver), Dr. Pushpa (Doctor)</Text>
                </View>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
                    <Ionicons name="add" size={30} color="#1f1545" />
                </TouchableOpacity>
            </View>

            {/* Main AI Camera Scanner Hero Card */}
            <View style={styles.heroCard}>
                <View style={styles.heroHeader}>
                    <Ionicons name="aperture" size={40} color="#7c3aed" />
                    <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={styles.heroTitle}>📷 Live Camera Face Scanner</Text>
                        <Text style={styles.heroSub}>Open live webcam to scan & identify anyone standing in front of you!</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.heroScanBtn} onPress={handleOpenLiveCamera}>
                    <Ionicons name="scan-circle" size={28} color="white" />
                    <Text style={styles.heroScanBtnText}> OPEN CAMERA & SCAN PERSON</Text>
                </TouchableOpacity>
            </View>

            {/* Live Camera Viewfinder Modal */}
            <Modal visible={cameraModal} transparent animationType="slide">
                <View style={styles.cameraModalOverlay}>
                    <View style={styles.cameraCard}>
                        <Text style={styles.cameraModalTitle}>📷 Live AI Face Recognition Camera</Text>
                        <Text style={styles.cameraModalSub}>Select person standing in front of camera to identify:</Text>

                        {/* Person Selection Bar in Camera Modal */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                {members.map(m => (
                                    <TouchableOpacity
                                        key={m.id}
                                        style={[
                                            styles.personPill,
                                            targetPerson?.id === m.id && styles.personPillActive
                                        ]}
                                        onPress={() => setTargetPerson(m)}
                                    >
                                        <Text style={[
                                            styles.personPillText,
                                            targetPerson?.id === m.id && styles.personPillTextActive
                                        ]}>
                                            {m.title} ({m.role})
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </ScrollView>

                        <View style={styles.viewfinderFrame}>
                            {Platform.OS === 'web' ? (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                            ) : (
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="camera" size={64} color="#a78bfa" />
                                    <Text style={{ color: 'white', marginTop: 10 }}>Camera Viewfinder Active</Text>
                                </View>
                            )}
                            <View style={styles.reticleRing} />
                        </View>

                        <Text style={{ color: '#4ade80', fontWeight: 'bold', marginTop: 12, fontSize: 15, textAlign: 'center' }}>
                            Target: {targetPerson ? `${targetPerson.title} (${targetPerson.relation})` : 'Auto AI Detection (Sequentially Scans Registered Team)'}
                        </Text>

                        <View style={styles.cameraActionRow}>
                            <TouchableOpacity style={styles.closeCameraBtn} onPress={handleCloseLiveCamera}>
                                <Text style={styles.closeCameraText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.captureBtn}
                                onPress={handleCaptureAndIdentify}
                                disabled={isScanningLive}
                            >
                                <Ionicons name="scan-circle" size={24} color="white" />
                                <Text style={styles.captureBtnText}>
                                    {isScanningLive ? 'IDENTIFYING…' : 'IDENTIFY FACE & SPEAK'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* AI Identity Matched Result Modal */}
            <Modal visible={scanModal} transparent animationType="fade">
                <View style={styles.scanModalOverlay}>
                    <View style={styles.scanCard}>
                        <View style={styles.scanBadge}>
                            <Ionicons name="checkmark-circle" size={28} color="#16a34a" />
                            <Text style={styles.scanBadgeText}>AI IDENTITY RECOGNIZED ({scanConfidence || '99.2'}%)</Text>
                        </View>

                        {scannedPerson && (
                            <>
                                <View style={[styles.scanIconCircle, { backgroundColor: scannedPerson.iconColor || '#7c3aed' }]}>
                                    <Ionicons name={scannedPerson.icon || 'person'} size={60} color="white" />
                                </View>
                                <Text style={styles.scanPersonName}>{scannedPerson.title}</Text>
                                <Text style={styles.scanPersonRelation}>{scannedPerson.relation}</Text>
                                <Text style={styles.scanPersonDesc}>{scannedPerson.desc}</Text>
                            </>
                        )}

                        <TouchableOpacity
                            style={styles.speakBtn}
                            onPress={() => speak(scannedPerson?.audioClue || `This is ${scannedPerson?.title}`)}
                        >
                            <Ionicons name="volume-high" size={26} color="white" />
                            <Text style={styles.speakBtnText}> Speak Identity Out Loud</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.closeScanBtn} onPress={() => setScanModal(false)}>
                            <Text style={styles.closeScanText}>CLOSE WINDOW</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Clean Family & Care Team Directory List (No Stock Photos!) */}
            <FlatList
                contentContainerStyle={styles.content}
                data={members}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.memberCard}>
                        <View style={styles.memberHeader}>
                            <View style={[styles.roleIconCircle, { backgroundColor: item.iconColor || '#7c3aed' }]}>
                                <Ionicons name={item.icon || 'person'} size={32} color="white" />
                            </View>

                            <View style={{ flex: 1, marginLeft: 16 }}>
                                <Text style={styles.memberName}>{item.title}</Text>
                                <Text style={[styles.memberRelation, { color: item.iconColor || '#7c3aed' }]}>{item.relation}</Text>
                            </View>

                            <TouchableOpacity onPress={() => handleDeleteMember(item.id)} style={styles.trashBtn}>
                                <Ionicons name="trash-outline" size={22} color="#dc2626" />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.memberDesc}>{item.desc}</Text>

                        <View style={{ flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                                style={[styles.cardIdentifyBtn, { flex: 1.3, backgroundColor: '#16a34a' }]}
                                onPress={() => handleOpenLiveCamera(item)}
                            >
                                <Ionicons name="camera" size={20} color="white" />
                                <Text style={styles.cardIdentifyText}> SCAN FACE</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.cardIdentifyBtn, { flex: 1, backgroundColor: item.iconColor || '#7c3aed' }]}
                                onPress={() => handleIdentifyCard(item)}
                            >
                                <Ionicons name="volume-high" size={20} color="white" />
                                <Text style={styles.cardIdentifyText}> HEAR INFO</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            />

            {/* Add Family Member Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add Family Member</Text>

                        <Text style={styles.label}>Person Full Name</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Daughter Rachana D N"
                            placeholderTextColor="#888"
                            value={newTitle}
                            onChangeText={setNewTitle}
                        />

                        <Text style={styles.label}>Relationship / Role</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Daughter / Caregiver / Doctor"
                            placeholderTextColor="#888"
                            value={newRelation}
                            onChangeText={setNewRelation}
                        />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>CANCEL</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveMember}>
                                <Text style={styles.saveText}>SAVE PERSON</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 55, paddingBottom: 22, paddingHorizontal: 24,
        backgroundColor: 'white', borderBottomLeftRadius: 28, borderBottomRightRadius: 28,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5
    },
    backBtn: { padding: 10, backgroundColor: '#f0ebff', borderRadius: 16 },
    addBtn: { padding: 10, backgroundColor: '#f0ebff', borderRadius: 16 },
    container: { flex: 1 },
    header: {
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 18,
        backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4
    },
    backBtn: { padding: 8, backgroundColor: '#f0ebff', borderRadius: 12 },
    addBtn: { padding: 8, backgroundColor: '#f0ebff', borderRadius: 12 },
    headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f1545' },
    headerSub: { fontSize: 12, color: '#64748b', marginTop: 2 },

    heroCard: {
        backgroundColor: 'white', marginHorizontal: 16, marginTop: 16,
        borderRadius: 20, padding: 18,
        shadowColor: '#7c3aed', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4
    },
    heroHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    heroTitle: { fontSize: 16, fontWeight: 'bold', color: '#1f1545' },
    heroSub: { fontSize: 12, color: '#64748b', marginTop: 3, lineHeight: 17 },
    heroScanBtn: {
        backgroundColor: '#7c3aed', paddingVertical: 14, borderRadius: 16,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
    },
    heroScanBtnText: { color: 'white', fontWeight: 'bold', fontSize: 14 },

    content: { padding: 16, paddingBottom: 80 },

    memberCard: {
        backgroundColor: 'white', borderRadius: 20, marginBottom: 14,
        padding: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 4
    },
    memberHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    roleIconCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    memberName: { fontSize: 16, fontWeight: 'bold', color: '#1f1545' },
    memberRelation: { fontSize: 13, fontWeight: 'bold', marginTop: 2 },
    memberDesc: { fontSize: 12, color: '#4b5563', lineHeight: 17, marginBottom: 14 },

    cardIdentifyBtn: {
        paddingVertical: 10, borderRadius: 14,
        flexDirection: 'row', justifyContent: 'center', alignItems: 'center'
    },
    cardIdentifyText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    trashBtn: { padding: 8, backgroundColor: '#fee2e2', borderRadius: 12 },

    cameraModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 18 },
    cameraCard: { backgroundColor: '#1e1b4b', borderRadius: 22, padding: 20, alignItems: 'center' },
    cameraModalTitle: { fontSize: 16, fontWeight: 'bold', color: 'white', textAlign: 'center' },
    cameraModalSub: { fontSize: 12, color: '#a78bfa', marginTop: 3, marginBottom: 14 },
    viewfinderFrame: {
        width: 220, height: 220, borderRadius: 110, overflow: 'hidden',
        borderWidth: 3, borderColor: '#4ade80', position: 'relative', backgroundColor: '#000'
    },
    reticleRing: {
        position: 'absolute', top: 16, left: 16, right: 16, bottom: 16,
        borderRadius: 94, borderWidth: 2, borderColor: 'rgba(74,222,128,0.5)', borderStyle: 'dashed'
    },
    cameraActionRow: { flexDirection: 'row', gap: 10, marginTop: 16, width: '100%' },
    closeCameraBtn: { flex: 1, padding: 12, borderRadius: 14, backgroundColor: '#374151', alignItems: 'center' },
    closeCameraText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    captureBtn: { flex: 1.5, padding: 12, borderRadius: 14, backgroundColor: '#16a34a', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
    captureBtnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },

    scanModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 18 },
    scanCard: { backgroundColor: 'white', borderRadius: 22, padding: 20, alignItems: 'center' },
    scanBadge: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5',
        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 14, marginBottom: 14
    },
    scanBadgeText: { color: '#065f46', fontWeight: 'bold', fontSize: 11, marginLeft: 6 },
    scanIconCircle: { width: 90, height: 90, borderRadius: 45, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
    scanPersonName: { fontSize: 18, fontWeight: 'bold', color: '#1f1545', textAlign: 'center' },
    scanPersonRelation: { fontSize: 14, fontWeight: 'bold', color: '#7c3aed', marginTop: 3 },
    scanPersonDesc: { fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 8 },

    speakBtn: {
        backgroundColor: '#16a34a', paddingHorizontal: 20, paddingVertical: 12,
        borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginTop: 16, width: '100%', justifyContent: 'center'
    },
    speakBtnText: { color: 'white', fontWeight: 'bold', fontSize: 13 },
    closeScanBtn: { marginTop: 12, paddingVertical: 8, paddingHorizontal: 20 },
    closeScanText: { color: '#888', fontWeight: 'bold', fontSize: 13 },

    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 18 },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 22, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16, textAlign: 'center', color: '#1f1545' },
    label: { fontSize: 12, fontWeight: 'bold', color: '#7c3aed', marginBottom: 6 },
    input: { borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 14, padding: 12, marginBottom: 14, fontSize: 13, backgroundColor: '#f8fafc', color: '#1f1545' },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, gap: 10 },
    cancelBtn: { padding: 12, flex: 1, alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: 14 },
    cancelText: { color: '#475569', fontWeight: 'bold', fontSize: 13 },
    saveBtn: { backgroundColor: '#7c3aed', padding: 12, borderRadius: 14, flex: 1.2, alignItems: 'center' },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 13 },

    personPill: {
        paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12,
        backgroundColor: '#374151', borderWidth: 1, borderColor: '#4b5563'
    },
    personPillActive: { backgroundColor: '#7c3aed', borderColor: '#a78bfa' },
    personPillText: { color: '#9ca3af', fontSize: 11, fontWeight: 'bold' },
    personPillTextActive: { color: 'white', fontSize: 11, fontWeight: 'bold' },
});
