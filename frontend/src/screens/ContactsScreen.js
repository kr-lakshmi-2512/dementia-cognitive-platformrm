import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Linking, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchContacts, addContact } from '../api/client';

export default function ContactsScreen({ navigation }) {
    const [contacts, setContacts] = useState([]);
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        const data = await fetchContacts();
        setContacts(data);
    };

    const handleAdd = async () => {
        if (!name || !phone) return;
        await addContact(name, phone);
        setName('');
        setPhone('');
        loadContacts();
    };

    const handleCall = (phoneNumber) => {
        const cleaned = phoneNumber.replace(/\s/g, '');
        const url = `tel:${cleaned}`;
        if (Platform.OS === 'web') {
            window.location.href = url;
        } else {
            Linking.openURL(url).catch(() =>
                Alert.alert('Error', 'Unable to open phone dialer.')
            );
        }
    };

    const handleWhatsApp = (phoneNumber, contactName) => {
        const cleaned = phoneNumber.replace(/[^0-9]/g, '');
        const msg = encodeURIComponent(`Hello ${contactName || ''}, sending a check-in message from the Dementia Care platform.`);
        const url = cleaned ? `https://api.whatsapp.com/send?phone=${cleaned}&text=${msg}` : `https://api.whatsapp.com/send?text=${msg}`;
        if (Platform.OS === 'web') {
            window.open(url, '_blank');
        } else {
            Linking.openURL(url).catch(() =>
                Alert.alert('Error', 'Unable to launch WhatsApp.')
            );
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📞 Contacts</Text>
                <View style={{width: 24}}/>
            </View>
            <View style={styles.content}>
                <View style={styles.addForm}>
                    <Text style={styles.formTitle}>Add New Contact</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Name"
                        placeholderTextColor="#aaa"
                        value={name}
                        onChangeText={setName}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Phone number"
                        placeholderTextColor="#aaa"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                    />
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                        <Ionicons name="person-add" size={16} color="white" />
                        <Text style={{color: 'white', fontWeight: 'bold', marginLeft: 6}}>Add Contact</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <Ionicons name="people-outline" size={48} color="#ffffff44" />
                            <Text style={styles.emptyText}>No contacts yet. Add one above.</Text>
                        </View>
                    }
                    renderItem={({ item }) => (
                        <View style={styles.contactCard}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={24} color="#3b185f" />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactPhone}>{item.phone}</Text>
                            </View>
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                                <TouchableOpacity
                                    style={styles.callButton}
                                    onPress={() => handleCall(item.phone)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="call" size={16} color="white" />
                                    <Text style={styles.callText}>Call</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.callButton, { backgroundColor: '#25D366' }]}
                                    onPress={() => handleWhatsApp(item.phone, item.name)}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="logo-whatsapp" size={16} color="white" />
                                    <Text style={styles.callText}>WA</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                />
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16,
        backgroundColor: 'white', borderBottomLeftRadius: 16, borderBottomRightRadius: 16,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'
    },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, padding: 16 },
    formTitle: { fontSize: 14, fontWeight: 'bold', color: '#3b185f', marginBottom: 10 },
    addForm: {
        backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 16,
        shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, elevation: 3
    },
    input: {
        height: 42, borderWidth: 1, borderColor: '#e0e0e0',
        borderRadius: 8, paddingHorizontal: 12, marginBottom: 10,
        fontSize: 13, color: '#333', backgroundColor: '#fafafa'
    },
    addButton: {
        backgroundColor: '#3b185f', padding: 12, borderRadius: 10,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 4
    },
    contactCard: {
        backgroundColor: 'white', padding: 14, borderRadius: 12, marginBottom: 10,
        flexDirection: 'row', alignItems: 'center',
        shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2
    },
    avatarPlaceholder: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: '#f0ebff', justifyContent: 'center', alignItems: 'center', marginRight: 12
    },
    contactInfo: { flex: 1 },
    contactName: { fontSize: 14, fontWeight: 'bold', color: '#111' },
    contactPhone: { fontSize: 12, color: '#888', marginTop: 2 },
    callButton: {
        backgroundColor: '#22c55e', paddingVertical: 8, paddingHorizontal: 14,
        borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4
    },
    callText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
    emptyBox: { alignItems: 'center', marginTop: 60, gap: 12 },
    emptyText: { color: '#ffffff88', fontSize: 14 },
});
