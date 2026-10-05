import React from 'react';

import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';

const chats = [
    {
        id: '1',
        name: 'Aman',
        message: 'Hey! How are you?',
        time: '10:30 AM',
        unread: 2,
    },
    {
        id: '2',
        name: 'Riya',
        message: 'Are you coming to college?',
        time: '9:45 AM',
        unread: 1,
    },
    {
        id: '3',
        name: 'Rahul',
        message: 'See you tomorrow 👍',
        time: 'Yesterday',
        unread: 0,
    },
    {
        id: '4',
        name: 'Vandita',
        message: 'Send me the assignment.',
        time: 'Yesterday',
        unread: 3,
    },
    {
        id: '5',
        name: 'College Group',
        message: 'Aman: Guys, class starts at 9.',
        time: 'Monday',
        unread: 5,
    },
    {
        id: '6',
        name: 'Priya',
        message: 'Thank you 😊',
        time: 'Sunday',
        unread: 0,
    },
];

export default function ChatListScreen({ navigation }) {

    const renderChat = ({ item }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                style={styles.chatItem}
                onPress={() =>
                    navigation.navigate('Conversation', {
                        userName: item.name,
                    })
                }
            >

                {/* Avatar */}
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {item.name.charAt(0)}
                    </Text>
                </View>

                {/* Chat Content */}
                <View style={styles.chatInfo}>

                    {/* Name + Time */}
                    <View style={styles.topRow}>

                        <Text style={styles.name}>
                            {item.name}
                        </Text>

                        <Text style={styles.time}>
                            {item.time}
                        </Text>

                    </View>

                    {/* Message + Unread */}
                    <View style={styles.bottomRow}>

                        <Text
                            style={styles.message}
                            numberOfLines={1}
                        >
                            {item.message}
                        </Text>

                        {item.unread > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {item.unread}
                                </Text>
                            </View>
                        )}

                    </View>

                </View>

            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>

            {/* Header */}
            <View style={styles.header}>

                <Text style={styles.title}>
                    Chats
                </Text>

                <Text style={styles.subtitle}>
                    Your conversations
                </Text>

            </View>

            {/* Chat List */}
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={renderChat}
                showsVerticalScrollIndicator={false}
            />

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: '#F7F8FA',
    },

    // Header
    header: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 18,

        borderBottomWidth: 1,
        borderBottomColor: '#E8E8E8',
    },

    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#111111',
    },

    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: '#888888',
    },

    // Chat item
    chatItem: {
        flexDirection: 'row',

        backgroundColor: '#FFFFFF',

        paddingHorizontal: 16,
        paddingVertical: 14,

        marginHorizontal: 10,
        marginTop: 8,

        borderRadius: 14,

        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 3,

        elevation: 1,
    },

    // Avatar
    avatar: {
        width: 55,
        height: 55,

        borderRadius: 28,

        backgroundColor: '#007AFF',

        alignItems: 'center',
        justifyContent: 'center',

        marginRight: 13,
    },

    avatarText: {
        fontSize: 21,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    // Chat information
    chatInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',

        marginBottom: 6,
    },

    name: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111111',
    },

    time: {
        fontSize: 12,
        color: '#999999',
    },

    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    message: {
        flex: 1,

        fontSize: 14,
        color: '#777777',
    },

    // Unread badge
    unreadBadge: {
        minWidth: 23,
        height: 23,

        paddingHorizontal: 6,

        borderRadius: 12,

        backgroundColor: '#007AFF',

        alignItems: 'center',
        justifyContent: 'center',

        marginLeft: 8,
    },

    unreadText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
    },

});