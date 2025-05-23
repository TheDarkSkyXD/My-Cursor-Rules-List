# CollabX API Documentation

## WebSocket Events

### Connection
- **URL**: `ws://<server>/api/ws`
- **Query Parameters**:
  - `sessionId`: Required. Alphanumeric string identifying the session
  - `username`: Required. User's display name

### Event Types

#### Client to Server Events

1. **JOIN**
   - Purpose: Join a collaborative session
   - Payload:
     ```typescript
     {
       username: string;
     }
     ```
   - Response: `{ user: User }`
   - Rate Limit: 5 attempts per minute

2. **CONTENT_CHANGE**
   - Purpose: Broadcast editor content changes
   - Payload:
     ```typescript
     {
       content: string;
     }
     ```
   - Rate Limit: 10 requests per 5 minutes

3. **LANGUAGE_CHANGE**
   - Purpose: Change editor language
   - Payload:
     ```typescript
     {
       language: string;
     }
     ```

4. **CURSOR_MOVE**
   - Purpose: Update cursor position
   - Payload:
     ```typescript
     {
       position: {
         top: number;
         left: number;
       }
     }
     ```
   - Rate Limit: 10 requests per 5 minutes

5. **SELECTION_CHANGE**
   - Purpose: Update text selection
   - Payload:
     ```typescript
     {
       selection: {
         start: number;
         end: number;
       }
     }
     ```

6. **SYNC_REQUEST**
   - Purpose: Request current session state
   - Payload: None

7. **TYPING_STATUS**
   - Purpose: Update user typing status
   - Payload:
     ```typescript
     {
       isTyping: boolean;
     }
     ```

#### Server to Client Events

1. **ERROR**
   - Purpose: Report errors to client
   - Payload:
     ```typescript
     {
       type: 'INVALID_PAYLOAD' | 'RATE_LIMIT_EXCEEDED' | 'SESSION_FULL' | 'JOIN_ERROR';
       message: string;
     }
     ```

2. **USER_JOINED**
   - Purpose: Notify when a new user joins
   - Payload:
     ```typescript
     {
       user: User;
     }
     ```

3. **USER_LEFT**
   - Purpose: Notify when a user leaves
   - Payload:
     ```typescript
     {
       user: User;
     }
     ```

4. **SYNC_RESPONSE**
   - Purpose: Send current session state
   - Payload:
     ```typescript
     {
       content: string;
       language: string;
       users: User[];
     }
     ```

5. **CONTENT_CHANGE**
   - Purpose: Receive content changes from other users
   - Payload:
     ```typescript
     {
       content: string;
       user: User;
     }
     ```

6. **LANGUAGE_CHANGE**
   - Purpose: Receive language changes from other users
   - Payload:
     ```typescript
     {
       language: string;
       user: User;
     }
     ```

7. **CURSOR_MOVE**
   - Purpose: Receive cursor updates from other users
   - Payload:
     ```typescript
     {
       position: {
         top: number;
         left: number;
       };
       user: User;
     }
     ```

8. **SELECTION_CHANGE**
   - Purpose: Receive selection updates from other users
   - Payload:
     ```typescript
     {
       selection: {
         start: number;
         end: number;
       };
       user: User;
     }
     ```

9. **TYPING_STATUS**
   - Purpose: Receive typing status from other users
   - Payload:
     ```typescript
     {
       isTyping: boolean;
       user: User;
     }
     ```

## Session Management

### Session Creation
- Sessions are created automatically when the first user joins
- Session IDs must be alphanumeric
- Sessions expire after 4 hours of inactivity
- Maximum 5 users per session

### Session Validation
- Session IDs are validated using regex: `/^[a-zA-Z0-9]+$/`
- Invalid session IDs will result in connection rejection
- Session links are validated for proper URL format

### Rate Limiting
- JOIN events: 5 attempts per minute
- Content changes: 10 requests per 5 minutes
- Cursor moves: 10 requests per 5 minutes

### User Management
- Users are automatically assigned a random color
- Users can join in read-only mode when session is full
- Users are removed from session on disconnect

## Usage Examples

### Connecting to a Session
```typescript
const socket = io('ws://server/api/ws', {
  query: {
    sessionId: 'abc123',
    username: 'user1'
  }
});
```

### Joining a Session
```typescript
socket.emit('JOIN', { username: 'user1' });
```

### Sending Content Changes
```typescript
socket.emit('CONTENT_CHANGE', { content: 'new content' });
```

### Handling User Events
```typescript
socket.on('USER_JOINED', ({ user }) => {
  console.log(`${user.username} joined the session`);
});

socket.on('USER_LEFT', ({ user }) => {
  console.log(`${user.username} left the session`);
});
```

### Error Handling
```typescript
socket.on('ERROR', ({ type, message }) => {
  console.error(`Socket error: ${type} - ${message}`);
});
``` 