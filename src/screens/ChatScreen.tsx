import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { speak } from '../utils/speech';
import AudioVisualization from '../components/AudioVisualization';
import ConversationList from '../components/ConversationList';
import MessageSearch from '../components/MessageSearch';
import ConversationExport from '../components/ConversationExport';
import { typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { ServiceManager } from '../services/ServiceManager';
import { Message, Conversation, StreamResponse } from '../types/chat';

export default function ChatScreen({ navigation }: any) {
  const { theme } = useTheme();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [shouldSpeak, setShouldSpeak] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [isYuTyping, setIsYuTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting' | 'failed'>('disconnected');
  
  // New state for conversation management
  const [showConversationList, setShowConversationList] = useState(false);
  const [showMessageSearch, setShowMessageSearch] = useState(false);
  const [showConversationExport, setShowConversationExport] = useState(false);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const serviceManager = ServiceManager.getInstance();

  // Typing indicator animation
  const TypingIndicator = () => {
    const dot1 = useRef(new Animated.Value(0.4)).current;
    const dot2 = useRef(new Animated.Value(0.4)).current;
    const dot3 = useRef(new Animated.Value(0.4)).current;

    useEffect(() => {
      const animate = () => {
        const duration = 600;
        const sequence = Animated.sequence([
          Animated.timing(dot1, { toValue: 1, duration: duration / 3, useNativeDriver: false }),
          Animated.timing(dot2, { toValue: 1, duration: duration / 3, useNativeDriver: false }),
          Animated.timing(dot3, { toValue: 1, duration: duration / 3, useNativeDriver: false }),
          Animated.timing(dot1, { toValue: 0.4, duration: duration / 3, useNativeDriver: false }),
          Animated.timing(dot2, { toValue: 0.4, duration: duration / 3, useNativeDriver: false }),
          Animated.timing(dot3, { toValue: 0.4, duration: duration / 3, useNativeDriver: false }),
        ]);

        Animated.loop(sequence).start();
      };

      animate();
    }, []);

    return (
      <View style={styles.typingIndicator}>
        <Animated.View style={[styles.typingDot, { opacity: dot1 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot2 }]} />
        <Animated.View style={[styles.typingDot, { opacity: dot3 }]} />
      </View>
    );
  };

  // Initialize conversation and load messages
  useEffect(() => {
    initializeChat();
    return () => {
      // Cleanup WebSocket connection on unmount
      const chatService = serviceManager.getChatService();
      if (chatService.isStreamConnected()) {
        chatService.disconnectStream();
      }
    };
  }, []);

  // Set up streaming if enabled
  useEffect(() => {
    const chatService = serviceManager.getChatService();
    if (currentConversation && chatService.isStreamingEnabled()) {
      setupStreaming();
    }
  }, [currentConversation]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const chatService = serviceManager.getChatService();

      // Get recent conversations
      const conversationList = await chatService.getConversations(1, 1);

      if (conversationList.conversations.length > 0) {
        // Use the most recent conversation
        const conversation = conversationList.conversations[0];
        setCurrentConversation(conversation);

        // Load messages for this conversation
        const messageList = await chatService.getConversationMessages(conversation.id, 1, 50);
        setMessages(messageList.messages);
      } else {
        // Create a new conversation
        const newConversation = await chatService.createConversation(
          'New Chat',
          'helpful',
          "Hello! I'm Yu, your virtual clone assistant. How can I help you today?"
        );
        setCurrentConversation(newConversation);

        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          conversationId: newConversation.id,
          role: 'assistant',
          content: "Hello! I'm Yu, your virtual clone assistant. How can I help you today?",
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert('Error', 'Failed to load chat. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setupStreaming = async () => {
    if (!currentConversation) return;

    try {
      setConnectionStatus('reconnecting');
      const chatService = serviceManager.getChatService();

      // Connect to streaming
      await chatService.connectToStream(currentConversation.id);
      setConnectionStatus('connected');

      // Set up stream response handler
      chatService.onStreamResponse((response: StreamResponse) => {
        handleStreamResponse(response);
      });

    } catch (error) {
      console.error('Failed to setup streaming:', error);
      setConnectionStatus('failed');
      // Continue without streaming
    }
  };

  const handleStreamResponse = (response: StreamResponse) => {
    switch (response.type) {
      case 'message_start':
        setIsStreaming(true);
        setStreamingMessage('');
        setIsYuTyping(true);
        break;

      case 'message_delta':
        setStreamingMessage(prev => prev + (response.data.content || ''));
        setIsYuTyping(false); // Stop typing indicator when content starts flowing
        break;

      case 'message_end':
        setIsStreaming(false);
        setIsYuTyping(false);
        const completeMessage: Message = {
          id: response.messageId || Date.now().toString(),
          conversationId: response.conversationId,
          role: 'assistant',
          content: response.data.content,
          timestamp: new Date(),
          metadata: response.data.metadata
        };
        setMessages(prev => [...prev, completeMessage]);
        setStreamingMessage('');

        // Speak the response if it came from voice input
        if (shouldSpeak) {
          speak(response.data.content, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
          });
          setShouldSpeak(false);
        }
        break;

      case 'typing_indicator':
        setIsYuTyping(response.data.isTyping);
        break;

      case 'connection_status':
        setConnectionStatus(response.data.status);
        if (response.data.status === 'failed') {
          Alert.alert(
            'Connection Lost', 
            response.data.message || 'Connection to chat service lost. Please try again.',
            [
              { text: 'Retry', onPress: () => retryConnection() },
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
        break;

      case 'error':
        setIsStreaming(false);
        setIsYuTyping(false);
        setStreamingMessage('');
        Alert.alert('Error', response.data.error || 'An error occurred while processing your message.');
        break;
    }
  };

  const retryConnection = async () => {
    if (!currentConversation) return;

    try {
      setConnectionStatus('reconnecting');
      const chatService = serviceManager.getChatService();
      await chatService.reconnectStream();
    } catch (error) {
      console.error('Failed to retry connection:', error);
      setConnectionStatus('failed');
      Alert.alert('Connection Failed', 'Unable to reconnect to chat service. Please try again later.');
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !currentConversation || isLoading) return;

    const userMessageText = message.trim();
    const currentShouldSpeak = shouldSpeak;

    // Add user message to UI immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      conversationId: currentConversation.id,
      role: 'user',
      content: userMessageText,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setShouldSpeak(false);
    setIsLoading(true);

    try {
      const chatService = serviceManager.getChatService();

      // Check if streaming is available and connected
      if (chatService.isStreamingEnabled() && chatService.isStreamConnected()) {
        // Use streaming
        chatService.sendStreamMessage(userMessageText, 'helpful');
      } else {
        // Use regular API call
        const response = await chatService.sendMessage(
          userMessageText,
          currentConversation.id,
          'helpful'
        );

        // Add AI response to messages
        setMessages(prev => [...prev, response.message]);

        // Speak the response if it came from voice input
        if (currentShouldSpeak) {
          speak(response.message.content, {
            language: 'en',
            pitch: 1.0,
            rate: 0.9,
          });
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecord = () => {
    if (isRecording) {
      // Stop recording and process speech-to-text
      setIsRecording(false);
      setIsListening(true);

      // Mock: simulate speech-to-text result
      setTimeout(() => {
        setIsListening(false);
        const mockTranscription = 'What can you help me with?';
        setMessage(mockTranscription);
        setShouldSpeak(true);
      }, 1500);
    } else {
      // Start recording
      setIsRecording(true);

      // Auto-stop after 3 seconds for demo purposes
      setTimeout(() => {
        if (isRecording) {
          handleRecord(); // Stop recording
        }
      }, 3000);
    }
  };

  // Conversation management functions
  const handleSelectConversation = async (conversation: Conversation) => {
    try {
      setIsLoading(true);
      setCurrentConversation(conversation);
      setShowConversationList(false);

      // Load messages for selected conversation
      const chatService = serviceManager.getChatService();
      const messageList = await chatService.getConversationMessages(conversation.id, 1, 50);
      setMessages(messageList.messages);

      // Set up streaming for new conversation
      if (chatService.isStreamingEnabled()) {
        setupStreaming();
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      Alert.alert('Error', 'Failed to load conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNewConversation = async () => {
    try {
      setIsLoading(true);
      setShowConversationList(false);

      const chatService = serviceManager.getChatService();
      const newConversation = await chatService.createConversation(
        'New Chat',
        'helpful',
        "Hello! I'm Yu, your virtual clone assistant. How can I help you today?"
      );
      
      setCurrentConversation(newConversation);
      
      // Add welcome message
      const welcomeMessage: Message = {
        id: 'welcome',
        conversationId: newConversation.id,
        role: 'assistant',
        content: "Hello! I'm Yu, your virtual clone assistant. How can I help you today?",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);

      // Set up streaming for new conversation
      if (chatService.isStreamingEnabled()) {
        setupStreaming();
      }
    } catch (error) {
      console.error('Failed to create conversation:', error);
      Alert.alert('Error', 'Failed to create new conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRenameConversation = async () => {
    if (!currentConversation) return;

    Alert.prompt(
      'Rename Conversation',
      'Enter a new title for this conversation:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async (newTitle: string | undefined) => {
            if (!newTitle?.trim()) return;

            try {
              const chatService = serviceManager.getChatService();
              const updatedConversation = await chatService.updateConversationTitle(
                currentConversation.id,
                newTitle.trim()
              );
              setCurrentConversation(updatedConversation);
              setShowConversationMenu(false);
            } catch (error) {
              console.error('Failed to rename conversation:', error);
              Alert.alert('Error', 'Failed to rename conversation. Please try again.');
            }
          },
        },
      ],
      'plain-text',
      currentConversation.title
    );
  };

  const handleArchiveConversation = async () => {
    if (!currentConversation) return;

    Alert.alert(
      'Archive Conversation',
      'This conversation will be moved to your archived conversations.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          onPress: async () => {
            try {
              const chatService = serviceManager.getChatService();
              await chatService.archiveConversation(currentConversation.id, true);
              setShowConversationMenu(false);
              
              // Navigate back or load a different conversation
              Alert.alert('Archived', 'Conversation has been archived.', [
                { text: 'OK', onPress: () => setShowConversationList(true) }
              ]);
            } catch (error) {
              console.error('Failed to archive conversation:', error);
              Alert.alert('Error', 'Failed to archive conversation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleSelectSearchResult = (message: Message) => {
    // Scroll to the message in the conversation
    // For now, we'll just show an alert with the message details
    Alert.alert(
      'Message Found',
      `From: ${message.role === 'user' ? 'You' : 'Yu'}\nTime: ${new Date(message.timestamp).toLocaleString()}\n\n${message.content}`,
      [{ text: 'OK' }]
    );
  };

  useEffect(() => {
    // Scroll to bottom when new message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowConversationList(true)}>
          <Ionicons name="chatbubbles-outline" size={24} color={theme.text} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => setShowConversationMenu(true)}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <View style={styles.avatarInner} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentConversation?.title || 'Yu'}
            </Text>
            <Text style={[
              styles.headerSubtitle,
              connectionStatus === 'connected' && styles.headerOnline,
              connectionStatus === 'reconnecting' && styles.headerReconnecting,
              connectionStatus === 'failed' && styles.headerOffline
            ]}>
              {connectionStatus === 'connected' ? 'Online' : 
               connectionStatus === 'reconnecting' ? 'Reconnecting...' :
               connectionStatus === 'failed' ? 'Offline' : 'Connecting...'}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => setShowMessageSearch(true)}>
            <Ionicons name="search-outline" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('YuVision')}>
            <Ionicons name="camera-outline" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageContainer,
                msg.role === 'user' && styles.userMessageContainer
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.messageHeader}>
                  <Ionicons name="star" size={16} color={theme.purple} />
                  <Text style={styles.messageSender}>Yu</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.role === 'user' && styles.userMessageBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.role === 'user' && styles.userMessageText
                  ]}
                >
                  {msg.content}
                </Text>
              </View>
            </View>
          ))}

          {/* Show typing indicator */}
          {isYuTyping && !isStreaming && (
            <View style={styles.messageContainer}>
              <View style={styles.messageHeader}>
                <Ionicons name="star" size={16} color={theme.purple} />
                <Text style={styles.messageSender}>Yu</Text>
              </View>
              <View style={styles.messageBubble}>
                <TypingIndicator />
              </View>
            </View>
          )}

          {/* Show streaming message */}
          {isStreaming && streamingMessage && (
            <View style={styles.messageContainer}>
              <View style={styles.messageHeader}>
                <Ionicons name="star" size={16} color={theme.purple} />
                <Text style={styles.messageSender}>Yu</Text>
              </View>
              <View style={styles.messageBubble}>
                <Text style={styles.messageText}>
                  {streamingMessage}
                  <Text style={styles.cursor}>|</Text>
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {isListening && (
          <View style={styles.listeningContainer}>
            <AudioVisualization isActive={true} />
            <Text style={styles.listeningText}>Listening...</Text>
          </View>
        )}

        {isRecording && (
          <View style={styles.listeningContainer}>
            <AudioVisualization isActive={true} />
            <Text style={styles.listeningText}>Recording...</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.inputIcon, isRecording && styles.inputIconRecording]}
            onPress={handleRecord}
          >
            <Ionicons
              name={isRecording ? "mic" : "mic-outline"}
              size={24}
              color={isRecording ? theme.purple : theme.text}
            />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message Yu..."
            placeholderTextColor={theme.textSecondary}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            multiline
            editable={!isRecording}
          />
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSend}
            disabled={!message.trim() || isRecording || isLoading}
          >
            {isLoading ? (
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={theme.textSecondary}
              />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={message.trim() && !isRecording && !isLoading ? theme.text : theme.textSecondary}
              />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Conversation List Modal */}
      <Modal
        visible={showConversationList}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowConversationList(false)}
      >
        <ConversationList
          onSelectConversation={handleSelectConversation}
          selectedConversationId={currentConversation?.id}
          onCreateNew={handleCreateNewConversation}
        />
      </Modal>

      {/* Message Search Modal */}
      <Modal
        visible={showMessageSearch}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMessageSearch(false)}
      >
        <MessageSearch
          conversationId={currentConversation?.id}
          onSelectMessage={handleSelectSearchResult}
          onClose={() => setShowMessageSearch(false)}
        />
      </Modal>

      {/* Conversation Export Modal */}
      {currentConversation && (
        <ConversationExport
          conversation={currentConversation}
          visible={showConversationExport}
          onClose={() => setShowConversationExport(false)}
        />
      )}

      {/* Conversation Menu Modal */}
      <Modal
        visible={showConversationMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowConversationMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowConversationMenu(false)}
        >
          <View style={styles.conversationMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleRenameConversation}
            >
              <Ionicons name="create-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                Rename Conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setShowConversationMenu(false);
                setShowConversationExport(true);
              }}
            >
              <Ionicons name="download-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                Export Conversation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleArchiveConversation}
            >
              <Ionicons name="archive-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                Archive Conversation
              </Text>
            </TouchableOpacity>

            <View style={styles.menuSeparator} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-outline" size={20} color={theme.text} />
              <Text style={[styles.menuItemText, { color: theme.text }]}>
                Profile Settings
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginHorizontal: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.blueLight,
  },
  headerText: {
    gap: 2,
    flex: 1,
  },
  headerTitle: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.caption,
    color: theme.text,
  },
  headerOnline: {
    color: theme.green || '#4CAF50',
  },
  headerReconnecting: {
    color: theme.orange || '#FF9800',
  },
  headerOffline: {
    color: theme.red || '#F44336',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationMenu: {
    backgroundColor: theme.cardBackground,
    borderRadius: 12,
    minWidth: 250,
    paddingVertical: 8,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  menuItemText: {
    ...typography.body,
  },
  menuSeparator: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: 4,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
    gap: 16,
  },
  messageContainer: {
    gap: 8,
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  messageSender: {
    ...typography.caption,
    color: theme.text,
    fontWeight: '600',
  },
  messageBubble: {
    backgroundColor: theme.cardBackground,
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  userMessageBubble: {
    backgroundColor: theme.purple,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    borderColor: theme.purple,
  },
  messageText: {
    ...typography.body,
    color: theme.text,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  cursor: {
    opacity: 0.7,
    fontWeight: 'bold',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.textSecondary,
    opacity: 0.4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: theme.border,
    gap: 12,
  },
  inputIcon: {
    padding: 8,
  },
  inputIconRecording: {
    backgroundColor: theme.purple + '20',
    borderRadius: 20,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: theme.text,
    backgroundColor: theme.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: theme.cardBorder,
  },
  sendButton: {
    padding: 8,
  },
  listeningContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  listeningText: {
    ...typography.body,
    color: theme.text,
    fontWeight: '600',
  },
});