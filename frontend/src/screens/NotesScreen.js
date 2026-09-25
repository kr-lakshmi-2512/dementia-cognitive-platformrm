import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchNotes, addNote } from '../api/client';

export default function NotesScreen({ navigation }) {
    const [notes, setNotes] = useState([]);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    useEffect(() => {
        loadNotes();
    }, []);

    const loadNotes = async () => {
        try {
            const data = await fetchNotes();
            setNotes(data);
        } catch (error) {
            console.error('Failed to load notes', error);
        }
    };

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) return;
        try {
            await addNote(title, content);
            setTitle('');
            setContent('');
            loadNotes();
        } catch (error) {
            Alert.alert("Error", "Could not save note.");
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>NotesScreen</Text>
            </View>
            <View style={styles.content}>
                <View style={styles.inputContainer}>
                    <TextInput 
                        style={styles.inputTitle} 
                        placeholder="Title..." 
                        value={title} 
                        onChangeText={setTitle} 
                    />
                    <TextInput 
                        style={styles.inputContent} 
                        placeholder="Description..." 
                        multiline
                        value={content} 
                        onChangeText={setContent} 
                    />
                </View>
                
                <FlatList
                    data={notes}
                    keyExtractor={(item) => item.id.toString()}
                    style={{ flex: 1, marginTop: 10 }}
                    renderItem={({ item }) => (
                        <View style={styles.noteCard}>
                            <Text style={styles.noteTitle}>{item.title}</Text>
                            <Text style={styles.noteDesc}>{item.content}</Text>
                        </View>
                    )}
                />
                
                <TouchableOpacity style={styles.fab} onPress={handleSave}>
                    <Ionicons name="add" size={30} color="white" />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingTop: 50, paddingBottom: 16, paddingHorizontal: 16, backgroundColor: 'white', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, flexDirection: 'row', alignItems: 'center' },
    backButton: { flexDirection: 'row', alignItems: 'center' },
    backText: { color: '#3b185f', fontSize: 13, marginLeft: 5, fontWeight: 'bold' },
    headerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginLeft: 30 },
    content: { flex: 1, padding: 16 },
    inputContainer: { backgroundColor: 'white', padding: 16, borderRadius: 14, marginBottom: 12 },
    inputTitle: { fontSize: 14, fontWeight: 'bold', borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8, marginBottom: 8 },
    inputContent: { minHeight: 50, fontSize: 13 },
    noteCard: { backgroundColor: 'white', padding: 12, borderRadius: 10, marginBottom: 8 },
    noteTitle: { fontSize: 13, fontWeight: 'bold', color: '#111' },
    noteDesc: { fontSize: 12, color: '#666', marginTop: 4 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 50, height: 50, borderRadius: 25, backgroundColor: '#3b185f', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.3, shadowRadius: 5 }
});
