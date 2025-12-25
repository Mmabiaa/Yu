## 5. API Specifications

### 5.1 API Design Principles

1. **RESTful Design**: Follow REST conventions
2. **Versioning**: `/api/v1/` prefix, semantic versioning
3. **Consistent Response Format**: Standardized error and success responses
4. **Pagination**: Cursor-based for large datasets
5. **Rate Limiting**: Per-user and per-endpoint limits
6. **Documentation**: OpenAPI 3.0 (Swagger) specification

### 5.2 Authentication

#### JWT Token Flow
```
1. User Login → Receive Access Token (15min) + Refresh Token (7 days)
2. Include Access Token in Authorization header: Bearer <token>
3. On 401, use Refresh Token to get new Access Token
4. On Refresh Token expiry, require re-login
```

#### Token Structure
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 900
}
```

### 5.3 Core API Endpoints

#### Chat API

**POST /api/v1/chat/message**
```json
Request:
{
  "message": "Hello, how can you help me?",
  "conversation_id": "conv_123",
  "personality": "friend",
  "stream": false
}

Response:
{
  "message_id": "msg_456",
  "response": "Hey there! I'm Yu, your digital twin...",
  "conversation_id": "conv_123",
  "timestamp": "2024-12-24T10:00:00Z",
  "tokens_used": 150,
  "model": "gpt-4-turbo"
}
```

**WebSocket /api/v1/chat/stream**
```json
Client → Server:
{
  "type": "message",
  "data": {
    "message": "Tell me a joke",
    "conversation_id": "conv_123"
  }
}

Server → Client (streaming):
{
  "type": "token",
  "data": "Here"
}
{
  "type": "token",
  "data": "'s"
}
...
{
  "type": "complete",
  "data": {
    "message_id": "msg_789",
    "full_response": "Here's a joke: ..."
  }
}
```

#### Voice API

**POST /api/v1/voice/transcribe**
```json
Request: multipart/form-data
- audio: File (wav, mp3, m4a)
- language: "en" (optional, auto-detect if not provided)
- format: "text" | "json" (default: "text")

Response:
{
  "transcription": "Hello, how are you?",
  "language": "en",
  "confidence": 0.95,
  "duration": 2.5
}
```

**POST /api/v1/voice/synthesize**
```json
Request:
{
  "text": "Hello, I'm Yu!",
  "voice": "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer",
  "language": "en",
  "speed": 1.0,
  "format": "mp3" | "opus" | "aac" | "flac"
}

Response:
{
  "audio_url": "https://cdn.yu.app/audio/abc123.mp3",
  "duration": 2.1,
  "format": "mp3"
}
```

#### Translation API

**POST /api/v1/translate/text**
```json
Request:
{
  "text": "Hello, how are you?",
  "from_language": "en",
  "to_language": "es",
  "context": "casual_conversation" (optional)
}

Response:
{
  "translation": "Hola, ¿cómo estás?",
  "from_language": "en",
  "to_language": "es",
  "confidence": 0.98,
  "alternatives": ["Hola, ¿qué tal?"]
}
```

#### Vision API

**POST /api/v1/vision/analyze**
```json
Request: multipart/form-data
- image: File (jpg, png, webp)
- task: "general" | "objects" | "text" | "scene"
- detail: "low" | "high" (default: "high")

Response:
{
  "analysis": "This image shows a modern living room...",
  "objects": [
    {"name": "sofa", "confidence": 0.95, "bbox": [100, 200, 300, 400]},
    {"name": "table", "confidence": 0.92, "bbox": [150, 250, 250, 350]}
  ],
  "text": ["Welcome", "Home"],
  "scene": "indoor_living_room"
}
```

### 5.4 Error Handling

#### Standard Error Response
```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request is missing required field: message",
    "details": {
      "field": "message",
      "reason": "required"
    },
    "request_id": "req_abc123",
    "timestamp": "2024-12-24T10:00:00Z"
  }
}
```

#### Error Codes
- `400 BAD_REQUEST`: Invalid request format
- `401 UNAUTHORIZED`: Missing or invalid authentication
- `403 FORBIDDEN`: Insufficient permissions
- `404 NOT_FOUND`: Resource not found
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded
- `500 INTERNAL_SERVER_ERROR`: Server error
- `503 SERVICE_UNAVAILABLE`: Service temporarily unavailable

### 5.5 Rate Limiting

#### Limits (per user)
- **Chat**: 100 requests/minute, 1000 requests/hour
- **Voice**: 50 requests/minute, 500 requests/hour
- **Translation**: 200 requests/minute, 2000 requests/hour
- **Vision**: 30 requests/minute, 300 requests/hour

#### Response Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703424000
```
