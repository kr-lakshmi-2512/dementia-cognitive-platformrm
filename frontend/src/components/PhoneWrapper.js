import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function PhoneWrapper({ children }) {
    const { width, height } = useWindowDimensions();
    const isDesktopWeb = Platform.OS === 'web' && width > 600;

    const [currentTime, setCurrentTime] = useState('');

    useEffect(() => {
        const updateClock = () => {
            const now = new Date();
            let hours = now.getHours();
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const ampm = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            setCurrentTime(`${hours}:${minutes} ${ampm}`);
        };
        updateClock();
        const interval = setInterval(updateClock, 30000);
        return () => clearInterval(interval);
    }, []);

    if (!isDesktopWeb) {
        return <View style={{ flex: 1 }}>{children}</View>;
    }

    return (
        <View style={styles.desktopOuterContainer}>
            {/* Top Desktop Web Branding Bar */}
            <View style={styles.webHeader}>
                <View style={styles.webHeaderTitleRow}>
                    <Text style={styles.webHeaderLogo}>🧠</Text>
                    <View>
                        <Text style={styles.webHeaderTitle}>AI Dementia Care & Cognitive Platform</Text>
                        <Text style={styles.webHeaderSubtitle}>Live Mobile App Preview • Patient, Caregiver & Doctor Portals</Text>
                    </View>
                </View>
                <View style={styles.badgeRow}>
                    <View style={styles.statusBadge}>
                        <View style={styles.greenDot} />
                        <Text style={styles.statusBadgeText}>FastAPI Backend Connected</Text>
                    </View>
                    <View style={styles.deviceBadge}>
                        <Ionicons name="phone-portrait-outline" size={14} color="#a78bfa" />
                        <Text style={styles.deviceBadgeText}>Smartphone App Simulator</Text>
                    </View>
                </View>
            </View>

            {/* Smartphone Outer Container & Physical Buttons */}
            <View style={styles.phoneOuterShadowContainer}>
                {/* Physical Side Buttons on Phone Frame */}
                <View style={[styles.sideButton, styles.volumeUpBtn]} />
                <View style={[styles.sideButton, styles.volumeDownBtn]} />
                <View style={[styles.sideButton, styles.powerBtn]} />

                {/* Smartphone Bezel / Frame */}
                <View style={styles.phoneFrame}>
                    {/* Realistic Status Bar */}
                    <View style={styles.statusBar}>
                        <Text style={styles.statusTime}>{currentTime || '9:41 AM'}</Text>

                        {/* Dynamic Island / Camera Notch */}
                        <View style={styles.dynamicIsland}>
                            <View style={styles.cameraDot} />
                            <View style={styles.speakerGrill} />
                        </View>

                        <View style={styles.statusIcons}>
                            <Ionicons name="cellular" size={14} color="#e2e8f0" style={{ marginRight: 5 }} />
                            <Ionicons name="wifi" size={14} color="#e2e8f0" style={{ marginRight: 5 }} />
                            <Ionicons name="battery-full" size={18} color="#10b981" />
                        </View>
                    </View>

                    {/* Inner App Display Screen Area */}
                    <View style={styles.appDisplayArea}>
                        {children}
                    </View>

                    {/* Bottom Home Indicator Bar */}
                    <View style={styles.homeIndicatorBar} pointerEvents="none" />
                </View>
            </View>

            {/* Desktop Web Footer */}
            <View style={styles.webFooter}>
                <Text style={styles.webFooterText}>
                    💡 Interactive Phone Simulator: Navigate, test voice assistant, emergency SOS, and caregiver/doctor portals inside the phone frame.
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    desktopOuterContainer: {
        flex: 1,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#090d16',
        backgroundImage: 'radial-gradient(circle at 50% 30%, #1e1b4b 0%, #090d16 80%)',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 20,
        boxSizing: 'border-box',
        overflow: 'hidden'
    },
    webHeader: {
        width: '100%',
        maxWidth: 960,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
    },
    webHeaderTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    webHeaderLogo: {
        fontSize: 26
    },
    webHeaderTitle: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#f8fafc',
        letterSpacing: 0.3
    },
    webHeaderSubtitle: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: '500'
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
        gap: 6
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#10b981'
    },
    statusBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#34d399'
    },
    deviceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(124, 58, 237, 0.15)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(124, 58, 237, 0.3)',
        gap: 6
    },
    deviceBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#c084fc'
    },
    phoneOuterShadowContainer: {
        position: 'relative',
        marginVertical: 'auto',
        alignItems: 'center',
        justifyContent: 'center'
    },
    sideButton: {
        position: 'absolute',
        backgroundColor: '#334155',
        borderRadius: 3,
        zIndex: 1
    },
    volumeUpBtn: {
        left: -14,
        top: 115,
        width: 4,
        height: 48
    },
    volumeDownBtn: {
        left: -14,
        top: 178,
        width: 4,
        height: 48
    },
    powerBtn: {
        right: -14,
        top: 140,
        width: 4,
        height: 64
    },
    phoneFrame: {
        width: 412,
        height: 840,
        maxHeight: 'calc(100vh - 140px)',
        backgroundColor: '#0f172a',
        borderRadius: 46,
        borderWidth: 10,
        borderColor: '#1e293b',
        boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 50px rgba(124, 58, 237, 0.35), inset 0 0 0 2px rgba(255, 255, 255, 0.12)',
        overflow: 'hidden',
        position: 'relative',
        flexDirection: 'column'
    },
    statusBar: {
        height: 44,
        backgroundColor: '#0f172a',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        zIndex: 999998,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    statusTime: {
        color: '#f8fafc',
        fontSize: 14,
        fontWeight: 'bold'
    },
    dynamicIsland: {
        width: 110,
        height: 26,
        backgroundColor: '#000000',
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.8)'
    },
    cameraDot: {
        width: 9,
        height: 9,
        borderRadius: 4.5,
        backgroundColor: '#1e293b',
        borderWidth: 1.5,
        borderColor: '#020617'
    },
    speakerGrill: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#1e293b'
    },
    statusIcons: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    appDisplayArea: {
        flex: 1,
        width: '100%',
        backgroundColor: '#f8fafc',
        position: 'relative',
        overflow: 'hidden'
    },
    homeIndicatorBar: {
        position: 'absolute',
        bottom: 6,
        alignSelf: 'center',
        width: 134,
        height: 5,
        backgroundColor: '#94a3b8',
        borderRadius: 10,
        zIndex: 999999
    },
    webFooter: {
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)'
    },
    webFooterText: {
        color: '#94a3b8',
        fontSize: 12,
        fontWeight: '500'
    }
});
