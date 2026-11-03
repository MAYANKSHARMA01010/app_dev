import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  pickImageFromLibrary,
  takePhotoWithCamera,
  AttachmentOptionsModal,
  ImagePreviewModal,
} from '../components/ImagePicker';

export default function ConversationScreen({ route, navigation }) {
  const { conversationId, userName, type } = route.params;
  const { user: currentUser, credentials } = useAuth();

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [sending, setSending] = useState(false);
  const [usersMap, setUsersMap] = useState({});

  // WhatsApp-style Image Sharing states
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [sendingImage, setSendingImage] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const flatListRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    loadInitialMessages();
    loadUsers();

    // Auto-poll for new messages every 2.5 seconds
    const interval = setInterval(() => {
      pollNewMessages();
    }, 2500);

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [conversationId]);

  const loadUsers = async () => {
    try {
      const users = await api.getAllUsers(credentials);
      const map = {};
      users.forEach((u) => {
        map[u.id] = u.name;
      });
      if (isMountedRef.current) {
        setUsersMap(map);
      }
    } catch {
      // Ignore user load error
    }
  };

  const loadInitialMessages = async () => {
    setLoading(true);
    try {
      const res = await api.getMessages(credentials, conversationId);
      if (isMountedRef.current) {
        setMessages(res.data || []);
        setNextCursor(res.nextCursor || null);
      }
    } catch (err) {
      console.log('Error loading messages:', err);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const pollNewMessages = async () => {
    try {
      const res = await api.getMessages(credentials, conversationId);
      if (!isMountedRef.current || !res.data) return;

      setMessages((prevMessages) => {
        const existingIds = new Set(prevMessages.map((m) => m.id));
        const newOnes = res.data.filter((m) => !existingIds.has(m.id));

        if (newOnes.length === 0) return prevMessages;

        // Merge and sort by createdAt ascending
        const merged = [...prevMessages, ...newOnes].sort(
          (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );
        return merged;
      });
    } catch {
      // Polling error silent
    }
  };

  const loadOlderMessages = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.getMessages(credentials, conversationId, nextCursor);
      if (isMountedRef.current && res.data) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const olderUnique = res.data.filter((m) => !existingIds.has(m.id));
          return [...olderUnique, ...prev].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
          );
        });
        setNextCursor(res.nextCursor || null);
      }
    } catch (err) {
      console.log('Error loading older messages:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingMore(false);
      }
    }
  };

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    try {
      const sentMsg = await api.sendMessage(credentials, conversationId, text);
      if (isMountedRef.current && sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
      }
    } catch (err) {
      console.log('Error sending message:', err);
      // restore text if failed
      setInputText(text);
    } finally {
      if (isMountedRef.current) {
        setSending(false);
      }
    }
  };

  const handleOpenGallery = async () => {
    const res = await pickImageFromLibrary();
    if (res) {
      setSelectedImage(res);
      setShowPreviewModal(true);
    }
  };

  const handleOpenCamera = async () => {
    const res = await takePhotoWithCamera();
    if (res) {
      setSelectedImage(res);
      setShowPreviewModal(true);
    }
  };

  const handleSendImage = async (caption) => {
    if (!selectedImage?.base64) return;
    setSendingImage(true);

    try {
      const sentMsg = await api.sendMessage(
        credentials,
        conversationId,
        caption || '',
        selectedImage.base64
      );
      if (isMountedRef.current && sentMsg) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === sentMsg.id)) return prev;
          return [...prev, sentMsg];
        });
        setShowPreviewModal(false);
        setSelectedImage(null);
      }
    } catch (err) {
      console.log('Error sending image:', err);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      if (isMountedRef.current) {
        setSendingImage(false);
      }
    }
  };

  const formatMessageTime = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const renderMessageItem = ({ item }) => {
    const isMine = item.senderId === currentUser?.id;
    const senderName = usersMap[item.senderId] || 'User';
    const hasImage = Boolean(item.imageInfo);

    return (
      <View
        style={[
          styles.messageRow,
          isMine ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.myBubble : styles.otherBubble,
            hasImage && styles.imageBubble,
          ]}
        >
          {/* Show sender name in group chats if message is not from current user */}
          {type === 'GROUP' && !isMine && (
            <Text style={styles.senderLabel}>{senderName}</Text>
          )}

          {/* Render image attachment if present */}
          {hasImage && (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => setFullscreenImage(item.imageInfo)}
              style={styles.bubbleImageContainer}
            >
              <Image
                source={{ uri: item.imageInfo }}
                style={styles.bubbleImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}

          {/* Text content / caption */}
          {item.content ? (
            <Text
              style={[
                styles.messageContent,
                isMine ? styles.myText : styles.otherText,
                hasImage && styles.captionText,
              ]}
            >
              {item.content}
            </Text>
          ) : null}

          <Text
            style={[
              styles.messageTime,
              isMine ? styles.myTime : styles.otherTime,
            ]}
          >
            {formatMessageTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            type === 'GROUP' && styles.groupAvatar,
          ]}
        >
          <Text style={styles.avatarText}>
            {(userName || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Name & status */}
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>
            {userName}
          </Text>
          <Text style={styles.headerStatus}>
            {type === 'GROUP' ? 'Group Chat' : 'Online'}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessageItem}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => {
              if (messages.length > 0) {
                flatListRef.current?.scrollToEnd({ animated: false });
              }
            }}
            ListHeaderComponent={
              nextCursor ? (
                <TouchableOpacity
                  style={styles.loadOlderBtn}
                  onPress={loadOlderMessages}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="#007AFF" />
                  ) : (
                    <Text style={styles.loadOlderText}>
                      Load older messages
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  No messages yet. Say hello! 👋
                </Text>
              </View>
            }
          />
        )}

        {/* WhatsApp-style Input Bar */}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={styles.attachButton}
            onPress={() => setShowAttachModal(true)}
            disabled={sending || sendingImage}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Attach photo or camera"
          >
            <Ionicons name="add" size={26} color="#007AFF" />
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#999999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim() || sending}
            activeOpacity={0.7}
          >
            {sending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={17} color="#FFFFFF" style={{ marginLeft: 2 }} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* WhatsApp-style Attach options modal */}
      <AttachmentOptionsModal
        visible={showAttachModal}
        onClose={() => setShowAttachModal(false)}
        onSelectCamera={handleOpenCamera}
        onSelectLibrary={handleOpenGallery}
      />

      {/* WhatsApp-style Image preview & caption modal */}
      <ImagePreviewModal
        visible={showPreviewModal}
        imageUri={selectedImage?.uri}
        onClose={() => {
          setShowPreviewModal(false);
          setSelectedImage(null);
        }}
        onSend={handleSendImage}
        sending={sendingImage}
      />

      {/* Fullscreen Image Viewer Modal */}
      <Modal
        visible={Boolean(fullscreenImage)}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullscreenImage(null)}
      >
        <SafeAreaView style={styles.fullscreenContainer}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setFullscreenImage(null)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {fullscreenImage && (
            <Image
              source={{ uri: fullscreenImage }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  backText: {
    fontSize: 34,
    color: '#222222',
    lineHeight: 36,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  groupAvatar: {
    backgroundColor: '#5856D6',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111111',
  },
  headerStatus: {
    fontSize: 12,
    color: '#34C759',
    marginTop: 2,
  },
  keyboardContainer: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loadOlderBtn: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: '#E5E5EA',
  },
  loadOlderText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
  },
  messageRow: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
    borderRadius: 18,
  },
  imageBubble: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  bubbleImageContainer: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  bubbleImage: {
    width: 220,
    height: 180,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
  },
  captionText: {
    marginTop: 6,
    paddingHorizontal: 6,
  },
  myBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#E9E9EB',
    borderBottomLeftRadius: 4,
  },
  senderLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 2,
    paddingHorizontal: 4,
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: '#FFFFFF',
  },
  otherText: {
    color: '#111111',
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
    paddingHorizontal: 4,
  },
  myTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  otherTime: {
    color: '#8E8E93',
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 15,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  attachButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    marginLeft: 2,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#F1F2F4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#222222',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#C7C7CC',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  fullscreenImage: {
    width: '100%',
    height: '85%',
  },
});
