import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

interface SupportScreenProps {
  onBack?: () => void;
}

const SUPPORT_EMAIL = 'teslenkopasha5@gmail.com';

interface ModalState {
  visible: boolean;
  type: 'error' | 'success' | 'info';
  title: string;
  message: string;
}

const SupportScreen: React.FC<SupportScreenProps> = ({ onBack }) => {
  const navigation = useNavigation();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [modalState, setModalState] = useState<ModalState>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (type: 'error' | 'success' | 'info', title: string, message: string) => {
    setModalState({ visible: true, type, title, message });
  };

  const hideModal = () => {
    setModalState(prev => ({ ...prev, visible: false }));
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim()) {
      showModal('error', 'Помилка', 'Будь ласка, введіть тему повідомлення');
      return;
    }

    if (!message.trim()) {
      showModal('error', 'Помилка', 'Будь ласка, введіть текст повідомлення');
      return;
    }

    setIsSending(true);

    try {
      const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

      // На Android canOpenURL часто повертає false навіть якщо поштовий клієнт є
      // Тому просто намагаємося відкрити URL напряму
      await Linking.openURL(mailtoUrl);
      setSubject('');
      setMessage('');
    } catch (error) {
      showModal(
        'error',
        'Помилка',
        'Не вдалося відкрити поштовий клієнт. Будь ласка, надішліть лист вручну на адресу: ' + SUPPORT_EMAIL
      );
    } finally {
      setIsSending(false);
    }
  };

  const handlePhonePress = () => {
    Linking.openURL('tel:+380969032235');
  };

  const handleEmailPress = () => {
    Linking.openURL(`mailto:${SUPPORT_EMAIL}`);
  };

  const getModalIcon = () => {
    switch (modalState.type) {
      case 'error':
        return 'alert-circle-outline';
      case 'success':
        return 'checkmark-circle-outline';
      default:
        return 'information-circle-outline';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 400 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={24} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.title}>Підтримка</Text>
      </MotiView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 150 }}
          style={[styles.card, styles.formCard]}
        >
          <Text style={styles.cardTitle}>Написати нам</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Кому</Text>
            <View style={styles.readOnlyInput}>
              <Ionicons name="mail" size={18} color="#6B7280" style={styles.inputIcon} />
              <Text style={styles.readOnlyText}>{SUPPORT_EMAIL}</Text>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Тема</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Введіть тему звернення"
                placeholderTextColor="#9CA3AF"
                value={subject}
                onChangeText={setSubject}
                maxLength={100}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Повідомлення</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Опишіть ваше питання або проблему..."
                placeholderTextColor="#9CA3AF"
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                maxLength={1000}
              />
            </View>
            <Text style={styles.charCount}>{message.length}/1000</Text>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, isSending && styles.submitButtonDisabled]}
            onPress={handleSendEmail}
            disabled={isSending}
            activeOpacity={0.8}
          >
            {isSending ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={18} color="#FFFFFF" />
                <Text style={styles.submitButtonText}>Відправити</Text>
              </>
            )}
          </TouchableOpacity>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 40, scale: 0.95 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          transition={{ type: 'timing', duration: 500, delay: 300 }}
          style={[styles.card, styles.contactCard]}
        >
          <Text style={styles.cardTitle}>Зв'язатися з нами</Text>

          <View style={styles.contactRow}>
            <TouchableOpacity style={styles.contactItem} onPress={handlePhonePress}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="call-outline" size={20} color="#1A1A1A" />
              </View>
              <Text style={styles.contactText}>+380 96 903 22 35</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.contactItem} onPress={handleEmailPress}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="mail-outline" size={20} color="#1A1A1A" />
              </View>
              <Text style={styles.contactText} numberOfLines={1}>{SUPPORT_EMAIL}</Text>
            </TouchableOpacity>

            <View style={styles.contactItem}>
              <View style={styles.contactIconCircle}>
                <Ionicons name="time-outline" size={20} color="#1A1A1A" />
              </View>
              <View>
                <Text style={styles.contactText}>Час відповіді</Text>
                <Text style={styles.contactSubText}>Зазвичай протягом 24 годин</Text>
              </View>
            </View>
          </View>
        </MotiView>
      </ScrollView>

      <Modal
        visible={modalState.visible}
        transparent
        animationType="fade"
        onRequestClose={hideModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconCircle}>
              <Ionicons name={getModalIcon()} size={40} color="#000000" />
            </View>
            <Text style={styles.modalTitle}>{modalState.title}</Text>
            <Text style={styles.modalMessage}>{modalState.message}</Text>
            <Pressable style={styles.modalButton} onPress={hideModal}>
              <Text style={styles.modalButtonText}>Зрозуміло</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  formCard: {
    paddingBottom: 24,
  },
  contactCard: {
    marginBottom: 0,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  contactRow: {
    gap: 12,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  contactIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    flex: 1,
  },
  contactSubText: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  readOnlyInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 12,
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputIcon: {
    marginRight: 10,
  },
  readOnlyText: {
    fontSize: 15,
    color: '#6B7280',
    flex: 1,
  },
  input: {
    fontSize: 15,
    color: '#1A1A1A',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  textAreaContainer: {
    minHeight: 120,
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  charCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 16,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default SupportScreen;
