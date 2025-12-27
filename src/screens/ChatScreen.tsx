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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { speak } from '../utils/speech';
import AudioVisualization from '../components/AudioVisualization';
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
  const scrollViewRef = useRef<ScrollView>(null);
  const serviceManager = ServiceManager.getInstance();

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
      const chatService = serviceManager.getChatService();

      // Connect to streaming
      await chatService.connectToStream(currentConversation.id);

      // Set up stream response handler
      chatService.onStreamResponse((response: StreamResponse) => {
        handleStreamResponse(response);
      });

    } catch (error) {
      console.error('Failed to setup streaming:', error);
      // Continue without streaming
    }
  };

  const handleStreamResponse = (response: StreamResponse) => {
    switch (response.type) {
      case 'message_start':
        setIsStreaming(true);
        setStreamingMessage('');
        break;

      case 'message_delta':
        setStreamingMessage(prev => prev + (response.data.content || ''));
        break;

      case 'message_end':
        setIsStreaming(false);
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

      case 'error':
        setIsStreaming(false);
        setStreamingMessage('');
        Alert.alert('Error', response.data.error || 'An error occurred while processing your message.');
        break;
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerCenter}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <View style={styles.avatarInner} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Yu</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('YuVision')}>
          <Ionicons name="camera-outline" size={24} color={theme.text} />
        </TouchableOpacity>
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