import React, { useState } from 'react';
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
import StatusBar from '../components/StatusBar';
import { colors, typography } from '../theme';

export default function ChatScreen({ navigation }: any) {
  const [message, setMessage] = useState('');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar time="1:57" battery="54%" />
      
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
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
          <View style={styles.messageContainer}>
            <View style={styles.messageHeader}>
              <Ionicons name="star" size={16} color={colors.purple} />
              <Text style={styles.messageSender}>Yu</Text>
            </View>
            <View style={styles.messageBubble}>
              <Text style={styles.messageText}>
                Hello! I'm Yu, your virtual clone assistant. How can I help you today?
              </Text>
            </View>
          </View>
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
            multiline
          />
          <TouchableOpacity style={styles.sendButton}>
            <Ionicons name="send" size={20} color={colors.text} />
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
    maxWidth: '85%',
    alignSelf: 'flex-start',
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

