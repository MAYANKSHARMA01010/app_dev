import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function StorageScreen() {
    const [input, setInput] = useState('');
    const [saved, setSaved] = useState('');

    useEffect(() => {
        getData();
    }, []);

    const saveData = async () => {
        await AsyncStorage.setItem('myData', input);
        setSaved(input);
        setInput('');
    };

    const getData = async () => {
        const value = await AsyncStorage.getItem('myData');
        if (value !== null) {
            setSaved(value);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>AsyncStorage</Text>

            <TextInput
                style={styles.input}
                placeholder="Enter something"
                value={input}
                onChangeText={setInput}
            />

            <Button title="Save" onPress={saveData} />

            <Text style={styles.result}>Saved: {saved}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
        gap: 15,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    input: {
        borderWidth: 1,
        borderColor: 'gray',
        padding: 10,
        borderRadius: 5,
    },
    result: {
        fontSize: 18,
    },
});