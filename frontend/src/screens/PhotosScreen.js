import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Platform, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_H = Dimensions.get('window').height;
const API      = 'http://localhost:8001/api/v1';

const speak = (text) => {
    if (Platform.OS === 'web' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new window.SpeechSynthesisUtterance(text);
        u.lang = 'en-IN'; u.rate = 0.88;
        window.speechSynthesis.speak(u);
    }
};

const MEMBERS_KEY = 'fmd_members_v6';
const rd = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
const wr = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

/* Capture video → JPEG Blob */
const captureBlob = (videoEl) => new Promise((resolve) => {
    const w = videoEl.videoWidth  || 640;
    const h = videoEl.videoHeight || 480;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(videoEl, 0, 0, w, h);
    c.toBlob((blob) => resolve(blob), 'image/jpeg', 0.92);
});

/* Capture video → data URL for preview */
const captureDataURL = (videoEl) => {
    const w = videoEl.videoWidth  || 640;
    const h = videoEl.videoHeight || 480;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(videoEl, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.92);
};

const ICON_COLORS = ['#7c3aed','#16a34a','#dc2626','#d97706','#0284c7','#db2777','#065f46','#1d4ed8'];

export default function PhotosScreen({ navigation }) {
    const [members,    setMembers]    = useState([]);
    const [enrolled,   setEnrolled]   = useState({});

    /* ── Scan modal ── */
    const [scanModal,   setScanModal]   = useState(false);
    const [scanning,    setScanning]    = useState(false);
    const [scanStatus,  setScanStatus]  = useState('');
    const [scanResult,  setScanResult]  = useState(null);   // null | result obj

    /* ── Add-Person modal (with built-in camera) ── */
    const [addModal,     setAddModal]    = useState(false);
    const [addStep,      setAddStep]     = useState('form'); // 'form' | 'camera' | 'preview'
    const [fname,        setFname]       = useState('');
    const [frel,         setFrel]        = useState('');
    const [fdesc,        setFdesc]       = useState('');
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [capturedURL,  setCapturedURL]  = useState(null);
    const [saving,       setSaving]      = useState(false);

    const scanVideoRef = useRef(null);
    const addVideoRef  = useRef(null);

    useEffect(() => {
        const saved = rd(MEMBERS_KEY);
        if (Array.isArray(saved)) setMembers(saved);
        refreshEnrolled();
    }, []);

    const refreshEnrolled = async () => {
        try {
            const r = await fetch(`${API}/face/enrolled`);
            if (r.ok) {
                const data = await r.json();
                const map = {};
                (data.enrolled || []).forEach(e => { map[e.member_id] = e; });
                setEnrolled(map);
            }
        } catch (_) {}
    };

    /* ── Camera helpers ── */
    const startCam = (ref) => {
        if (Platform.OS !== 'web') return;
        navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            .then(s => { if (ref.current) ref.current.srcObject = s; })
            .catch(e => window.alert('Camera error: ' + e.message));
    };
    const stopCam = (ref) => {
        if (ref.current?.srcObject) {
            ref.current.srcObject.getTracks().forEach(t => t.stop());
            ref.current.srcObject = null;
        }
    };

    /* ══════════════════════════════
       SCAN FLOW
    ══════════════════════════════ */
    const openScan = () => {
        setScanResult(null); setScanStatus('');
        setScanModal(true);
        setTimeout(() => startCam(scanVideoRef), 500);
    };
    const closeScan = () => { stopCam(scanVideoRef); setScanModal(false); setScanning(false); setScanStatus(''); };

    const handleScan = async () => {
        if (!scanVideoRef.current) return;
        setScanning(true); setScanStatus('Capturing…');
        try {
            const blob = await captureBlob(scanVideoRef.current);
            stopCam(scanVideoRef);
            setScanStatus('Analyzing face…');
            const form = new FormData();
            form.append('file', blob, 'frame.jpg');
            const res  = await fetch(`${API}/face/recognize`, { method: 'POST', body: form });
            const data = await res.json();
            setScanning(false); setScanStatus('');

            if (data.status === 'recognized') {
                const member = members.find(m => m.id === data.member_id);
                setScanResult({ type: 'known', name: data.member_name, member, confidence: data.confidence });
                speak(`Recognized. This is ${data.member_name}.` + (member?.relation ? ` ${member.relation}.` : ''));
            } else if (data.status === 'no_face') {
                setScanResult({ type: 'no_face' });
                speak('No face detected. Please face the camera directly.');
            } else {
                setScanResult({ type: 'unknown' });
                speak('Not recognized. Please register.');
            }
        } catch (e) {
            setScanning(false); setScanStatus('');
            window.alert('Error: ' + e.message + '\n\nMake sure the backend server is running.');
            closeScan();
        }
    };

    /* ══════════════════════════════
       ADD PERSON FLOW (3 steps)
       Step 1: fill form
       Step 2: take photo
       Step 3: preview → save
    ══════════════════════════════ */
    const openAdd = (fromUnknown = false) => {
        setFname(''); setFrel(''); setFdesc('');
        setCapturedBlob(null); setCapturedURL(null);
        setAddStep('form');
        setScanModal(false);
        setAddModal(true);
    };

    const goToCamera = () => {
        if (!fname.trim()) { window.alert('Please enter the person\'s name first.'); return; }
        setAddStep('camera');
        setTimeout(() => startCam(addVideoRef), 500);
    };

    const takePhoto = async () => {
        if (!addVideoRef.current) return;
        const blob = await captureBlob(addVideoRef.current);
        const url  = captureDataURL(addVideoRef.current);
        stopCam(addVideoRef);
        setCapturedBlob(blob);
        setCapturedURL(url);
        setAddStep('preview');
    };

    const retakePhoto = () => {
        setCapturedBlob(null); setCapturedURL(null);
        setAddStep('camera');
        setTimeout(() => startCam(addVideoRef), 400);
    };

    const savePerson = async () => {
        if (!capturedBlob) { window.alert('Please take a photo first.'); return; }
        setSaving(true);
        const id = `m_${Date.now()}`;
        const colorIdx = members.length % ICON_COLORS.length;
        const member = {
            id,
            name:     fname.trim(),
            relation: frel.trim() || 'Family Member',
            desc:     fdesc.trim() || `${fname.trim()} is a registered family member.`,
            color:    ICON_COLORS[colorIdx],
            icon:     'person',
        };

        /* Register face on backend */
        try {
            const form = new FormData();
            form.append('file', capturedBlob, 'face.jpg');
            form.append('member_id', id);
            form.append('member_name', fname.trim());
            const res = await fetch(`${API}/face/register`, { method: 'POST', body: form });
            if (!res.ok) {
                const err = await res.json();
                window.alert('Face register warning: ' + (err.message || err.detail));
            }
        } catch (e) {
            window.alert('Could not save face to backend: ' + e.message);
        }

        /* Save member locally */
        const upd = [...members, member];
        setMembers(upd); wr(MEMBERS_KEY, upd);
        await refreshEnrolled();
        setSaving(false);
        setAddModal(false);
        speak(`${fname.trim()} has been added and their face registered. You can now scan them.`);
    };

    const closeAdd = () => {
        stopCam(addVideoRef);
        setAddModal(false);
    };

    /* ── Delete ── */
    const handleDeleteMember = async (id, name) => {
        if (!window.confirm(`Remove ${name} from the directory?`)) return;
        try { await fetch(`${API}/face/${id}`, { method: 'DELETE' }); } catch (_) {}
        const upd = members.filter(m => m.id !== id);
        setMembers(upd); wr(MEMBERS_KEY, upd);
        await refreshEnrolled();
    };

    const handleClearAll = async () => {
        if (!window.confirm('Delete ALL members and face data?')) return;
        for (const m of members) {
            try { await fetch(`${API}/face/${m.id}`, { method: 'DELETE' }); } catch (_) {}
        }
        setMembers([]); wr(MEMBERS_KEY, []); setEnrolled({});
    };

    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <View style={[styles.root, { height: SCREEN_H }]}>

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1f1545" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.hTitle}>🧠 Family Memory Directory</Text>
                    <Text style={styles.hSub}>{members.length} people · {Object.keys(enrolled).length} faces registered</Text>
                </View>
                <TouchableOpacity onPress={handleClearAll} style={[styles.hBtn, { backgroundColor: '#fee2e2', marginRight: 6 }]}>
                    <Ionicons name="trash" size={20} color="#dc2626" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openAdd()} style={styles.hBtn}>
                    <Ionicons name="person-add" size={22} color="#1f1545" />
                </TouchableOpacity>
            </View>

            {/* Scroll content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>

                {/* SCAN hero button */}
                <TouchableOpacity style={styles.heroBtn} onPress={openScan}>
                    <Ionicons name="scan-circle" size={28} color="white" />
                    <Text style={styles.heroBtnTxt}>  📷 OPEN CAMERA & SCAN FACE</Text>
                </TouchableOpacity>

                {/* How it works */}
                <View style={styles.stepsCard}>
                    <Text style={styles.stepsTitle}>📋 How it works</Text>
                    <Text style={styles.stepRow}>1️⃣  Tap ➕ to add a person → fill name → take their photo → Save</Text>
                    <Text style={styles.stepRow}>2️⃣  Tap <Text style={{ fontWeight: 'bold' }}>SCAN FACE</Text> above → point at them → Identify instantly ✅</Text>
                </View>

                {/* Empty state */}
                {members.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={52} color="#a78bfa" />
                        <Text style={styles.emptyTitle}>No People Registered Yet</Text>
                        <Text style={styles.emptySub}>Tap ➕ above to add someone with their photo.</Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => openAdd()}>
                            <Ionicons name="person-add" size={18} color="white" />
                            <Text style={styles.emptyBtnTxt}>  Add First Person</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {members.length > 0 && (
                    <Text style={styles.section}>👥 Registered People ({members.length})</Text>
                )}

                {members.map(item => (
                    <View key={item.id} style={styles.card}>
                        <View style={styles.cardTop}>
                            <View style={[styles.avatar, { backgroundColor: item.color }]}>
                                <Ionicons name="person" size={26} color="white" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 12 }}>
                                <Text style={styles.cardName}>{item.name}</Text>
                                <Text style={[styles.cardRel, { color: item.color }]}>{item.relation}</Text>
                                <View style={styles.faceTag}>
                                    <Ionicons
                                        name={enrolled[item.id] ? 'checkmark-circle' : 'alert-circle'}
                                        size={13}
                                        color={enrolled[item.id] ? '#16a34a' : '#f59e0b'}
                                    />
                                    <Text style={{ fontSize: 11, color: enrolled[item.id] ? '#16a34a' : '#f59e0b', marginLeft: 4 }}>
                                        {enrolled[item.id] ? 'Face registered ✓' : 'No face — tap Update Photo'}
                                    </Text>
                                </View>
                            </View>
                            <TouchableOpacity style={styles.delBtn} onPress={() => handleDeleteMember(item.id, item.name)}>
                                <Ionicons name="trash-outline" size={18} color="#dc2626" />
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.cardDesc}>{item.desc}</Text>
                        <View style={styles.cardBtns}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: item.color }]}
                                onPress={() => speak(`This is ${item.name}. ${item.relation}. ${item.desc}`)}>
                                <Ionicons name="volume-high" size={15} color="white" />
                                <Text style={styles.btnTxt}>  Hear Info</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#6b7280' }]}
                                onPress={() => {
                                    setFname(item.name); setFrel(item.relation); setFdesc(item.desc);
                                    setCapturedBlob(null); setCapturedURL(null);
                                    setAddStep('camera'); setAddModal(true);
                                    setTimeout(() => startCam(addVideoRef), 500);
                                }}>
                                <Ionicons name="camera" size={15} color="white" />
                                <Text style={styles.btnTxt}>  Update Photo</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* ════ SCAN MODAL ════ */}
            <Modal visible={scanModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.camBox}>

                        {!scanResult ? (
                            /* Camera view */
                            <>
                                <Text style={styles.camTitle}>🔍 Scan Face</Text>
                                <Text style={styles.camSub}>Point camera at the person and tap IDENTIFY</Text>

                                <View style={styles.finder}>
                                    {Platform.OS === 'web'
                                        ? <video ref={scanVideoRef} autoPlay playsInline muted
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <View style={styles.finderPh}><Ionicons name="camera" size={58} color="#a78bfa" /></View>
                                    }
                                    <View style={styles.reticle} />
                                    {scanning && (
                                        <View style={styles.scanLayer}>
                                            <ActivityIndicator size="large" color="#4ade80" />
                                            <Text style={styles.scanTxt}>{scanStatus}</Text>
                                        </View>
                                    )}
                                </View>

                                <View style={styles.camBtns}>
                                    <TouchableOpacity style={styles.camCancel} onPress={closeScan} disabled={scanning}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>CANCEL</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.camAction, scanning && { opacity: 0.5 }]}
                                        onPress={handleScan} disabled={scanning}>
                                        <Ionicons name="scan" size={20} color="white" />
                                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6 }}>
                                            {scanning ? 'Analyzing…' : 'IDENTIFY'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        ) : (
                            /* Result view */
                            <>
                                {scanResult.type === 'known' && (
                                    <>
                                        <Text style={styles.resultEmoji}>✅</Text>
                                        <View style={[styles.resultBadge, { backgroundColor: '#d1fae5' }]}>
                                            <Text style={{ color: '#065f46', fontWeight: 'bold', fontSize: 12 }}>
                                                RECOGNIZED  ({scanResult.confidence}% match)
                                            </Text>
                                        </View>
                                        <View style={[styles.bigIcon, { backgroundColor: scanResult.member?.color || '#16a34a' }]}>
                                            <Ionicons name="person" size={50} color="white" />
                                        </View>
                                        <Text style={styles.rName}>{scanResult.name}</Text>
                                        {scanResult.member?.relation && (
                                            <Text style={[styles.rRel, { color: scanResult.member.color }]}>
                                                {scanResult.member.relation}
                                            </Text>
                                        )}
                                        {scanResult.member?.desc && (
                                            <Text style={styles.rDesc}>{scanResult.member.desc}</Text>
                                        )}
                                        <TouchableOpacity style={[styles.rBtn, { backgroundColor: '#16a34a' }]}
                                            onPress={() => speak(`This is ${scanResult.name}. ${scanResult.member?.relation || ''}. ${scanResult.member?.desc || ''}`)}>
                                            <Ionicons name="volume-high" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  🔊 READ ALOUD</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {scanResult.type === 'unknown' && (
                                    <>
                                        <Text style={styles.resultEmoji}>❓</Text>
                                        <View style={[styles.resultBadge, { backgroundColor: '#fee2e2' }]}>
                                            <Text style={{ color: '#991b1b', fontWeight: 'bold', fontSize: 13 }}>
                                                ❓ NOT RECOGNIZED
                                            </Text>
                                        </View>
                                        <View style={[styles.bigIcon, { backgroundColor: '#6b7280' }]}>
                                            <Ionicons name="person-outline" size={50} color="white" />
                                        </View>
                                        <Text style={styles.rName}>Not Recognized</Text>
                                        <Text style={styles.rDesc}>
                                            This person is not registered in the directory.{'\n\n'}
                                            👉 Please tap <Text style={{ fontWeight: 'bold' }}>REGISTER</Text> below to add them.
                                        </Text>
                                        <TouchableOpacity style={[styles.rBtn, { backgroundColor: '#7c3aed' }]}
                                            onPress={() => openAdd(true)}>
                                            <Ionicons name="person-add" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  PLEASE REGISTER</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                {scanResult.type === 'no_face' && (
                                    <>
                                        <Text style={styles.resultEmoji}>⚠️</Text>
                                        <View style={[styles.resultBadge, { backgroundColor: '#fef3c7' }]}>
                                            <Text style={{ color: '#92400e', fontWeight: 'bold', fontSize: 12 }}>
                                                NO FACE DETECTED
                                            </Text>
                                        </View>
                                        <Text style={styles.rName}>No Face Found</Text>
                                        <Text style={styles.rDesc}>
                                            • Face the camera directly{'\n'}
                                            • Ensure good lighting{'\n'}
                                            • Move closer
                                        </Text>
                                        <TouchableOpacity style={[styles.rBtn, { backgroundColor: '#16a34a' }]}
                                            onPress={() => { setScanResult(null); setTimeout(() => startCam(scanVideoRef), 400); }}>
                                            <Ionicons name="camera" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  TRY AGAIN</Text>
                                        </TouchableOpacity>
                                    </>
                                )}

                                <TouchableOpacity style={{ marginTop: 14 }} onPress={closeScan}>
                                    <Text style={{ color: '#888', fontWeight: 'bold', textAlign: 'center' }}>CLOSE</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ════ ADD PERSON MODAL (3-step) ════ */}
            <Modal visible={addModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.formBox}>

                        {/* ── Step 1: Form ── */}
                        {addStep === 'form' && (
                            <>
                                <Text style={styles.formTitle}>➕ Add Person</Text>
                                <Text style={styles.formSub}>Fill in the details, then take their photo.</Text>

                                <Text style={styles.label}>Full Name *</Text>
                                <TextInput style={styles.input} placeholder="e.g. Rachana" placeholderTextColor="#aaa"
                                    value={fname} onChangeText={setFname} />

                                <Text style={styles.label}>Relationship / Role</Text>
                                <TextInput style={styles.input} placeholder="e.g. Daughter / Son / Caregiver"
                                    placeholderTextColor="#aaa" value={frel} onChangeText={setFrel} />

                                <Text style={styles.label}>About them (optional)</Text>
                                <TextInput style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                                    placeholder="Short description…" placeholderTextColor="#aaa"
                                    multiline value={fdesc} onChangeText={setFdesc} />

                                <TouchableOpacity style={styles.nextBtn} onPress={goToCamera}>
                                    <Ionicons name="camera" size={20} color="white" />
                                    <Text style={styles.nextBtnTxt}>  NEXT: TAKE PHOTO</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={closeAdd}>
                                    <Text style={{ color: '#888', fontWeight: 'bold' }}>CANCEL</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── Step 2: Camera ── */}
                        {addStep === 'camera' && (
                            <>
                                <Text style={styles.formTitle}>📸 Take Photo</Text>
                                <Text style={styles.formSub}>
                                    {fname} — look straight at the camera{'\n'}with good lighting, then tap CAPTURE
                                </Text>

                                <View style={styles.finder}>
                                    {Platform.OS === 'web'
                                        ? <video ref={addVideoRef} autoPlay playsInline muted
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : <View style={styles.finderPh}><Ionicons name="camera" size={58} color="#a78bfa" /></View>
                                    }
                                    <View style={styles.reticle} />
                                </View>

                                <View style={styles.camBtns}>
                                    <TouchableOpacity style={styles.camCancel}
                                        onPress={() => { stopCam(addVideoRef); setAddStep('form'); }}>
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>← BACK</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.camAction} onPress={takePhoto}>
                                        <Ionicons name="radio-button-on" size={20} color="white" />
                                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6 }}>CAPTURE</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}

                        {/* ── Step 3: Preview ── */}
                        {addStep === 'preview' && (
                            <>
                                <Text style={styles.formTitle}>✅ Photo Captured!</Text>
                                <Text style={styles.formSub}>Adding: <Text style={{ fontWeight: 'bold' }}>{fname}</Text></Text>

                                {capturedURL && Platform.OS === 'web' && (
                                    <img src={capturedURL} alt="preview"
                                        style={{ width: 200, height: 200, borderRadius: 100, objectFit: 'cover',
                                            alignSelf: 'center', marginVertical: 12, border: '3px solid #7c3aed' }} />
                                )}

                                {saving ? (
                                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                                        <ActivityIndicator size="large" color="#7c3aed" />
                                        <Text style={{ color: '#7c3aed', marginTop: 8 }}>Registering face…</Text>
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity style={styles.nextBtn} onPress={savePerson}>
                                            <Ionicons name="checkmark-circle" size={20} color="white" />
                                            <Text style={styles.nextBtnTxt}>  SAVE & REGISTER</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.nextBtn, { backgroundColor: '#6b7280', marginTop: 8 }]}
                                            onPress={retakePhoto}>
                                            <Ionicons name="refresh" size={18} color="white" />
                                            <Text style={styles.nextBtnTxt}>  RETAKE PHOTO</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={closeAdd}>
                                    <Text style={{ color: '#888', fontWeight: 'bold' }}>CANCEL</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

/* ══════════════ STYLES ══════════════ */
const C = { purple: '#7c3aed', green: '#16a34a', bg: '#1e1b4b' };

const styles = StyleSheet.create({
    root:   { flex: 1, backgroundColor: C.bg, overflow: 'hidden' },

    header: {
        paddingTop: 50, paddingBottom: 14, paddingHorizontal: 16,
        backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, elevation: 5,
    },
    hBtn:   { padding: 8, backgroundColor: '#f0ebff', borderRadius: 12 },
    hTitle: { fontSize: 15, fontWeight: 'bold', color: '#1f1545' },
    hSub:   { fontSize: 11, color: '#64748b', marginTop: 2 },

    scrollContent: { padding: 16, paddingBottom: 80 },

    heroBtn:    { backgroundColor: C.purple, paddingVertical: 18, borderRadius: 18,
                  flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
                  marginBottom: 14, shadowColor: C.purple, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    heroBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    stepsCard:  { backgroundColor: '#f5f3ff', borderRadius: 14, padding: 14, marginBottom: 16,
                  borderWidth: 1, borderColor: '#ddd6fe' },
    stepsTitle: { fontSize: 13, fontWeight: 'bold', color: '#5b21b6', marginBottom: 8 },
    stepRow:    { fontSize: 12, color: '#4c1d95', lineHeight: 22 },

    emptyCard:  { alignItems: 'center', padding: 30 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#a78bfa', marginTop: 12 },
    emptySub:   { fontSize: 12, color: '#6d28d9', marginTop: 6, textAlign: 'center' },
    emptyBtn:   { backgroundColor: C.purple, paddingVertical: 12, paddingHorizontal: 24,
                  borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginTop: 16 },
    emptyBtnTxt:{ color: 'white', fontWeight: 'bold' },

    section: { color: '#a78bfa', fontWeight: 'bold', fontSize: 13, marginBottom: 12 },

    card:    { backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 14,
               shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    avatar:  { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
    cardName:{ fontSize: 15, fontWeight: 'bold', color: '#1f1545' },
    cardRel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
    faceTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    cardDesc:{ fontSize: 12, color: '#4b5563', lineHeight: 17, marginBottom: 10 },
    delBtn:  { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10, marginLeft: 6 },

    cardBtns:{ flexDirection: 'row', gap: 10 },
    btn:     { flex: 1, paddingVertical: 10, borderRadius: 12,
               flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
    btnTxt:  { color: 'white', fontWeight: 'bold', fontSize: 12 },

    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', padding: 18 },

    camBox:  { backgroundColor: '#1e1b4b', borderRadius: 24, padding: 20, alignItems: 'center' },
    camTitle:{ color: 'white', fontWeight: 'bold', fontSize: 17, textAlign: 'center' },
    camSub:  { color: '#a78bfa', fontSize: 11, marginTop: 4, marginBottom: 14, textAlign: 'center', lineHeight: 17 },

    finder:  { width: 240, height: 240, borderRadius: 120, overflow: 'hidden',
               borderWidth: 3, borderColor: '#4ade80', position: 'relative', backgroundColor: '#000',
               marginBottom: 16 },
    finderPh:{ flex: 1, justifyContent: 'center', alignItems: 'center' },
    reticle: { position: 'absolute', inset: 16, borderRadius: 100,
               borderWidth: 2, borderColor: 'rgba(74,222,128,0.4)', borderStyle: 'dashed' },
    scanLayer:{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.65)',
                justifyContent: 'center', alignItems: 'center', gap: 10 },
    scanTxt:  { color: '#4ade80', fontWeight: 'bold', fontSize: 13 },

    camBtns:  { flexDirection: 'row', gap: 10, width: '100%' },
    camCancel:{ flex: 1, padding: 13, borderRadius: 14, backgroundColor: '#374151', alignItems: 'center' },
    camAction:{ flex: 1.8, padding: 13, borderRadius: 14, backgroundColor: C.green,
                flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },

    resultEmoji: { fontSize: 48, textAlign: 'center', marginBottom: 8 },
    resultBadge: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14, marginBottom: 14 },
    bigIcon:     { width: 86, height: 86, borderRadius: 43, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    rName:       { fontSize: 20, fontWeight: 'bold', color: 'white', textAlign: 'center' },
    rRel:        { fontSize: 13, fontWeight: 'bold', marginTop: 3, textAlign: 'center' },
    rDesc:       { fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 18, paddingHorizontal: 6 },
    rBtn:        { paddingHorizontal: 20, paddingVertical: 13, borderRadius: 16,
                   flexDirection: 'row', alignItems: 'center', marginTop: 14, width: '100%', justifyContent: 'center' },
    rBtnTxt:     { color: 'white', fontWeight: 'bold', fontSize: 14 },

    formBox:    { backgroundColor: 'white', borderRadius: 22, padding: 22 },
    formTitle:  { fontSize: 17, fontWeight: 'bold', color: '#1f1545', textAlign: 'center', marginBottom: 4 },
    formSub:    { fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 14, lineHeight: 17 },
    label:      { fontSize: 12, fontWeight: 'bold', color: C.purple, marginBottom: 5 },
    input:      { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 12, padding: 12,
                  marginBottom: 12, fontSize: 13, color: '#1f1545', backgroundColor: '#f8fafc' },
    nextBtn:    { backgroundColor: C.purple, paddingVertical: 14, borderRadius: 16,
                  flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
    nextBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});
