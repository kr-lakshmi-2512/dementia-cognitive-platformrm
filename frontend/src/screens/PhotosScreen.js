import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, TextInput, Modal, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { fetchPhotos, addPhoto, scanFace } from '../api/client';

export default function PhotosScreen({ navigation }) {
    const [photos, setPhotos] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newUrl, setNewUrl] = useState('');
    
    useEffect(() => {
        loadPhotos();
    }, []);

    const loadPhotos = async () => {
        let data = await fetchPhotos();
        if (data.length === 0) {
            // Seed some dummy photos if empty to show functionality
            await addPhoto("After Marriage", "https://images.unsplash.com/photo-1511285560929-80b456fea0bc");
            await addPhoto("Your House", "https://images.unsplash.com/photo-1518780664697-55e3ad937233");
            data = await fetchPhotos();
        }
        setPhotos(data);
    };

    const handleSavePhoto = async () => {
        if (!newTitle.trim() || !newUrl.trim()) {
            Alert.alert('Validation Error', 'Please provide a title and a valid image URL.');
            return;
        }
        try {
            await addPhoto(newTitle.trim(), newUrl.trim());
            setNewTitle('');
            setNewUrl('');
            setModalVisible(false);
            loadPhotos();
        } catch (error) {
            Alert.alert('Error', 'Failed to save the photo.');
        }
    };

    const handleScanFace = async () => {
        try {
            const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
            if (permissionResult.granted === false) {
                Alert.alert('Permission required', 'We need camera access to scan faces!');
                return;
            }

            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.5,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                const scanResponse = await scanFace(result.assets[0].base64);
                if (scanResponse.match_found) {
                    Alert.alert('🧠 Identity Map Successful', scanResponse.message);
                } else {
                    Alert.alert('Scan Result', scanResponse.message);
                }
            }
        } catch (error) {
            Alert.alert('Scanning Failed', 'Could not run the neural extraction matrix.');
        }
    };

    return (
        <LinearGradient colors={['#3b185f', '#1a0b2e']} style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#3b185f" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Family Memories</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
                    <Ionicons name="add" size={26} color="#3b185f" />
                </TouchableOpacity>
            </View>

            <FlatList
                contentContainerStyle={styles.content}
                data={photos}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View style={styles.card}>
                        <Image source={{uri: item.image_url}} style={styles.image} />
                        <View style={styles.textContainer}>
                            <Text style={styles.title}>{item.title}</Text>
                            <Text style={styles.desc}>Family Memory added recently</Text>
                        </View>
                    </View>
                )}
            />

            <TouchableOpacity style={styles.scanFab} onPress={handleScanFace}>
                <Ionicons name="scan" size={28} color="white" />
            </TouchableOpacity>

            <Modal visible={modalVisible} transparent={true} animationType="slide">
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add a Memory</Text>
                        
                        <Text style={styles.label}>Memory Title</Text>
                        <TextInput style={styles.input} placeholder="E.g. Grandson's graduation" value={newTitle} onChangeText={setNewTitle} />

                        <Text style={styles.label}>Image URL link</Text>
                        <TextInput style={styles.input} placeholder="https://..." value={newUrl} onChangeText={setNewUrl} />

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                                <Text style={styles.cancelText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.saveBtn} onPress={handleSavePhoto}>
                                <Text style={styles.saveText}>Save</Text>
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
    header: { paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: 'white', borderBottomLeftRadius: 20, borderBottomRightRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#333' },
    content: { padding: 20, paddingBottom: 40 },
    card: { backgroundColor: 'white', borderRadius: 15, marginBottom: 20, overflow: 'hidden', elevation: 3 },
    image: { width: '100%', height: 200 },
    textContainer: { padding: 15 },
    title: { fontSize: 16, fontWeight: 'bold' },
    desc: { fontSize: 12, color: '#888', marginTop: 5 },
    addButton: { padding: 5 },
    modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { width: '85%', backgroundColor: 'white', borderRadius: 20, padding: 20 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 16 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
    cancelBtn: { padding: 15, flex: 1, alignItems: 'center' },
    cancelText: { color: '#888', fontWeight: 'bold', fontSize: 16 },
    saveBtn: { backgroundColor: '#3b185f', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center', marginLeft: 10 },
    saveText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    scanFab: { position: 'absolute', bottom: 30, right: 30, backgroundColor: '#e67e22', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5 }
});
