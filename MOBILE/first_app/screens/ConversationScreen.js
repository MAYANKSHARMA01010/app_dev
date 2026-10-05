import React from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';

export default function ConversationScreen({ route, navigation }) {

  const { userName } = route.params;

  return (
    <SafeAreaView style={styles.container}>

      {/* Header */}
      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>
            ‹
          </Text>
        </TouchableOpacity>

        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {userName.charAt(0)}
          </Text>
        </View>

        {/* Name */}
        <View style={styles.headerInfo}>
          <Text style={styles.name}>
            {userName}
          </Text>

          <Text style={styles.status}>
            Online
          </Text>
        </View>

      </View>

      {/* Messages */}
      <View style={styles.messages}>

        <View style={styles.receivedMessage}>
          <Text style={styles.receivedText}>
            Hey! How are you?
          </Text>
        </View>

        <View style={styles.sentMessage}>
          <Text style={styles.sentText}>
            I'm good! How about you?
          </Text>
        </View>

        <View style={styles.receivedMessage}>
          <Text style={styles.receivedText}>
            I'm doing great 😊
          </Text>
        </View>

      </View>

      {/* Message Input */}
      <View style={styles.inputContainer}>

        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          placeholderTextColor="#999999"
        />

        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendText}>
            ➤
          </Text>
        </TouchableOpacity>

      </View>

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
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 15,
    paddingVertical: 12,

    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },

  backButton: {
    width: 40,
    height: 40,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 5,
  },

  backText: {
    fontSize: 38,
    fontWeight: '300',
    color: '#222222',

    lineHeight: 40,
  },

  avatar: {
    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor: '#007AFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 10,
  },

  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  headerInfo: {
    flex: 1,
  },

  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111111',
  },

  status: {
    fontSize: 12,
    color: '#34C759',

    marginTop: 2,
  },

  // Messages
  messages: {
    flex: 1,

    paddingHorizontal: 15,
    paddingTop: 20,
  },

  receivedMessage: {
    alignSelf: 'flex-start',

    backgroundColor: '#E9E9EB',

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 18,

    borderBottomLeftRadius: 4,

    marginBottom: 10,

    maxWidth: '75%',
  },

  receivedText: {
    fontSize: 15,
    color: '#222222',
  },

  sentMessage: {
    alignSelf: 'flex-end',

    backgroundColor: '#007AFF',

    paddingHorizontal: 14,
    paddingVertical: 10,

    borderRadius: 18,

    borderBottomRightRadius: 4,

    marginBottom: 10,

    maxWidth: '75%',
  },

  sentText: {
    fontSize: 15,
    color: '#FFFFFF',
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },

  input: {
    flex: 1,

    height: 45,

    backgroundColor: '#F1F2F4',

    borderRadius: 23,

    paddingHorizontal: 17,

    fontSize: 15,

    color: '#222222',
  },

  sendButton: {
    width: 45,
    height: 45,

    borderRadius: 23,

    backgroundColor: '#007AFF',

    alignItems: 'center',
    justifyContent: 'center',

    marginLeft: 8,
  },

  sendText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },

});