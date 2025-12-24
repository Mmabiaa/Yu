# Yu Assistant - Component API Documentation

## Overview

This document provides detailed API documentation for all components, screens, and utilities in the Yu Assistant application.

## Table of Contents

1. [Screen Components](#screen-components)
2. [Reusable Components](#reusable-components)
3. [Utility Functions](#utility-functions)
4. [Theme System](#theme-system)

---

## Screen Components

### HomeScreen

**Location**: `src/screens/HomeScreen.tsx`

**Purpose**: Main landing screen with Yu Orb and quick actions

#### Props

```typescript
interface HomeScreenProps {
  navigation: NavigationProp<any>;
}
```

#### State

```typescript
const [isListening, setIsListening] = useState<boolean>(false);
const [response, setResponse] = useState<string>('');
```

#### Methods

- `handleOrbTap()`: Starts listening mode
- `handleOrbLongPress()`: Navigates to Profile screen
- `getGreeting()`: Returns time-based greeting
- `getDate()`: Returns formatted current date

#### Usage

```typescript
<HomeScreen navigation={navigation} />
```

---

### ProfileScreen

**Location**: `src/screens/ProfileScreen.tsx`

**Purpose**: User profile management and customization

#### Props

```typescript
interface ProfileScreenProps {
  navigation: NavigationProp<any>;
}
```

#### State

```typescript
const [selectedPersonality, setSelectedPersonality] = useState<string>('friend');
const [selectedPresence, setSelectedPresence] = useState<string>('full');
const [userName, setUserName] = useState<string>('');
```

#### Usage

```typescript
<ProfileScreen navigation={navigation} />
```

---

### ChatScreen

**Location**: `src/screens/ChatScreen.tsx`

**Purpose**: Interactive chat interface with Yu

#### Props

```typescript
interface ChatScreenProps {
  navigation: NavigationProp<any>;
}
```

#### State

```typescript
const [message, setMessage] = useState<string>('');
const [messages, setMessages] = useState<Message[]>([]);
const [isRecording, setIsRecording] = useState<boolean>(false);
```

#### Types

```typescript
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'yu';
  timestamp: Date;
}
```

#### Methods

- `handleSend()`: Sends message and gets response
- `handleRecord()`: Toggles recording state
- `getMockResponse(userMessage: string)`: Returns mock AI response

#### Usage

```typescript
<ChatScreen navigation={navigation} />
```

---

### TranslateScreen

**Location**: `src/screens/TranslateScreen.tsx`

**Purpose**: Multi-language translation interface

#### Props

```typescript
interface TranslateScreenProps {
  navigation: NavigationProp<any>;
}
```

#### State

```typescript
const [fromLang, setFromLang] = useState<Language>(languages[0]);
const [toLang, setToLang] = useState<Language>(languages[1]);
const [inputText, setInputText] = useState<string>('');
const [outputText, setOutputText] = useState<string>('');
const [showFromDropdown, setShowFromDropdown] = useState<boolean>(false);
const [showToDropdown, setShowToDropdown] = useState<boolean>(false);
const [isRecording, setIsRecording] = useState<boolean>(false);
```

#### Types

```typescript
interface Language {
  code: string;
  name: string;
  flag: string;
}
```

#### Methods

- `handleTranslate()`: Translates input text
- `handleRecordAudio()`: Toggles audio recording
- `handleSpeakOutput()`: Speaks translated text
- `handleCopy()`: Copies text to clipboard and speaks
- `handleQuickPhrase(phrase: string)`: Translates quick phrase
- `swapLanguages()`: Swaps source and target languages

#### Usage

```typescript
<TranslateScreen navigation={navigation} />
```

---

### YuVisionScreen

**Location**: `src/screens/YuVisionScreen.tsx`

**Purpose**: Camera-based visual intelligence

#### Props

```typescript
interface YuVisionScreenProps {
  navigation: NavigationProp<any>;
}
```

#### State

```typescript
const [permission, requestPermission] = useCameraPermissions();
const [flashlightOn, setFlashlightOn] = useState<boolean>(false);
```

#### Methods

- `handleCapture()`: Captures image and provides analysis

#### Usage

```typescript
<YuVisionScreen navigation={navigation} />
```

---

## Reusable Components

### YuOrb

**Location**: `src/components/YuOrb.tsx`

**Purpose**: Interactive floating orb component

#### Props

```typescript
interface YuOrbProps {
  onTap?: () => void;
  onHold?: () => void;
  onDoubleTap?: () => void;
  listening?: boolean;
}
```

#### Props Description

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `onTap` | `() => void` | No | `undefined` | Callback for single tap |
| `onHold` | `() => void` | No | `undefined` | Callback for long press |
| `onDoubleTap` | `() => void` | No | `undefined` | Callback for double tap |
| `listening` | `boolean` | No | `false` | Controls glow animation |

#### Usage

```typescript
<YuOrb 
  onTap={handleTap}
  onHold={handleHold}
  onDoubleTap={handleDoubleTap}
  listening={isListening}
/>
```

#### Visual Design

- **Size**: 140x140 pixels
- **Glow Ring**: 180x180 pixels with gradient
- **Colors**: Blue-teal gradient (#3B82F6 → #60A5FA → #8B5CF6 → #10B981)
- **Animations**: Scale on press, glow pulse when listening

---

### AudioVisualization

**Location**: `src/components/AudioVisualization.tsx`

**Purpose**: Real-time audio waveform visualization

#### Props

```typescript
interface AudioVisualizationProps {
  isActive?: boolean;
}
```

#### Props Description

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `isActive` | `boolean` | No | `true` | Controls animation state |

#### Usage

```typescript
<AudioVisualization isActive={isRecording} />
```

#### Visual Design

- **Bars**: 40 animated bars
- **Colors**: Purple → Blue → Green gradient
- **Height**: 20-80 pixels (random)
- **Animation**: Continuous loop when active

---

## Utility Functions

### Speech Utilities

**Location**: `src/utils/speech.ts`

#### Functions

##### `speak(text: string, options?: SpeechOptions): void`

Speaks text using text-to-speech.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | `string` | Yes | Text to speak |
| `options` | `SpeechOptions` | No | Speech configuration |

**SpeechOptions**:

```typescript
interface SpeechOptions {
  language?: string;  // Language code (e.g., 'en', 'es')
  pitch?: number;     // Pitch (0.5 - 2.0, default: 1.0)
  rate?: number;      // Rate (0.1 - 1.0, default: 0.9)
}
```

**Usage**:

```typescript
import { speak } from '../utils/speech';

speak("Hello, I'm Yu", {
  language: 'en',
  pitch: 1.0,
  rate: 0.9,
});
```

##### `stop(): void`

Stops current speech synthesis.

**Usage**:

```typescript
import { stop } from '../utils/speech';

stop();
```

---

## Theme System

### Colors

**Location**: `src/theme/colors.ts`

#### Color Palette

```typescript
export const colors = {
  // Background
  background: '#000000',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textTertiary: '#666666',
  
  // Accents
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#6D28D9',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  green: '#10B981',
  greenLight: '#34D399',
  orange: '#F59E0B',
  red: '#EF4444',
  
  // Status
  online: '#10B981',
  offline: '#6B7280',
  
  // UI Elements
  selected: '#8B5CF6',
  unselected: '#2A2A2A',
  border: '#333333',
};
```

#### Usage

```typescript
import { colors } from '../theme';

<View style={{ backgroundColor: colors.background }}>
  <Text style={{ color: colors.text }}>Hello</Text>
</View>
```

---

### Typography

**Location**: `src/theme/typography.ts`

#### Typography Styles

```typescript
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
};
```

#### Usage

```typescript
import { typography } from '../theme';

<Text style={typography.h1}>Heading</Text>
<Text style={typography.body}>Body text</Text>
```

---

## Mock Data

### Mock Responses

**Location**: Various screen files

#### HomeScreen Mock Responses

```typescript
const mockResponses: { [key: string]: string } = {
  'hello': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'hi': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'hey': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'default': "Hey there! I'm Yu, your digital twin. How can I help you today?",
};
```

#### ChatScreen Mock Responses

```typescript
const mockResponses: { [key: string]: string } = {
  'hello': "Hey there! I'm Yu, your digital twin. How can I help you today?",
  'help': "I'm here to help! You can ask me to control your devices...",
  'control': "I can help you control your devices. What would you like me to do?",
  'translate': "I can translate between many languages. Just tell me what you need!",
  'vision': "I can analyze images and tell you what I see. Try using Yu-Vision!",
  'default': "I understand. How else can I assist you today?",
};
```

#### TranslateScreen Mock Translations

```typescript
const mockTranslations: { [key: string]: string } = {
  'Hello': 'Hola',
  'Thank you': 'Gracias',
  'Goodbye': 'Adiós',
  'Yes': 'Sí',
  'No': 'No',
  'Please': 'Por favor',
  'Sorry': 'Lo siento',
  'Help': 'Ayuda',
};
```

---

## Constants

### Languages

**Location**: `src/screens/TranslateScreen.tsx`

```typescript
const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
];
```

### Quick Phrases

**Location**: `src/screens/TranslateScreen.tsx`

```typescript
const quickPhrases = [
  'Hello', 'Thank you', 'Goodbye', 'Yes',
  'No', 'Please', 'Sorry', 'Help',
];
```

---

## Error Handling

### Current Error Handling

- **No Error Boundaries**: Errors may crash the app
- **No Error Logging**: Errors only visible in console
- **Basic Validation**: Input validation in some components

### Future Error Handling

- Error boundaries for graceful error handling
- Error logging service (Sentry)
- User-friendly error messages
- Retry mechanisms for API calls

---

## Type Definitions

### Common Types

```typescript
// Navigation
type NavigationProp<T> = any; // Simplified for MVP

// Messages
interface Message {
  id: string;
  text: string;
  sender: 'user' | 'yu';
  timestamp: Date;
}

// Languages
interface Language {
  code: string;
  name: string;
  flag: string;
}
```

---

**Last Updated**: December 2025  
**Version**: 1.0.0

