# Task 11: Add Real-time Availability Updates with SSE

**Status:** ⏳ PENDING  
**Priority:** Low  
**Dependencies:** Tasks 04, 06, 07 (Core functionality)  

## Description
Implement Server-Sent Events (SSE) to provide real-time availability updates when games are checked out or returned, as specified in SPEC.md.

## Requirements from SPEC.md
- Server-Sent Events (SSE) for real-time availability updates
- Send HTML fragments for HTMX to swap into availability indicators
- Trigger HTMX requests to refresh specific game cards when status changes
- HTMX Polling as fallback for real-time updates

## User Stories
- **As a customer**, I want to see immediately when games become available
- **As a customer**, I want real-time updates without refreshing the page
- **As staff**, I want customers to see availability changes instantly

## Technical Implementation
### SSE Endpoint
```typescript
// SSE route for real-time updates
app.get('/events/availability', async (c) => {
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection
      controller.enqueue(`data: {"type": "connected"}\n\n`)
      
      // Set up periodic heartbeat
      const heartbeat = setInterval(() => {
        controller.enqueue(`data: {"type": "heartbeat"}\n\n`)
      }, 30000)
      
      // Store controller for game updates
      c.env.SSE_CONNECTIONS.add(controller)
      
      // Cleanup on close
      c.req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        c.env.SSE_CONNECTIONS.delete(controller)
        controller.close()
      })
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
})
```

### Broadcasting Updates
```typescript
// Broadcast availability change to all connected clients
function broadcastAvailabilityUpdate(gameId: string, status: 'available' | 'checked_out') {
  const updateMessage = {
    type: 'availability_change',
    gameId: gameId,
    status: status,
    timestamp: new Date().toISOString()
  }
  
  const data = `data: ${JSON.stringify(updateMessage)}\n\n`
  
  // Send to all connected SSE clients
  for (const controller of sseConnections) {
    try {
      controller.enqueue(data)
    } catch (error) {
      // Remove dead connections
      sseConnections.delete(controller)
    }
  }
}

// Call this from checkout/return functions
async function updateGameAvailability(gameId: string, status: string) {
  // Update database
  await db.update(gameCopies)
    .set({ status: status })
    .where(eq(gameCopies.gameId, gameId))
  
  // Broadcast real-time update
  broadcastAvailabilityUpdate(gameId, status)
}
```

### HTMX Integration
```html
<!-- Set up SSE connection in main page -->
<div hx-ext="sse" sse-connect="/events/availability">
  <div id="games-container" 
       hx-get="/partials/games" 
       hx-trigger="load, sse:availability_change">
    <!-- Games will be loaded here -->
  </div>
</div>

<!-- Individual game card with SSE updates -->
<div class="game-card" 
     id="game-{id}"
     hx-trigger="sse:availability_change[detail.gameId=='{id}'] from:body"
     hx-get="/partials/game-card/{id}"
     hx-swap="outerHTML">
  <!-- Game card content -->
</div>
```

### Fallback Polling
```html
<!-- HTMX polling as backup for SSE -->
<div id="games-container"
     hx-get="/partials/games"
     hx-trigger="load, every 30s"
     hx-headers='{"X-Requested-With": "XMLHttpRequest"}'>
  <!-- Will refresh every 30 seconds if SSE fails -->
</div>
```

## Connection Management
```typescript
// Store SSE connections (could use Durable Objects for multi-instance)
class SSEConnectionManager {
  private connections = new Set<ReadableStreamDefaultController>()
  
  addConnection(controller: ReadableStreamDefaultController) {
    this.connections.add(controller)
  }
  
  removeConnection(controller: ReadableStreamDefaultController) {
    this.connections.delete(controller)
  }
  
  broadcast(message: any) {
    const data = `data: ${JSON.stringify(message)}\n\n`
    
    for (const controller of this.connections) {
      try {
        controller.enqueue(data)
      } catch (error) {
        this.connections.delete(controller)
      }
    }
  }
  
  getConnectionCount(): number {
    return this.connections.size
  }
}
```

## Event Types
```typescript
interface AvailabilityUpdateEvent {
  type: 'availability_change'
  gameId: string
  status: 'available' | 'checked_out'
  availableCount: number
  timestamp: string
}

interface HeartbeatEvent {
  type: 'heartbeat'
  timestamp: string
  connectionCount: number
}

interface SystemEvent {
  type: 'system_update'
  message: string
  level: 'info' | 'warning' | 'error'
}
```

## Client-side JavaScript (Optional Enhancement)
```javascript
// Enhanced SSE handling with reconnection
class GameUpdatesSSE {
  constructor() {
    this.eventSource = null
    this.reconnectDelay = 1000
    this.maxReconnectDelay = 30000
  }
  
  connect() {
    this.eventSource = new EventSource('/events/availability')
    
    this.eventSource.onopen = () => {
      console.log('SSE connected')
      this.reconnectDelay = 1000
    }
    
    this.eventSource.onerror = () => {
      console.log('SSE error, reconnecting...')
      this.reconnect()
    }
    
    this.eventSource.addEventListener('availability_change', (event) => {
      const data = JSON.parse(event.data)
      this.updateGameCard(data.gameId, data.status)
    })
  }
  
  reconnect() {
    setTimeout(() => {
      this.connect()
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay)
    }, this.reconnectDelay)
  }
  
  updateGameCard(gameId, status) {
    const card = document.getElementById(`game-${gameId}`)
    if (card) {
      htmx.trigger(card, 'sse:availability_change', { gameId })
    }
  }
}
```

## Files to Create/Modify
- `src/index.ts` - Add SSE endpoint
- `src/lib/sse.ts` - SSE connection management
- `src/lib/checkout.ts` - Add broadcasting to checkout/return
- Update game browsing templates with SSE attributes

## Performance Considerations
- Limit number of concurrent SSE connections
- Use connection pooling for database updates
- Implement proper cleanup for dead connections
- Consider using Durable Objects for multi-instance deployments

## Acceptance Criteria
- [ ] SSE connection established from game browsing page
- [ ] Real-time updates when games are checked out
- [ ] Real-time updates when games are returned
- [ ] Fallback to polling if SSE fails
- [ ] Connection management with proper cleanup
- [ ] Multiple clients receive updates simultaneously
- [ ] Performance remains good with many connections

## Browser Compatibility
- SSE supported in all modern browsers
- Graceful fallback to polling for older browsers
- Connection retry logic for network issues

## Future Enhancements
- Push notifications for staff when games are overdue
- Real-time analytics updates
- System status updates
- Multi-location synchronization