import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from 'react-native';

import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

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

export default function App() {
  const renderChat = ({ item }) => {
    return (
      <TouchableOpacity style={styles.chatItem}>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name.charAt(0)}
          </Text>
        </View>

        {/* Chat Information */}
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={styles.name}>
              {item.name}
            </Text>

            <Text style={styles.time}>
              {item.time}
            </Text>
          </View>

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
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Chats</Text>
        </View>

        {/* Chat List */}
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
        />

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    alignItems: "center"
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
  },

  // Chat item
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },

  // Avatar
  avatar: {
    width: 55,
    height: 55,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  // Chat information
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  name: {
    fontSize: 17,
    fontWeight: 'bold',
  },

  time: {
    fontSize: 12,
    color: '#888888',
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
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  unreadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});