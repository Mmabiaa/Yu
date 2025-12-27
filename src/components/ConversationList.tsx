import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme';
import { Conversation } from '../types/chat';
import { ServiceManager } from '../services/ServiceManager';

interface ConversationListProps {
  onSelectConversation: (conversation: Conversation) => void;
  selectedConversationId?: string;
  onCreateNew: () => void;
}

export default function ConversationList({
  onSelectConversation,
  selectedConversationId,
  onCreateNew,
}: ConversationListProps) {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const serviceManager = ServiceManager.getInstance();

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }

      const chatService = serviceManager.getChatService();
      const currentPage = refresh ? 1 : page;
      const response = await chatService.getConversations(currentPage, 20);

      if (refresh) {
        setConversations(response.conversations);
      } else {
        setConversations(prev => [...prev, ...response.conversations]);
      }

      setHasMore(response.hasMore);
      if (!refresh) {
        setPage(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
      Alert.alert('Error', 'Failed to load conversations. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadConversations(true);
  };

  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      loadConversations();
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    Alert.alert(
      'Delete Conversation',
      'Are you sure you want to delete this conversation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const chatService = serviceManager.getChatService();
              await chatService.deleteConversation(conversationId);
              setConversations(prev => prev.filter(c => c.id !== conversationId));
            } catch (error) {
              console.error('Failed to delete conversation:', error);
              Alert.alert('Error', 'Failed to delete conversation. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => {
    const isSelected = item.id === selectedConversationId;

    return (
      <TouchableOpacity
        style={[
          styles.conversationItem,
          isSelected && { backgroundColor: theme.purple + '20' },
        ]}
        onPress={() => onSelectConversation(item)}
        activeOpacity={0.7}
      >
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text
              style={[styles.conversationTitle, { color: theme.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.conversationDate, { color: theme.textSecondary }]}>
              {formatDate(new Date(item.updatedAt))}
            </Text>
          </View>
          
          {item.lastMessage && (
            <Text
              style={[styles.lastMessage, { color: theme.textSecondary }]}
              numberOfLines={2}
            >
              {item.lastMessage.role === 'user' ? 'You: ' : 'Yu: '}
              {item.lastMessage.content}
            </Text>
          )}

          <View style={styles.conversationFooter}>
            <View style={styles.conversationMeta}>
              <Ionicons
                name="chatbubble-outline"
                size={12}
                color={theme.textSecondary}
              />
              <Text style={[styles.messageCount, { color: theme.textSecondary }]}>
                {item.messageCount}
              </Text>
              
              <Ionicons
                name="person-outline"
                size={12}
                color={theme.textSecondary}
                style={{ marginLeft: 12 }}
              />
              <Text style={[styles.personality, { color: theme.textSecondary }]}>
                {item.personality}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeleteConversation(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversations</Text>
        <TouchableOpacity style={styles.newButton} onPress={onCreateNew}>
          <Ionicons name="add" size={24} color={theme.purple} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.purple}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
  headerTitle: {
    ...typography.h3,
    color: theme.text,
    fontWeight: '600',
  },
  newButton: {
    padding: 8,
  },
  listContent: {
    paddingVertical: 8,
  },
  conversationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  conversationContent: {
    gap: 8,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationTitle: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  conversationDate: {
    ...typography.caption,
  },
  lastMessage: {
    ...typography.body,
    fontSize: 14,
    lineHeight: 20,
  },
  conversationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  conversationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageCount: {
    ...typography.caption,
    marginLeft: 4,
  },
  personality: {
    ...typography.caption,
    marginLeft: 4,
    textTransform: 'capitalize',
  },
  deleteButton: {
    padding: 4,
  },
});