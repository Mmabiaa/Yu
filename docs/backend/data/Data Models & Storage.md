## 6. Data Models & Storage

### 6.1 Database Schema

#### Users Table (PostgreSQL)
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(50) DEFAULT 'free'
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

#### Conversations Table
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    personality VARCHAR(50) DEFAULT 'friend',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    message_count INTEGER DEFAULT 0
);

CREATE INDEX idx_conversations_user ON conversations(user_id);
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
```

#### Messages Table
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL, -- 'user' | 'assistant' | 'system'
    content TEXT NOT NULL,
    tokens_used INTEGER,
    model VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    metadata JSONB
);

CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
```

#### User Preferences Table
```sql
CREATE TABLE user_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    personality VARCHAR(50) DEFAULT 'friend',
    presence_level VARCHAR(50) DEFAULT 'full',
    language VARCHAR(10) DEFAULT 'en',
    voice_settings JSONB,
    notification_settings JSONB,
    privacy_settings JSONB,
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Vector Database Schema

#### Conversation Embeddings (Pinecone)
```
Index: "conversations"
Dimensions: 1536 (text-embedding-3-small)
Metadata:
  - user_id: string
  - conversation_id: string
  - message_id: string
  - timestamp: int64
  - role: string
```

### 6.3 Caching Strategy

#### Redis Cache Keys
```
user:{user_id}:profile → User profile (TTL: 1 hour)
user:{user_id}:preferences → User preferences (TTL: 1 hour)
conversation:{conversation_id}:context → Conversation context (TTL: 24 hours)
translation:{hash}:{from}:{to} → Translation cache (TTL: 7 days)
vision:{image_hash} → Vision analysis (TTL: 30 days)
```

### 6.4 File Storage

#### S3 Bucket Structure
```
yu-assistant/
├── audio/
│   ├── recordings/{user_id}/{timestamp}.wav
│   └── synthesized/{user_id}/{timestamp}.mp3
├── images/
│   ├── uploads/{user_id}/{timestamp}.jpg
│   └── processed/{user_id}/{timestamp}.jpg
└── documents/
    └── {user_id}/{document_id}.pdf
```

---
