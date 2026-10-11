import React, { useEffect, useState, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, Modal, Platform, ActivityIndicator, Dimensions, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const SCREEN_H = Dimensions.get('window').height;
import { API_URL as API } from '../api/client';

const speak = (text) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const u = new window.SpeechSynthesisUtterance(text);
        u.lang = 'en-IN';
        u.rate = 0.88;
        window.speechSynthesis.speak(u);
    }
};

const MEMBERS_KEY = 'fmd_members_v7';
const rd = (k) => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            const v = window.localStorage.getItem(k);
            return v ? JSON.parse(v) : null;
        }
    } catch (_) {}
    return null;
};
const wr = (k, v) => {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(k, JSON.stringify(v));
        }
    } catch (_) {}
};

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
    const [members,     setMembers]     = useState([]);
    const [enrolled,    setEnrolled]    = useState({});
    const [isSyncing,   setIsSyncing]   = useState(false);

    /* ── Scan modal ── */
    const [scanModal,   setScanModal]   = useState(false);
    const [scanning,    setScanning]    = useState(false);
    const [scanStatus,  setScanStatus]  = useState('');
    const [scanResult,  setScanResult]  = useState(null);

    /* ── Add-Person modal (with camera & file upload) ── */
    const [addModal,     setAddModal]    = useState(false);
    const [addStep,      setAddStep]     = useState('form'); // 'form' | 'camera' | 'preview'
    const [fname,        setFname]       = useState('');
    const [frel,         setFrel]        = useState('');
    const [fdesc,        setFdesc]       = useState('');
    const [capturedBlob, setCapturedBlob] = useState(null);
    const [capturedURL,  setCapturedURL]  = useState(null);
    const [saving,       setSaving]      = useState(false);

    const scanVideoRef  = useRef(null);
    const addVideoRef   = useRef(null);
    const fileInputRef  = useRef(null);

    /* ── Master Member Sync (Server Authoritative) ── */
    const loadMembers = async () => {
        // Fast instant render from local cache
        const saved = rd(MEMBERS_KEY);
        if (Array.isArray(saved) && saved.length > 0 && members.length === 0) {
            setMembers(saved);
            const map = {};
            saved.forEach(e => { map[e.id || e.member_id] = e; });
            setEnrolled(map);
        }

        try {
            setIsSyncing(true);
            const r = await fetch(`${API}/face/members`);
            if (r.ok) {
                const data = await r.json();
                const list = data.members || data.enrolled || [];
                if (Array.isArray(list)) {
                    setMembers(list);
                    wr(MEMBERS_KEY, list);
                    const map = {};
                    list.forEach(e => { map[e.id || e.member_id] = e; });
                    setEnrolled(map);
                }
            } else {
                // Fallback to /enrolled
                const r2 = await fetch(`${API}/face/enrolled`);
                if (r2.ok) {
                    const data2 = await r2.json();
                    const list2 = data2.enrolled || data2.members || [];
                    if (Array.isArray(list2) && list2.length > 0) {
                        setMembers(list2);
                        wr(MEMBERS_KEY, list2);
                        const map = {};
                        list2.forEach(e => { map[e.id || e.member_id] = e; });
                        setEnrolled(map);
                    }
                }
            }
        } catch (_) {
            // Keep cached members on network glitch
        } finally {
            setIsSyncing(false);
        }
    };

    useEffect(() => {
        loadMembers();
        // Periodic background polling ensures cross-phone real-time sync
        const timer = setInterval(loadMembers, 8000);
        return () => clearInterval(timer);
    }, []);

    /* ── Camera helpers ── */
    const startCam = (ref) => {
        if (Platform.OS !== 'web') return;
        navigator.mediaDevices?.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })
            .then(s => { if (ref.current) ref.current.srcObject = s; })
            .catch(e => {
                console.warn('Camera error:', e.message);
                if (Platform.OS === 'web') {
                    window.alert('Camera notice: ' + e.message + '\nYou can also choose "Upload Photo from Device".');
                }
            });
    };

    const stopCam = (ref) => {
        if (ref.current?.srcObject) {
            ref.current.srcObject.getTracks().forEach(t => t.stop());
            ref.current.srcObject = null;
        }
    };

    /* ══════════════════════════════
       SCAN & RECOGNIZE FLOW
    ══════════════════════════════ */
    const openScan = () => {
        setScanResult(null);
        setScanStatus('');
        setScanModal(true);
        setTimeout(() => startCam(scanVideoRef), 450);
    };

    const closeScan = () => {
        stopCam(scanVideoRef);
        setScanModal(false);
        setScanning(false);
        setScanStatus('');
    };

    const handleScan = async () => {
        if (!scanVideoRef.current) return;
        setScanning(true);
        setScanStatus('Capturing frame…');
        try {
            const blob = await captureBlob(scanVideoRef.current);
            stopCam(scanVideoRef);
            setScanStatus('Analyzing facial contours…');
            const form = new FormData();
            form.append('file', blob, 'frame.jpg');

            const res = await fetch(`${API}/face/recognize`, { method: 'POST', body: form });
            let data;
            try {
                data = await res.json();
            } catch (_) {
                throw new Error(`Server returned status ${res.status}`);
            }
            setScanning(false);
            setScanStatus('');

            if (data.status === 'recognized') {
                const member = members.find(m => (m.id === data.member_id || m.member_id === data.member_id));
                const dispName = data.member_name || data.name || member?.name || 'Family Member';
                const dispRel  = data.relation || member?.relation || 'Family Member';
                const dispDesc = data.desc || member?.desc || `${dispName} is a registered family member.`;
                const dispColor= data.color || member?.color || '#16a34a';
                const dispPhoto= data.photo_url || member?.photo_url || `/face/${data.member_id}/photo`;

                setScanResult({
                    type: 'known',
                    name: dispName,
                    relation: dispRel,
                    desc: dispDesc,
                    color: dispColor,
                    photo_url: dispPhoto,
                    confidence: data.confidence,
                    member
                });
                speak(`Recognized. This is ${dispName}, your ${dispRel}.`);
            } else if (data.status === 'no_face') {
                setScanResult({ type: 'no_face' });
                speak('No face detected. Please face the camera directly with good lighting.');
            } else if (data.status === 'error') {
                setScanResult({ type: 'unknown' });
                speak('Could not identify. Please try again.');
            } else {
                setScanResult({ type: 'unknown' });
                speak('Not recognized. Please register in the directory.');
            }
        } catch (e) {
            setScanning(false);
            setScanStatus('');
            if (Platform.OS === 'web') {
                window.alert('Face Recognition: ' + e.message);
            }
            closeScan();
        }
    };

    /* ══════════════════════════════
       ADD PERSON FLOW (Camera or File)
    ══════════════════════════════ */
    const openAdd = () => {
        setFname('');
        setFrel('');
        setFdesc('');
        setCapturedBlob(null);
        setCapturedURL(null);
        setAddStep('form');
        setScanModal(false);
        setAddModal(true);
    };

    const goToCamera = () => {
        if (!fname.trim()) {
            if (Platform.OS === 'web') window.alert('Please enter the person\'s name first.');
            return;
        }
        setAddStep('camera');
        setTimeout(() => startCam(addVideoRef), 450);
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
        setCapturedBlob(null);
        setCapturedURL(null);
        setAddStep('camera');
        setTimeout(() => startCam(addVideoRef), 400);
    };

    const handlePickFile = (e) => {
        const file = e.target?.files?.[0];
        if (!file) return;
        setCapturedBlob(file);
        const reader = new FileReader();
        reader.onload = (ev) => {
            setCapturedURL(ev.target.result);
            stopCam(addVideoRef);
            setAddStep('preview');
        };
        reader.readAsDataURL(file);
    };

    const savePerson = async () => {
        if (!capturedBlob) {
            if (Platform.OS === 'web') window.alert('Please capture or upload a photo first.');
            return;
        }
        setSaving(true);
        const id = `m_${Date.now()}`;
        const colorIdx = members.length % ICON_COLORS.length;
        const relStr = frel.trim() || 'Family Member';
        const descStr= fdesc.trim() || `${fname.trim()} is a registered family member.`;
        const colStr = ICON_COLORS[colorIdx];

        /* Register face on central backend */
        try {
            const form = new FormData();
            form.append('file', capturedBlob, 'face.jpg');
            form.append('member_id', id);
            form.append('member_name', fname.trim());
            form.append('relation', relStr);
            form.append('desc', descStr);
            form.append('color', colStr);
            form.append('icon', 'person');

            const res = await fetch(`${API}/face/register`, { method: 'POST', body: form });
            let err = null;
            try {
                const json = await res.json();
                if (!res.ok || json.status === 'error') err = json.message || json.detail;
            } catch (_) {
                if (!res.ok) err = `Server returned status ${res.status}`;
            }
            if (err && Platform.OS === 'web') {
                window.alert('Face Register Notice: ' + err);
            }
        } catch (e) {
            if (Platform.OS === 'web') window.alert('Could not save face to backend: ' + e.message);
        }

        /* Reload authoritative synced list from cloud server */
        await loadMembers();
        setSaving(false);
        setAddModal(false);
        speak(`${fname.trim()} has been saved to your family directory and their face registered.`);
    };

    const closeAdd = () => {
        stopCam(addVideoRef);
        setAddModal(false);
    };

    /* ── Delete ── */
    const handleDeleteMember = async (id, name) => {
        if (Platform.OS === 'web' && !window.confirm(`Remove ${name} from the directory on all devices?`)) return;
        try {
            await fetch(`${API}/face/${id}`, { method: 'DELETE' });
        } catch (_) {}
        await loadMembers();
    };

    const handleClearAll = async () => {
        if (Platform.OS === 'web' && !window.confirm('Delete ALL members and face data from all devices?')) return;
        try {
            await fetch(`${API}/face/all`, { method: 'DELETE' });
        } catch (_) {}
        await loadMembers();
    };

    /* ══════════════════════════════════════════
       RENDER
    ══════════════════════════════════════════ */
    return (
        <View style={[styles.root, { height: SCREEN_H }]}>

            {/* Hidden File Input for mobile/web upload */}
            {Platform.OS === 'web' && (
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handlePickFile}
                />
            )}

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.hBtn}>
                    <Ionicons name="arrow-back" size={24} color="#1f1545" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={styles.hTitle}>🧠 Family Memory Directory</Text>
                    <Text style={styles.hSub}>
                        {members.length} {members.length === 1 ? 'person' : 'people'} · {Object.keys(enrolled).length} faces registered
                        {isSyncing ? ' · 🔄 Syncing…' : ' · ☁️ Synced'}
                    </Text>
                </View>
                <TouchableOpacity onPress={loadMembers} style={[styles.hBtn, { backgroundColor: '#ede9fe', marginRight: 6 }]}>
                    <Ionicons name="sync" size={18} color="#7c3aed" />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleClearAll} style={[styles.hBtn, { backgroundColor: '#fee2e2', marginRight: 6 }]}>
                    <Ionicons name="trash" size={18} color="#dc2626" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => openAdd()} style={[styles.hBtn, { backgroundColor: '#7c3aed' }]}>
                    <Ionicons name="person-add" size={20} color="white" />
                </TouchableOpacity>
            </View>

            {/* Scroll content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator>

                {/* SCAN hero button */}
                <TouchableOpacity style={styles.heroBtn} onPress={openScan}>
                    <Ionicons name="scan-circle" size={28} color="white" />
                    <Text style={styles.heroBtnTxt}>  📷 OPEN CAMERA & SCAN FACE</Text>
                </TouchableOpacity>

                {/* Sync & Multi-Phone Notice */}
                <View style={styles.syncNoticeCard}>
                    <Ionicons name="cloud-done" size={20} color="#059669" />
                    <Text style={styles.syncNoticeTxt}>
                        Registered photos sync automatically across all phones logged into this account.
                    </Text>
                </View>

                {/* Empty state */}
                {members.length === 0 && (
                    <View style={styles.emptyCard}>
                        <Ionicons name="people-outline" size={54} color="#a78bfa" />
                        <Text style={styles.emptyTitle}>No People Registered Yet</Text>
                        <Text style={styles.emptySub}>
                            Tap ➕ Add Person to enroll family members, caregivers, or doctors with their photos.
                        </Text>
                        <TouchableOpacity style={styles.emptyBtn} onPress={() => openAdd()}>
                            <Ionicons name="person-add" size={18} color="white" />
                            <Text style={styles.emptyBtnTxt}>  Add First Person</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {members.length > 0 && (
                    <Text style={styles.section}>👥 Registered Family & Caregivers ({members.length})</Text>
                )}

                {members.map(item => {
                    const photoSrc = item.photo_url
                        ? (item.photo_url.startsWith('http') ? item.photo_url : `${API}${item.photo_url}`)
                        : `${API}/face/${item.id || item.member_id}/photo`;

                    return (
                        <View key={item.id || item.member_id} style={styles.card}>
                            <View style={styles.cardTop}>
                                {/* Photo Avatar with image rendering */}
                                <View style={[styles.avatarWrap, { borderColor: item.color || '#7c3aed' }]}>
                                    {Platform.OS === 'web' ? (
                                        <img
                                            src={photoSrc}
                                            alt={item.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.parentElement.classList.add('fallback-icon');
                                            }}
                                        />
                                    ) : (
                                        <Image
                                            source={{ uri: photoSrc }}
                                            style={styles.avatarPhoto}
                                        />
                                    )}
                                </View>

                                <View style={{ flex: 1, marginLeft: 14 }}>
                                    <Text style={styles.cardName}>{item.name}</Text>
                                    <Text style={[styles.cardRel, { color: item.color || '#7c3aed' }]}>{item.relation}</Text>
                                    <View style={styles.faceTag}>
                                        <Ionicons
                                            name="checkmark-circle"
                                            size={13}
                                            color="#16a34a"
                                        />
                                        <Text style={{ fontSize: 11, color: '#16a34a', fontWeight: '600', marginLeft: 4 }}>
                                            Face enrolled ✓ (Synced on all phones)
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.delBtn}
                                    onPress={() => handleDeleteMember(item.id || item.member_id, item.name)}
                                >
                                    <Ionicons name="trash-outline" size={18} color="#dc2626" />
                                </TouchableOpacity>
                            </View>

                            <Text style={styles.cardDesc}>{item.desc}</Text>

                            <View style={styles.cardBtns}>
                                <TouchableOpacity
                                    style={[styles.btn, { backgroundColor: item.color || '#7c3aed' }]}
                                    onPress={() => speak(`This is ${item.name}. ${item.relation}. ${item.desc}`)}
                                >
                                    <Ionicons name="volume-high" size={15} color="white" />
                                    <Text style={styles.btnTxt}>  Hear Info</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.btn, { backgroundColor: '#475569' }]}
                                    onPress={() => {
                                        setFname(item.name);
                                        setFrel(item.relation);
                                        setFdesc(item.desc);
                                        setCapturedBlob(null);
                                        setCapturedURL(null);
                                        setAddStep('camera');
                                        setAddModal(true);
                                        setTimeout(() => startCam(addVideoRef), 450);
                                    }}
                                >
                                    <Ionicons name="camera" size={15} color="white" />
                                    <Text style={styles.btnTxt}>  Update Photo</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

                <View style={{ height: 60 }} />
            </ScrollView>

            {/* ════ SCAN MODAL ════ */}
            <Modal visible={scanModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.camBox}>

                        {!scanResult ? (
                            /* Camera view */
                            <>
                                <Text style={styles.camTitle}>🔍 Scan & Identify Face</Text>
                                <Text style={styles.camSub}>
                                    Point camera at the person with good lighting and tap IDENTIFY
                                </Text>

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
                                            <Text style={{ color: '#065f46', fontWeight: 'bold', fontSize: 13 }}>
                                                RECOGNIZED  ({scanResult.confidence}% match)
                                            </Text>
                                        </View>

                                        {/* Registered Photo Display in Modal */}
                                        <View style={[styles.bigPhotoWrap, { borderColor: scanResult.color || '#16a34a' }]}>
                                            {Platform.OS === 'web' ? (
                                                <img
                                                    src={scanResult.photo_url.startsWith('http') ? scanResult.photo_url : `${API}${scanResult.photo_url}`}
                                                    alt={scanResult.name}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            ) : (
                                                <Image
                                                    source={{ uri: scanResult.photo_url.startsWith('http') ? scanResult.photo_url : `${API}${scanResult.photo_url}` }}
                                                    style={{ width: '100%', height: '100%', borderRadius: 50 }}
                                                />
                                            )}
                                        </View>

                                        <Text style={styles.rName}>{scanResult.name}</Text>
                                        <Text style={[styles.rRel, { color: scanResult.color || '#10b981' }]}>
                                            {scanResult.relation}
                                        </Text>
                                        <Text style={styles.rDesc}>{scanResult.desc}</Text>

                                        <TouchableOpacity
                                            style={[styles.rBtn, { backgroundColor: '#16a34a' }]}
                                            onPress={() => speak(`This is ${scanResult.name}. ${scanResult.relation}. ${scanResult.desc}`)}
                                        >
                                            <Ionicons name="volume-high" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  🔊 READ ALOUD</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.rBtn, { backgroundColor: '#334155', marginTop: 8 }]}
                                            onPress={() => { setScanResult(null); setTimeout(() => startCam(scanVideoRef), 400); }}
                                        >
                                            <Ionicons name="scan-outline" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  SCAN ANOTHER PERSON</Text>
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
                                            This person is not yet registered in this account's directory.{'\n\n'}
                                            Tap below to add them with their photo.
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.rBtn, { backgroundColor: '#7c3aed' }]}
                                            onPress={() => openAdd()}
                                        >
                                            <Ionicons name="person-add" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  ➕ REGISTER THIS PERSON</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity
                                            style={[styles.rBtn, { backgroundColor: '#334155', marginTop: 8 }]}
                                            onPress={() => { setScanResult(null); setTimeout(() => startCam(scanVideoRef), 400); }}
                                        >
                                            <Ionicons name="refresh" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  TRY AGAIN</Text>
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
                                            • Ensure good ambient lighting{'\n'}
                                            • Hold phone steady
                                        </Text>
                                        <TouchableOpacity
                                            style={[styles.rBtn, { backgroundColor: '#16a34a' }]}
                                            onPress={() => { setScanResult(null); setTimeout(() => startCam(scanVideoRef), 400); }}
                                        >
                                            <Ionicons name="camera" size={18} color="white" />
                                            <Text style={styles.rBtnTxt}>  TRY AGAIN</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                            </>
                        )}
                    </View>
                </View>
            </Modal>

            {/* ════ ADD / REGISTER MODAL ════ */}
            <Modal visible={addModal} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={styles.formBox}>

                        {/* ── Step 1: Form ── */}
                        {addStep === 'form' && (
                            <>
                                <Text style={styles.formTitle}>➕ Add Family Member</Text>
                                <Text style={styles.formSub}>
                                    Fill in details, then capture or upload their photo to register.
                                </Text>

                                <Text style={styles.label}>FULL NAME *</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Lakshmi, Rishika, Kavana"
                                    placeholderTextColor="#94a3b8"
                                    value={fname}
                                    onChangeText={setFname}
                                    autoFocus
                                />

                                <Text style={styles.label}>RELATIONSHIP</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="e.g. Caregiver, Daughter, Granddaughter"
                                    placeholderTextColor="#94a3b8"
                                    value={frel}
                                    onChangeText={setFrel}
                                />

                                <Text style={styles.label}>MEMORY / NOTES</Text>
                                <TextInput
                                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                                    placeholder="e.g. Loves drinking morning tea with you"
                                    placeholderTextColor="#94a3b8"
                                    value={fdesc}
                                    onChangeText={setFdesc}
                                    multiline
                                />

                                <TouchableOpacity style={styles.nextBtn} onPress={goToCamera}>
                                    <Ionicons name="camera" size={20} color="white" />
                                    <Text style={styles.nextBtnTxt}>  NEXT: TAKE OR UPLOAD PHOTO</Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={closeAdd}>
                                    <Text style={{ color: '#888', fontWeight: 'bold' }}>CANCEL</Text>
                                </TouchableOpacity>
                            </>
                        )}

                        {/* ── Step 2: Camera & File Upload ── */}
                        {addStep === 'camera' && (
                            <>
                                <Text style={styles.formTitle}>📸 Photo for {fname}</Text>
                                <Text style={styles.formSub}>
                                    Take a photo with the camera OR upload from your device gallery.
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
                                    <TouchableOpacity
                                        style={styles.camCancel}
                                        onPress={() => { stopCam(addVideoRef); setAddStep('form'); }}
                                    >
                                        <Text style={{ color: 'white', fontWeight: 'bold' }}>← BACK</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.camAction} onPress={takePhoto}>
                                        <Ionicons name="radio-button-on" size={20} color="white" />
                                        <Text style={{ color: 'white', fontWeight: 'bold', marginLeft: 6 }}>CAPTURE</Text>
                                    </TouchableOpacity>
                                </View>

                                {/* Device Gallery Upload Option */}
                                {Platform.OS === 'web' && (
                                    <TouchableOpacity
                                        style={styles.uploadBtn}
                                        onPress={() => fileInputRef.current?.click()}
                                    >
                                        <Ionicons name="images-outline" size={18} color="#7c3aed" />
                                        <Text style={styles.uploadBtnTxt}>  📁 Choose Photo from Device / Gallery</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}

                        {/* ── Step 3: Preview ── */}
                        {addStep === 'preview' && (
                            <>
                                <Text style={styles.formTitle}>✅ Photo Ready!</Text>
                                <Text style={styles.formSub}>
                                    Ready to enroll <Text style={{ fontWeight: 'bold' }}>{fname}</Text> into this account.
                                </Text>

                                {capturedURL && Platform.OS === 'web' && (
                                    <img
                                        src={capturedURL}
                                        alt="preview"
                                        style={{
                                            width: 160,
                                            height: 160,
                                            borderRadius: 80,
                                            objectFit: 'cover',
                                            alignSelf: 'center',
                                            marginVertical: 12,
                                            border: '3px solid #7c3aed'
                                        }}
                                    />
                                )}

                                {saving ? (
                                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                                        <ActivityIndicator size="large" color="#7c3aed" />
                                        <Text style={{ color: '#7c3aed', marginTop: 8, fontWeight: '600' }}>
                                            Registering face contours on cloud…
                                        </Text>
                                    </View>
                                ) : (
                                    <>
                                        <TouchableOpacity style={styles.nextBtn} onPress={savePerson}>
                                            <Ionicons name="checkmark-circle" size={20} color="white" />
                                            <Text style={styles.nextBtnTxt}>  SAVE & REGISTER</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.nextBtn, { backgroundColor: '#6b7280', marginTop: 8 }]}
                                            onPress={retakePhoto}
                                        >
                                            <Ionicons name="refresh" size={18} color="white" />
                                            <Text style={styles.nextBtnTxt}>  RETAKE / CHOOSE ANOTHER</Text>
                                        </TouchableOpacity>
                                    </>
                                )}
                                <TouchableOpacity style={{ marginTop: 12, alignItems: 'center' }} onPress={closeAdd}>
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
                  marginBottom: 12, shadowColor: C.purple, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 },
    heroBtnTxt: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    syncNoticeCard: {
        backgroundColor: '#ecfdf5', borderRadius: 14, padding: 12, marginBottom: 14,
        flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#a7f3d0'
    },
    syncNoticeTxt: {
        flex: 1, color: '#065f46', fontSize: 12, fontWeight: '600', lineHeight: 18
    },

    emptyCard:  { alignItems: 'center', padding: 30 },
    emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#a78bfa', marginTop: 12 },
    emptySub:   { fontSize: 12, color: '#6d28d9', marginTop: 6, textAlign: 'center', lineHeight: 18 },
    emptyBtn:   { backgroundColor: C.purple, paddingVertical: 12, paddingHorizontal: 24,
                  borderRadius: 14, flexDirection: 'row', alignItems: 'center', marginTop: 16 },
    emptyBtnTxt:{ color: 'white', fontWeight: 'bold' },

    section: { color: '#a78bfa', fontWeight: 'bold', fontSize: 13, marginBottom: 12 },

    card:    { backgroundColor: 'white', borderRadius: 18, padding: 16, marginBottom: 14,
               shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
    cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    avatarWrap: {
        width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
        backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2
    },
    avatarPhoto: { width: '100%', height: '100%', borderRadius: 28 },
    cardName:{ fontSize: 16, fontWeight: 'bold', color: '#1f1545' },
    cardRel: { fontSize: 12, fontWeight: '700', marginTop: 2 },
    faceTag: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    cardDesc:{ fontSize: 13, color: '#4b5563', lineHeight: 18, marginBottom: 12 },
    delBtn:  { padding: 8, backgroundColor: '#fee2e2', borderRadius: 10, marginLeft: 6 },

    cardBtns:{ flexDirection: 'row', gap: 10 },
    btn:     { flex: 1, paddingVertical: 11, borderRadius: 12,
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

    uploadBtn: {
        marginTop: 12, paddingVertical: 12, paddingHorizontal: 16,
        borderRadius: 14, backgroundColor: '#ede9fe', borderWidth: 1, borderColor: '#c4b5fd',
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%'
    },
    uploadBtnTxt: { color: '#6d28d9', fontWeight: 'bold', fontSize: 13 },

    resultEmoji: { fontSize: 44, textAlign: 'center', marginBottom: 6 },
    resultBadge: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14, marginBottom: 12 },
    bigPhotoWrap:{
        width: 100, height: 100, borderRadius: 50, overflow: 'hidden',
        borderWidth: 3, marginBottom: 12, backgroundColor: '#ede9fe',
        alignItems: 'center', justifyContent: 'center'
    },
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
