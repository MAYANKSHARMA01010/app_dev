import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function NewChatScreen({ navigation }) {
  const { user: currentUser, credentials } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState('DM'); // 'DM' or 'GROUP'
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await api.getAllUsers(credentials);
      // Filter out self
      const others = data.filter((u) => u.id !== currentUser.id);
      setUsers(others);
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) =>
    (u.name || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleStartDM = async (targetUser) => {
    if (creating) return;
    try {
      setCreating(true);
      const conv = await api.createConversation(credentials, {
        type: 'DM',
        participants_ids: [targetUser.id],
      });
      navigation.replace('Conversation', {
        conversationId: conv.id,
        userName: targetUser.name,
        type: 'DM',
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to start conversation');
    } finally {
      setCreating(false);
    }
  };

  const toggleSelectUser = (id) => {
    if (selectedUsers.includes(id)) {
      setSelectedUsers(selectedUsers.filter((uId) => uId !== id));
    } else {
      setSelectedUsers([...selectedUsers, id]);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a group name');
      return;
    }
    if (selectedUsers.length === 0) {
      Alert.alert('Required', 'Please select at least one user');
      return;
    }
    try {
      setCreating(true);
      const conv = await api.createConversation(credentials, {
        type: 'GROUP',
        name: groupName.trim(),
        participants_ids: selectedUsers,
      });
      navigation.replace('Conversation', {
        conversationId: conv.id,
        userName: groupName.trim(),
        type: 'GROUP',
      });
    } catch (err) {
      Alert.alert('Error', err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const renderUser = ({ item }) => {
    const isSelected = selectedUsers.includes(item.id);

    return (
      <TouchableOpacity
        style={styles.userItem}
        activeOpacity={0.7}
        onPress={() => {
          if (mode === 'DM') {
            handleStartDM(item);
          } else {
            toggleSelectUser(item.id);
          }
        }}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          {item.bio ? <Text style={styles.userBio}>{item.bio}</Text> : null}
        </View>

        {mode === 'GROUP' && (
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
            ]}
          >
            {isSelected && <Text style={styles.checkmark}>✓</Text>}
          </View>
        )}
      </TouchableOpacity>
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
        <Text style={styles.headerTitle}>New Chat</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Mode Switcher */}
      <View style={styles.modeTabs}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'DM' && styles.modeTabActive]}
          onPress={() => setMode('DM')}
        >
          <Text
            style={[
              styles.modeTabText,
              mode === 'DM' && styles.modeTabTextActive,
            ]}
          >
            Direct Message
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, mode === 'GROUP' && styles.modeTabActive]}
          onPress={() => setMode('GROUP')}
        >
          <Text
            style={[
              styles.modeTabText,
              mode === 'GROUP' && styles.modeTabTextActive,
            ]}
          >
            New Group
          </Text>
        </TouchableOpacity>
      </View>

      {/* Group Name input if GROUP */}
      {mode === 'GROUP' && (
        <View style={styles.groupInputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Group name"
            placeholderTextColor="#999"
            value={groupName}
            onChangeText={setGroupName}
          />
          <TouchableOpacity
            style={[
              styles.createGroupButton,
              (!groupName.trim() || selectedUsers.length === 0 || creating) &&
                styles.buttonDisabled,
            ]}
            onPress={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
          >
            {creating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.createGroupText}>
                Create ({selectedUsers.length})
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name..."
          placeholderTextColor="#999"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* User list */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={renderUser}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No users found</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 36,
    color: '#222222',
    lineHeight: 38,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111111',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#EEF6FF',
  },
  modeTabText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: '#007AFF',
    fontWeight: '700',
  },
  groupInputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  input: {
    flex: 1,
    height: 40,
    backgroundColor: '#F7F8FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    marginRight: 10,
    fontSize: 14,
  },
  createGroupButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createGroupText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  buttonDisabled: {
    backgroundColor: '#A0C8F5',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  searchInput: {
    height: 38,
    backgroundColor: '#F1F2F4',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: '#111111',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 10,
    marginTop: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EFEFEF',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  userBio: {
    fontSize: 12,
    color: '#888888',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888888',
    fontSize: 14,
  },
});

