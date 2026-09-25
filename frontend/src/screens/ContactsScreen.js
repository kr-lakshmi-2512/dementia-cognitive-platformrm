import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image } from 'react-native';
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

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Contacts</Text>
                <View style={{width: 24}}/>
            </View>
            <View style={styles.content}>
                <View style={styles.addForm}>
                    <TextInput style={styles.input} placeholder="Name" value={name} onChangeText={setName}/>
                    <TextInput style={styles.input} placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad"/>
                    <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                        <Text style={{color: 'white', fontWeight: 'bold'}}>Add Contact</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={contacts}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.contactCard}>
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="person" size={24} color="#aaa" />
                            </View>
                            <View>
                                <Text style={styles.contactName}>{item.name}</Text>
                                <Text style={styles.contactPhone}>{item.phone}</Text>
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
    header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: 'white', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
    content: { flex: 1, padding: 16 },
    addForm: { backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 16 },
    input: { height: 38, borderBottomWidth: 1, borderBottomColor: '#eee', marginBottom: 8, fontSize: 13 },
    addButton: { backgroundColor: '#3b185f', padding: 10, borderRadius: 8, alignItems: 'center', marginTop: 8 },
    contactCard: { backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    avatarPlaceholder: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    contactName: { fontSize: 13, fontWeight: 'bold', color: '#111' },
    contactPhone: { fontSize: 11, color: '#888', marginTop: 2 }
});
