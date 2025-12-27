import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme';
import { Message, MessageList } from '../types/chat';
import { ServiceManager } from '../services/ServiceManager';

interface MessageSearchProps {
  conversationId?: string;
  onSelectMessage?: (message: Message) => void;
  onClose: () => void;
}

export default function MessageSearch({
  conversationId,
  onSelectMessage,
  onClose,
}: MessageSearchProps) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const serviceManager = ServiceManager.getInstance();

  // Debounced search function
  const debounceTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (searchQuery: string, resetResults = true) => {
    if (!searchQuery.trim()) {
      setMessages([]);
      setHasMore(false);
      setTotalResults(0);
      return;
    }

    try {
      setIsLoading(true);
      const chatService = serviceManager.getChatService();
      
      const currentOffset = resetResults ? 0 : offset;
      const response: MessageList = await chatService.searchMessages(
        searchQuery.trim(),
        conversationId,
        20,
        currentOffset
      );

      if (resetResults) {
        setMessages(response.messages);
        setOffset(20);
      } else {
        setMessages(prev => [...prev, ...response.messages]);
        setOffset(prev => prev + 20);
      }

      setHasMore(response.hasMore);
      setTotalResults(response.total);
    } catch (error: any) {
      console.error('Search failed:', error);
      Alert.alert('Search Error', error.message || 'Failed to search messages. Please try again.');
      if (resetResults) {
        setMessages([]);
        setHasMore(false);
        setTotalResults(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  // Debounced search effect
  useEffect(() => {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      performSearch(query, true);
    }, 300);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [query, performSearch]);

  const handleLoadMore = () => {
    if (!isLoading && hasMore && query.trim()) {
      performSearch(query, false);
    }
  };

  const handleSelectMessage = (message: Message) => {
    if (onSelectMessage) {
      onSelectMessage(message);
    }
    onClose();
  };

  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <Text key={index} style={[styles.highlightText, { backgroundColor: theme.purple + '40' }]}>
            {part}
          </Text>
        );
      }
      return part;
    });
  };

  const formatTimestamp = (timestamp: Date) => {
    const date = new Date(timestamp);
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

  const renderMessage = ({ item }: { item: Message }) => (
    <TouchableOpacity
      style={styles.messageItem}
      onPress={() => handleSelectMessage(item)}
      activeOpacity={0.7}
    >
      <View style={styles.messageHeader}>
        <View style={styles.messageRole}>
          <Ionicons
            name={item.role === 'user' ? 'person' : 'star'}
            size={14}
            color={item.role === 'user' ? theme.blue : theme.purple}
          />
          <Text style={[styles.roleText, { color: theme.textSecondary }]}>
            {item.role === 'user' ? 'You' : 'Yu'}
          </Text>
        </View>
        <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
          {formatTimestamp(item.timestamp)}
        </Text>
      </View>
      
      <Text style={[styles.messageContent, { color: theme.text }]} numberOfLines={3}>
        {highlightText(item.content, query)}
      </Text>

      {item.metadata?.confidence && (
        <Text style={[styles.confidence, { color: theme.textSecondary }]}>
          Confidence: {Math.round(item.metadata.confidence * 100)}%
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (!query.trim()) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            Search Messages
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {conversationId 
              ? 'Search within this conversation'
              : 'Search across all your conversations'
            }
          </Text>
        </View>
      );
    }

    if (messages.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={48} color={theme.textSecondary} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>
            No Results Found
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            Try different keywords or check your spelling
          </Text>
        </View>
      );
    }

    return null;
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={theme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={conversationId ? "Search in conversation..." : "Search all messages..."}
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {totalResults > 0 && (
        <View style={styles.resultsHeader}>
          <Text style={[styles.resultsCount, { color: theme.textSecondary }]}>
            {totalResults} result{totalResults !== 1 ? 's' : ''} found
          </Text>
        </View>
      )}

      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyState}
        ListFooterComponent={
          isLoading && messages.length > 0 ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={theme.purple} />
            </View>
          ) : null
        }
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.cardBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: theme.text,
    paddingVertical: 4,
  },
  closeButton: {
    padding: 4,
  },
  resultsHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  resultsCount: {
    ...typography.caption,
  },
  listContent: {
    flexGrow: 1,
  },
  messageItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
    gap: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  messageRole: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  roleText: {
    ...typography.caption,
    fontWeight: '600',
  },
  timestamp: {
    ...typography.caption,
  },
  messageContent: {
    ...typography.body,
    lineHeight: 20,
  },
  highlightText: {
    fontWeight: '600',
    borderRadius: 2,
    paddingHorizontal: 2,
  },
  confidence: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 16,
  },
  emptyTitle: {
    ...typography.h3,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtitle: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingFooter: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});