import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  Image,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

/**
 * Pick an image from the device's photo library.
 * Returns { uri, base64, width, height, mimeType } or null.
 */
export async function pickImageFromLibrary(customOptions = {}) {
  try {
    let permission = await ExpoImagePicker.getMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      permission = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
    }

    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          'Photo Library Access Required',
          'Please allow photo library access in your device settings to select and share photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to select and share photos in chat.'
        );
      }
      return null;
    }

    const result = await ExpoImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
      ...customOptions,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const base64Data = asset.base64
      ? `data:${mimeType};base64,${asset.base64}`
      : null;

    return {
      uri: asset.uri,
      base64: base64Data,
      width: asset.width,
      height: asset.height,
      mimeType,
    };
  } catch (error) {
    console.error('Error picking image from library:', error);
    Alert.alert('Error', 'Could not open photo library.');
    return null;
  }
}

/**
 * Capture a new photo using the device camera.
 * Returns { uri, base64, width, height, mimeType } or null.
 */
export async function takePhotoWithCamera(customOptions = {}) {
  try {
    let permission = await ExpoImagePicker.getCameraPermissionsAsync();

    if (!permission.granted) {
      permission = await ExpoImagePicker.requestCameraPermissionsAsync();
    }

    if (!permission.granted) {
      if (!permission.canAskAgain) {
        Alert.alert(
          'Camera Access Required',
          'Please allow camera access in your device settings to take and send photos.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
      } else {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take and send photos in chat.'
        );
      }
      return null;
    }

    const result = await ExpoImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
      base64: true,
      ...customOptions,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return null;
    }

    const asset = result.assets[0];
    const mimeType = asset.mimeType || 'image/jpeg';
    const base64Data = asset.base64
      ? `data:${mimeType};base64,${asset.base64}`
      : null;

    return {
      uri: asset.uri,
      base64: base64Data,
      width: asset.width,
      height: asset.height,
      mimeType,
    };
  } catch (error) {
    console.error('Error taking photo:', error);
    if (
      error?.message?.toLowerCase().includes('simulator') ||
      error?.message?.toLowerCase().includes('not available') ||
      error?.message?.toLowerCase().includes('camera unavailable')
    ) {
      Alert.alert(
        'Camera Not Available',
        'Camera hardware is not available on the iOS Simulator. Please test the camera on a physical device or choose an image from the Gallery.'
      );
    } else {
      Alert.alert('Error', 'Camera is unavailable or failed to capture.');
    }
    return null;
  }
}

/**
 * WhatsApp-style bottom action sheet for choosing between Camera and Gallery
 */
export function AttachmentOptionsModal({ visible, onClose, onSelectCamera, onSelectLibrary }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Share Content</Text>

          <View style={styles.sheetGrid}>
            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                onClose();
                onSelectCamera();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#E94E77' }]}>
                <Ionicons name="camera" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sheetOption}
              onPress={() => {
                onClose();
                onSelectLibrary();
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.iconCircle, { backgroundColor: '#8E44AD' }]}>
                <Ionicons name="images" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.optionLabel}>Gallery</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

/**
 * WhatsApp-style Fullscreen Image Preview & Caption modal before sending
 */
export function ImagePreviewModal({
  visible,
  imageUri,
  onClose,
  onSend,
  sending = false,
}) {
  const [caption, setCaption] = useState('');

  const handleSend = () => {
    onSend(caption.trim());
    setCaption('');
  };

  const handleClose = () => {
    setCaption('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.previewContainer}>
        {/* Top bar with back/close */}
        <View style={styles.previewHeader}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={handleClose}
            disabled={sending}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Send Photo</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Image Preview Canvas */}
        <View style={styles.previewImageWrapper}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : (
            <ActivityIndicator size="large" color="#FFFFFF" />
          )}
        </View>

        {/* WhatsApp-style bottom caption input bar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View style={styles.captionBar}>
            <TextInput
              style={styles.captionInput}
              placeholder="Add a caption..."
              placeholderTextColor="#8E8E93"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
              editable={!sending}
            />
            <TouchableOpacity
              style={[styles.previewSendBtn, sending && styles.previewSendBtnDisabled]}
              onPress={handleSend}
              disabled={sending}
              activeOpacity={0.8}
            >
              {sending ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

/**
 * Default standalone component for ImagePicker testing/standalone use
 */
export default function ImagePickerComponent({ onImageSelected }) {
  const [previewUri, setPreviewUri] = useState(null);

  const handlePick = async () => {
    const res = await pickImageFromLibrary();
    if (res?.uri) {
      setPreviewUri(res.uri);
      onImageSelected?.(res);
    }
  };

  const handleCamera = async () => {
    const res = await takePhotoWithCamera();
    if (res?.uri) {
      setPreviewUri(res.uri);
      onImageSelected?.(res);
    }
  };

  return (
    <View style={styles.standaloneContainer}>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handlePick}>
          <Ionicons name="images-outline" size={20} color="#FFFFFF" />
          <Text style={styles.btnText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.cameraBtn]} onPress={handleCamera}>
          <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
          <Text style={styles.btnText}>Camera</Text>
        </TouchableOpacity>
      </View>
      {previewUri && (
        <Image source={{ uri: previewUri }} style={styles.standalonePreview} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#D1D1D6',
    borderRadius: 2,
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 20,
  },
  sheetGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  sheetOption: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 10,
  },
  previewCloseBtn: {
    padding: 6,
  },
  previewTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  previewImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  captionBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: 'rgba(28, 28, 30, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#3A3A3C',
  },
  captionInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 10,
  },
  previewSendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  previewSendBtnDisabled: {
    backgroundColor: '#48484A',
  },
  standaloneContainer: {
    padding: 16,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cameraBtn: {
    backgroundColor: '#34C759',
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  standalonePreview: {
    width: 220,
    height: 220,
    borderRadius: 14,
    marginTop: 16,
  },
});
