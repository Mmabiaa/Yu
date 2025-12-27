import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { typography } from '../theme';
import { Conversation, ExportConversationResponse } from '../types/chat';
import { ServiceManager } from '../services/ServiceManager';

interface ConversationExportProps {
  conversation: Conversation;
  visible: boolean;
  onClose: () => void;
}

export default function ConversationExport({
  conversation,
  visible,
  onClose,
}: ConversationExportProps) {
  const { theme } = useTheme();
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'txt' | 'pdf'>('txt');
  const [includeMetadata, setIncludeMetadata] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const serviceManager = ServiceManager.getInstance();

  const formatOptions = [
    {
      value: 'txt' as const,
      label: 'Text File',
      description: 'Plain text format, easy to read',
      icon: 'document-text-outline',
    },
    {
      value: 'json' as const,
      label: 'JSON File',
      description: 'Structured data with full details',
      icon: 'code-outline',
    },
    {
      value: 'pdf' as const,
      label: 'PDF Document',
      description: 'Formatted document for sharing',
      icon: 'document-outline',
    },
  ];

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const chatService = serviceManager.getChatService();
      
      const response: ExportConversationResponse = await chatService.exportConversation(
        conversation.id,
        selectedFormat,
        includeMetadata
      );

      // Open the download URL
      const supported = await Linking.canOpenURL(response.downloadUrl);
      if (supported) {
        await Linking.openURL(response.downloadUrl);
        
        Alert.alert(
          'Export Successful',
          `Your conversation has been exported as ${response.filename}. The download should start automatically.`,
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        // Fallback: show the URL to copy
        Alert.alert(
          'Export Ready',
          `Your conversation has been exported. Copy this link to download:\n\n${response.downloadUrl}`,
          [
            { text: 'Copy Link', onPress: () => {
              // Note: In a real app, you'd use Clipboard API here
              console.log('Copy to clipboard:', response.downloadUrl);
            }},
            { text: 'Close', onPress: onClose }
          ]
        );
      }
    } catch (error: any) {
      console.error('Export failed:', error);
      Alert.alert(
        'Export Failed',
        error.message || 'Failed to export conversation. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  const renderFormatOption = (option: typeof formatOptions[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.formatOption,
        selectedFormat === option.value && { 
          backgroundColor: theme.purple + '20',
          borderColor: theme.purple 
        }
      ]}
      onPress={() => setSelectedFormat(option.value)}
      activeOpacity={0.7}
    >
      <View style={styles.formatIcon}>
        <Ionicons
          name={option.icon as any}
          size={24}
          color={selectedFormat === option.value ? theme.purple : theme.textSecondary}
        />
      </View>
      
      <View style={styles.formatContent}>
        <Text style={[
          styles.formatLabel,
          { color: selectedFormat === option.value ? theme.purple : theme.text }
        ]}>
          {option.label}
        </Text>
        <Text style={[styles.formatDescription, { color: theme.textSecondary }]}>
          {option.description}
        </Text>
      </View>

      <View style={styles.radioButton}>
        {selectedFormat === option.value && (
          <View style={[styles.radioButtonInner, { backgroundColor: theme.purple }]} />
        )}
      </View>
    </TouchableOpacity>
  );

  const styles = createStyles(theme);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={theme.text} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Export Conversation</Text>
          
          <TouchableOpacity
            onPress={handleExport}
            disabled={isExporting}
            style={[
              styles.exportButton,
              isExporting && { opacity: 0.5 }
            ]}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={theme.purple} />
            ) : (
              <Text style={[styles.exportButtonText, { color: theme.purple }]}>
                Export
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.conversationInfo}>
            <Text style={[styles.conversationTitle, { color: theme.text }]}>
              {conversation.title}
            </Text>
            <Text style={[styles.conversationMeta, { color: theme.textSecondary }]}>
              {conversation.messageCount} messages • {conversation.personality} personality
            </Text>
            <Text style={[styles.conversationDate, { color: theme.textSecondary }]}>
              Created {new Date(conversation.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Export Format
            </Text>
            <View style={styles.formatOptions}>
              {formatOptions.map(renderFormatOption)}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.optionRow}>
              <View style={styles.optionContent}>
                <Text style={[styles.optionLabel, { color: theme.text }]}>
                  Include Metadata
                </Text>
                <Text style={[styles.optionDescription, { color: theme.textSecondary }]}>
                  Include timestamps, message IDs, and processing details
                </Text>
              </View>
              <Switch
                value={includeMetadata}
                onValueChange={setIncludeMetadata}
                trackColor={{ false: theme.border, true: theme.purple + '40' }}
                thumbColor={includeMetadata ? theme.purple : theme.textSecondary}
              />
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={theme.blue} />
            <Text style={[styles.infoText, { color: theme.textSecondary }]}>
              Exported files will be available for download for 24 hours. 
              {selectedFormat === 'pdf' && ' PDF exports may take longer to generate.'}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
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
  exportButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  exportButtonText: {
    ...typography.body,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  conversationInfo: {
    gap: 4,
  },
  conversationTitle: {
    ...typography.h3,
    fontWeight: '600',
  },
  conversationMeta: {
    ...typography.body,
  },
  conversationDate: {
    ...typography.caption,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    ...typography.h3,
    fontSize: 18,
    fontWeight: '600',
  },
  formatOptions: {
    gap: 8,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    backgroundColor: theme.cardBackground,
    gap: 12,
  },
  formatIcon: {
    width: 40,
    alignItems: 'center',
  },
  formatContent: {
    flex: 1,
    gap: 2,
  },
  formatLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  formatDescription: {
    ...typography.caption,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  optionContent: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  optionDescription: {
    ...typography.caption,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: theme.blue + '10',
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
  },
});