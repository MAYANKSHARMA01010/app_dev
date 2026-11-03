import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';

export default function ChatListScreen({ navigation }) {
  const { user: currentUser, credentials, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadData();

    // Auto-poll conversations every 4 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 4000);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

      if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  const loadData = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const [convList, userList] = await Promise.all([
        api.getConversations(credentials),
        api.getAllUsers(credentials),
      ]);

      const userMap = {};
      userList.forEach((u) => {
        userMap[u.id] = u;
      });

      // Enrich conversations with names and latest messages
      const enriched = await Promise.all(
        convList.map(async (conv) => {
          let displayName = conv.name;
          let otherUser = null;

          if (conv.type === 'DM') {
            const otherId = (conv.participants_ids || []).find(
              (id) => id !== currentUser?.id
            );
            otherUser = userMap[otherId];
            displayName = otherUser ? otherUser.name : 'Direct Message';
          } else if (!displayName) {
            displayName = 'Group Chat';
          }

          let lastMessage = null;
          let unreadCount = 0;

          try {
            const msgRes = await api.getMessages(credentials, conv.id);
            if (msgRes.data && msgRes.data.length > 0) {
              lastMessage = msgRes.data[msgRes.data.length - 1];
              // Count unread messages for current user
              unreadCount = msgRes.data.filter(
                (m) =>
                  m.senderId !== currentUser?.id &&
                  m.status?.[currentUser?.id]?.read === false
              ).length;
            }
          } catch {
            // Ignore message load error for individual conv preview
          }

          return {
            ...conv,
            displayName,
            lastMessageText: lastMessage
              ? (lastMessage.imageInfo
                  ? (lastMessage.content ? `📷 ${lastMessage.content}` : '📷 Photo')
                  : (lastMessage.content || 'No messages yet'))
              : 'No messages yet',
            lastMessageTime: lastMessage
              ? formatTime(lastMessage.createdAt)
              : formatTime(conv.createdAt),
            unread: unreadCount,
          };
        })
      );

      if (isMountedRef.current) {
        setConversations(enriched);
      }
    } catch (err) {
      console.log('Error loading chats:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, []);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  };

  const renderChat = ({ item }) => {
    const avatarChar = (item.displayName || '?').charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.chatItem}
        onPress={() =>
          navigation.navigate('Conversation', {
            conversationId: item.id,
            userName: item.displayName,
            type: item.type,
          })
        }
      >
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            item.type === 'GROUP' && styles.groupAvatar,
          ]}
        >
          <Text style={styles.avatarText}>{avatarChar}</Text>
        </View>

        {/* Chat Info */}
        <View style={styles.chatInfo}>
          <View style={styles.topRow}>
            <Text style={styles.name} numberOfLines={1}>
              {item.displayName}
            </Text>
            <Text style={styles.time}>{item.lastMessageTime}</Text>
          </View>

          <View style={styles.bottomRow}>
            <Text style={styles.message} numberOfLines={1}>
              {item.lastMessageText}
            </Text>

            {item.unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unread}</Text>
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
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Chats</Text>
          <Text style={styles.subtitle}>
            Logged in as <Text style={styles.bold}>{currentUser?.name}</Text>
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={() => navigation.navigate('NewChat')}
            activeOpacity={0.7}
          >
            <Text style={styles.newChatButtonText}>+ New</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text style={styles.logoutButtonText}>Exit</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Chat List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderChat}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>
                Tap the "+ New" button above to start a conversation with any user!
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#777777',
  },
  bold: {
    fontWeight: '600',
    color: '#111111',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newChatButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 10,
    marginTop: 8,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  groupAvatar: {
    backgroundColor: '#5856D6',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
    flex: 1,
    marginRight: 8,
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
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
  },
});

