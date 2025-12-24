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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { speak } from '../utils/speech';
import { colors, typography } from '../theme';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'yu';
  timestamp: Date;
}

const mockResponses: { [key: string]: string } = {
  'hello': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'hi': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'hey': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'help': "I'm here to help! You can ask me to control your devices, translate languages, analyze images, or just chat. What would you like to do?",
  'control': "I can help you control your devices. What would you like me to do?",
  'translate': "I can translate between many languages. Just tell me what you need!",
  'vision': "I can analyze images and tell you what I see. Try using Yu-Vision!",
  'default': "I understand. How else can I assist you today?",
};

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm Yu, your virtual clone assistant. How can I help you today?",
      sender: 'yu',
      timestamp: new Date(),
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);

  const getMockResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    for (const [key, response] of Object.entries(mockResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    return mockResponses['default'];
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: message.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Simulate response delay
    setTimeout(() => {
      const responseText = getMockResponse(userMessage.text);
      const yuMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'yu',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, yuMessage]);
      
      // Speak the response
      speak(responseText, {
        language: 'en',
        pitch: 1.0,
        rate: 0.9,
      });
    }, 500);
  };

  useEffect(() => {
    // Scroll to bottom when new message is added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.avatar}>
            <View style={styles.avatarInner} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Yu</Text>
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <TouchableOpacity>
          <Ionicons name="camera-outline" size={24} color={colors.text} />
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
            <View key={msg.id} style={styles.messageContainer}>
              {msg.sender === 'yu' && (
                <View style={styles.messageHeader}>
                  <Ionicons name="star" size={16} color={colors.purple} />
                  <Text style={styles.messageSender}>Yu</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.sender === 'user' && styles.userMessageBubble,
                ]}
              >
                <Text style={styles.messageText}>{msg.text}</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.inputIcon}>
            <Ionicons name="mic-outline" size={24} color={colors.text} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Message Yu..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            onSubmitEditing={handleSend}
            multiline
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={message.trim() ? colors.text : colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
    borderBottomColor: colors.border,
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
    borderColor: colors.blue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.blueLight,
  },
  headerText: {
    gap: 2,
  },
  headerTitle: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.text,
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
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  messageSender: {
    ...typography.caption,
    color: colors.text,
    fontWeight: '600',
  },
  messageBubble: {
    backgroundColor: colors.surfaceLight,
    padding: 16,
    borderRadius: 16,
    borderTopLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: colors.purple,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 4,
    alignSelf: 'flex-end',
  },
  messageText: {
    ...typography.body,
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  inputIcon: {
    padding: 8,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
});
