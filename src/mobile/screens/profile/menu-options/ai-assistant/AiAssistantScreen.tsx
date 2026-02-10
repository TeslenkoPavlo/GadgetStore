import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Modal,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useAnimatedKeyboard,
} from 'react-native-reanimated';
import { AuthContext } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  getConversations,
  getConversation,
  createConversation,
  sendChatMessage,
  deleteConversation,
  type Conversation,
  type ChatMessage,
} from '@/services/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QUICK_ACTIONS = [
  { id: '1', icon: 'phone-portrait-outline', text: 'Розкажи про Google Pixel 8 Pro' },
  { id: '2', icon: 'headset-outline', text: 'Чим хороші Apple AirPods Max?' },
  { id: '3', icon: 'watch-outline', text: 'Що вміє Apple Watch Series 9?' },
  { id: '4', icon: 'tablet-portrait-outline', text: 'Характеристики Lenovo Tab P12' },
];

export function AiAssistantScreen() {
  const { user } = useContext(AuthContext);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const keyboard = useAnimatedKeyboard();

  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: -keyboard.height.value }],
    };
  });

  useEffect(() => {
    if (user?.uid) {
      loadConversations();
    }
  }, [user?.uid]);

  const loadConversations = async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const convs = await getConversations(user.uid);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!user?.uid) return;
    setHistoryVisible(false);
    setIsLoading(true);
    try {
      const newConv = await createConversation(user.uid);
      if (newConv) {
        setCurrentConversation(newConv);
        setMessages([]);
        await loadConversations();
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectConversation = async (conv: Conversation) => {
    if (!user?.uid) return;
    setHistoryVisible(false);
    setIsLoading(true);
    try {
      const fullConv = await getConversation(user.uid, conv.id);
      if (fullConv) {
        setCurrentConversation(fullConv);
        setMessages(fullConv.messages || []);
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConversation = async (convId: string) => {
    if (!user?.uid) return;
    try {
      const success = await deleteConversation(user.uid, convId);
      if (success) {
        if (currentConversation?.id === convId) {
          setCurrentConversation(null);
          setMessages([]);
        }
        await loadConversations();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || !user?.uid || isSending) return;

    let convId = currentConversation?.id;

    if (!convId) {
      try {
        const newConv = await createConversation(user.uid);
        if (newConv) {
          convId = newConv.id;
          setCurrentConversation(newConv);
        } else {
          return;
        }
      } catch (error) {
        console.error('Error creating conversation:', error);
        return;
      }
    }

    setIsSending(true);
    setInputText('');

    const tempUserMessage: ChatMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await sendChatMessage(user.uid, convId!, messageText);
      if (response) {
        setMessages((prev) => {
          const filtered = prev.filter((m) => m.timestamp !== tempUserMessage.timestamp);
          return [...filtered, response.userMessage, response.aiMessage];
        });

        if (response.title && currentConversation) {
          setCurrentConversation((prev) => prev ? { ...prev, title: response.title! } : prev);
          await loadConversations();
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Вибачте, сталася помилка. Спробуйте ще раз.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsSending(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  const handleQuickAction = (actionText: string) => {
    handleSendMessage(actionText);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isUser = message.role === 'user';
    return (
      <MotiView
        key={index}
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 200 }}
        style={[
          styles.messageRow,
          isUser ? styles.userMessageRow : styles.aiMessageRow,
        ]}
      >
        {!isUser && (
          <View style={styles.botIconContainer}>
            <Ionicons name="sparkles" size={16} color="#1A1A1A" />
          </View>
        )}
        <View style={isUser ? styles.userBubble : styles.aiBubbleContainer}>
          <Text style={[styles.messageText, isUser ? styles.userText : styles.aiText]}>
            {message.content}
          </Text>
        </View>
      </MotiView>
    );
  };

  const renderQuickActionCard = (action: typeof QUICK_ACTIONS[0]) => (
    <Pressable
      key={action.id}
      style={styles.quickActionCard}
      onPress={() => handleQuickAction(action.text)}
    >
      <View style={styles.quickActionIconContainer}>
        <Ionicons name={action.icon as any} size={12} color="#1A1A1A" />
      </View>
      <Text style={styles.quickActionText}>{action.text}</Text>
      <Ionicons name="chevron-forward" size={14} color="#CCCCCC" />
    </Pressable>
  );

  const renderHistoryItem = ({ item }: { item: Conversation }) => (
    <Pressable
      style={styles.historyItem}
      onPress={() => handleSelectConversation(item)}
    >
      <View style={styles.historyItemContent}>
        <Ionicons name="chatbubble-outline" size={20} color="#1A1A1A" />
        <Text style={styles.historyItemTitle} numberOfLines={1}>
          {item.title}
        </Text>
      </View>
      <Pressable
        style={styles.deleteButton}
        onPress={() => handleDeleteConversation(item.id)}
        hitSlop={10}
      >
        <Ionicons name="trash-outline" size={20} color="#1A1A1A" />
      </Pressable>
    </Pressable>
  );


  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          style={styles.menuButton}
          onPress={() => setHistoryVisible(true)}
        >
          <Ionicons name="menu-outline" size={26} color="#1A1A1A" />
        </Pressable>

        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle-outline" size={44} color="#1A1A1A" />
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0) {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }
          }}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 400 }}
              >
                <Text style={styles.greetingTitle}>
                  Привіт!
                </Text>
                <Text style={styles.greetingSubtitle}>
                  Чим я можу допомогти сьогодні?
                </Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 500, delay: 100 }}
                style={styles.quickActionsContainer}
              >
                {QUICK_ACTIONS.map((action) => renderQuickActionCard(action))}
              </MotiView>
            </View>
          ) : (
            <View style={styles.messagesContainer}>
              {messages.map((msg, idx) => renderMessage(msg, idx))}

              {isSending && (
                <View style={styles.typingIndicator}>
                  <View style={styles.botIconContainer}>
                    <Ionicons name="sparkles" size={16} color="#1A1A1A" />
                  </View>
                  <View style={styles.typingBubble}>
                    <ActivityIndicator size="small" color="#666" />
                    <Text style={styles.typingText}>Думаю...</Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <Animated.View style={[styles.inputWrapper, animatedInputStyle]}>
          <View style={styles.inputContainer}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              placeholder="Напишіть повідомлення..."
              placeholderTextColor="#999"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              editable={!isSending}
            />
            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || isSending) && styles.sendButtonDisabled,
              ]}
              onPress={() => handleSendMessage()}
              disabled={!inputText.trim() || isSending}
            >
              <Ionicons
                name="arrow-up"
                size={20}
                color={inputText.trim() && !isSending ? '#FFFFFF' : '#AAAAAA'}
              />
            </Pressable>
          </View>
        </Animated.View>
      </View>

      <Modal
        visible={historyVisible}
        animationType="none"
        transparent
        onRequestClose={() => setHistoryVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setHistoryVisible(false)}
        >
          <MotiView
            from={{ translateX: -SCREEN_WIDTH * 0.8 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: -SCREEN_WIDTH * 0.8 }}
            transition={{ type: 'timing', duration: 300 }}
            style={styles.historyPanel}
          >
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
              <Pressable style={{ flex: 1 }} onPress={(e) => e.stopPropagation()}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyTitle}>Історія чатів</Text>
                  <Pressable
                    style={styles.closeButton}
                    onPress={() => setHistoryVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#1A1A1A" />
                  </Pressable>
                </View>

              <View style={styles.divider} />

              <Pressable style={styles.newChatButton} onPress={handleNewChat}>
                <Ionicons name="add-circle-outline" size={22} color="#1A1A1A" />
                <Text style={styles.newChatText}>Новий чат</Text>
              </Pressable>

              <View style={styles.divider} />

              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner size={40} />
                </View>
              ) : conversations.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="chatbubbles-outline" size={48} color="#CCCCCC" />
                  <Text style={styles.emptyHistoryText}>Немає збережених чатів</Text>
                </View>
              ) : (
                <FlatList
                  data={conversations}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item) => item.id}
                  style={styles.historyList}
                  showsVerticalScrollIndicator={false}
                />
              )}
              </Pressable>
            </SafeAreaView>
          </MotiView>
        </Pressable>
      </Modal>

      {isLoading && !historyVisible && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size={50} />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F8F8F8',
  },
  menuButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  welcomeContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  greetingTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  greetingSubtitle: {
    fontSize: 17,
    color: '#666666',
    marginBottom: 40,
  },
  quickActionsContainer: {
    gap: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  quickActionIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  userMessageRow: {
    justifyContent: 'flex-end',
  },
  aiMessageRow: {
    justifyContent: 'flex-start',
  },
  botIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  userBubble: {
    maxWidth: '75%',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 6,
  },
  aiBubbleContainer: {
    maxWidth: '80%',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#FFFFFF',
  },
  aiText: {
    color: '#1A1A1A',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#F8F8F8',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEEEEE',
    borderRadius: 30,
    paddingLeft: 20,
    paddingRight: 6,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    color: '#1A1A1A',
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  historyPanel: {
    width: '80%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  closeButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  newChatText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEEEEE',
    marginHorizontal: 20,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  historyItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  historyItemTitle: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  deleteButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyHistory: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyHistoryText: {
    fontSize: 15,
    color: '#999',
    marginTop: 14,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(248, 248, 248, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AiAssistantScreen;
