# Rich Message Parts Implementation Analysis

## Architecture Clarification

**Frontend:** Next.js with Vercel AI SDK (`@ai-sdk/react` - `useChat` hook)
**Backend API:** Next.js API route (`/api/chat/route.ts`) - proxies SSE from Python
**Python Service:** LiteLLM with OpenRouter free models (`openrouter/openrouter/owl-alpha`)

The Vercel AI SDK is **only on the frontend** for the `useChat` hook and streaming UI.
The actual LLM calls happen in Python using **LiteLLM**, not Vercel AI SDK.

## Current Status: ⚠️ Partially Implemented (Not Working)

---

## 🔴 CRITICAL ISSUES

### Issue #1: Message Parts Type Mismatch
**Problem:** Your custom message part types (`citation`, `emergency-alert`, `program-card`, etc.) don't match Vercel AI SDK's expected message part types.

**Vercel AI SDK expects:**
- `text` - for text content
- `tool-${string}` - for tool calls
- `data-${string}` - for **custom structured data** ← **THIS IS KEY!**
- `file`, `source-url`, `source-document`, etc.

**You're trying to use:**
- `citation`
- `emergency-alert`
- `program-card`
- `action-buttons`
- `next-steps`

**Why it fails:** TypeScript errors because these types don't exist in the AI SDK's type system.

**The Solution:** Use the `data-*` prefix pattern for custom data parts:
- `data-citation` instead of `citation`
- `data-emergency` instead of `emergency-alert`
- `data-program` instead of `program-card`
- `data-actions` instead of `action-buttons`
- `data-steps` instead of `next-steps`

---

### Issue #2: Backend Not Sending Custom Data Parts
**Problem:** Your backend (`/api/chat/route.ts`) only forwards text tokens from the Python service. It doesn't emit custom data parts that the frontend can render as cards.

**Current backend behavior:**
```typescript
// Only handles these events from Python:
if (data.type === 'token') {
  writer.write({ type: 'text-delta', delta: data.data });
}
else if (data.type === 'metadata') {
  writer.write({ type: 'message-metadata', ... });
}
```

**What's missing:**
- No `data-citation` parts emitted
- No `data-program` parts emitted
- No `data-emergency` parts emitted
- No `data-actions` parts emitted

**Result:** Even if you fix the types, nothing will render because the backend isn't sending the data!

---

### Issue #3: Python Service Doesn't Structure Output
**Problem:** The Python AI service likely returns plain text or minimal metadata, not structured data for rich UI components.

**Current Python output:**
```json
{"type": "token", "data": "Anda memenuhi syarat..."}
{"type": "metadata", "citations": [...], "sources": [...]}
{"type": "done"}
```

**What you need:**
```json
{"type": "token", "data": "Anda memenuhi syarat..."}
{"type": "data-program", "data": {"id": "pkh", "name": "PKH", ...}}
{"type": "data-citation", "data": {"citations": [...]}}
{"type": "data-emergency", "data": {"isEmergency": true, ...}}
{"type": "done"}
```

---

## 📋 DETAILED ANALYSIS

### Component Architecture (✅ Well Designed)
Your component structure is **excellent**:
- ✅ Separate renderer components for each part type
- ✅ Type-safe with TypeScript interfaces
- ✅ Clean separation of concerns
- ✅ Good UI/UX with Lucide icons and Shadcn components

**The renderers themselves are ready to use!** The problem is just getting the data to them.

---

### Message Flow Architecture (❌ Broken)

#### Current Flow:
```
User Input
  ↓
Frontend (useChat)
  ↓
Next.js API Route (/api/chat/route.ts)
  ↓
Python AI Service (/chat endpoint)
  ↓
Returns: SSE stream with tokens + minimal metadata
  ↓
Next.js API Route: Converts to text-delta only
  ↓
Frontend: Receives only text messages
  ↓
Renderers: Never called (no custom data parts)
```

#### Target Flow:
```
User Input
  ↓
Frontend (useChat)
  ↓
Next.js API Route (/api/chat/route.ts)
  ↓
Python AI Service (/chat endpoint)
  ↓
Returns: SSE stream with tokens + structured data parts
  ↓
Next.js API Route: Converts to text-delta + data-* parts
  ↓
Frontend: Receives messages with custom data parts
  ↓
Renderers: Display rich UI components
```

---

## 🎯 RECOMMENDED IMPLEMENTATION PATH

### Phase 1: Fix Frontend Types (1 hour)
**Goal:** Make TypeScript happy by using Vercel AI SDK's `data-*` pattern

**Changes needed:**

#### 1.1 Update `llm-response.ts` types
```typescript
// Change from custom types to data-* pattern
export type MessagePartType = 
  | 'text'
  | 'data-citation'      // ← Changed from 'citation'
  | 'data-program'       // ← Changed from 'program-card'
  | 'data-actions'       // ← Changed from 'action-buttons'
  | 'data-emergency'     // ← Changed from 'emergency-alert'
  | 'data-steps';        // ← Changed from 'next-steps'

// Update each interface:
export interface CitationPart extends BaseMessagePart {
  type: 'data-citation';  // ← Changed
  data: {                 // ← Wrap in 'data' property
    citations: RegulationCitation[];
  };
}

export interface ProgramCardPart extends BaseMessagePart {
  type: 'data-program';   // ← Changed
  data: {                 // ← Wrap in 'data' property
    program: SocialProgram;
  };
}

// ... same pattern for all other parts
```

#### 1.2 Update `unified-chat-interface.tsx`
```typescript
// Change the switch cases to match data-* types
{message.parts.map((part, index) => {
  switch (part.type) {
    case 'text':
      return <div key={index}>...</div>;
    
    case 'data-citation':  // ← Changed
      return <CitationRenderer key={index} {...part.data} />;
    
    case 'data-emergency': // ← Changed
      return <EmergencyAlertRenderer key={index} {...part.data} />;
    
    case 'data-actions':   // ← Changed
      return <ActionButtonsRenderer key={index} {...part.data} />;
    
    case 'data-program':   // ← Changed
      return <ProgramCardRenderer key={index} {...part.data} />;
    
    case 'data-steps':     // ← Changed
      return <NextStepsRenderer key={index} {...part.data} />;
    
    default:
      return null;
  }
})}
```

#### 1.3 Remove `initialMessages` prop error
```typescript
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
  }),
  // Remove initialMessages: [],  ← This prop doesn't exist
});
```

---

### Phase 2: Update Backend to Emit Custom Data Parts (2-3 hours)
**Goal:** Make Next.js API route emit `data-*` parts from Python metadata

#### 2.1 Update `/api/chat/route.ts` SSE handler

**Current code:**
```typescript
if (data.type === 'metadata') {
  writer.write({
    type: 'message-metadata',
    messageMetadata: { ... },
  });
}
```

**New code:**
```typescript
if (data.type === 'metadata') {
  const metadata = data;
  
  // Emit citation part if citations exist
  if (metadata.citations?.length > 0) {
    writer.write({
      type: 'data-citation',
      data: {
        citations: metadata.citations,
      },
    });
  }
  
  // Emit emergency part if emergency detected
  if (metadata.emergency) {
    writer.write({
      type: 'data-emergency',
      data: {
        emergency: metadata.emergency,
        immediateSteps: metadata.immediateSteps || [],
        contacts: metadata.emergencyContacts || [],
      },
    });
  }
  
  // Emit program parts if programs found
  if (metadata.programs?.length > 0) {
    for (const program of metadata.programs) {
      writer.write({
        type: 'data-program',
        data: { program },
      });
    }
  }
  
  // Emit action buttons if available
  if (metadata.actions?.length > 0) {
    writer.write({
      type: 'data-actions',
      data: { actions: metadata.actions },
    });
  }
  
  // Emit next steps if available
  if (metadata.nextSteps?.length > 0) {
    writer.write({
      type: 'data-steps',
      data: { steps: metadata.nextSteps },
    });
  }
}
```

---

### Phase 3: Update Python Service (3-4 hours)
**Goal:** Make Python AI service return structured data in SSE stream

**Note:** Your Python service uses **LiteLLM** with OpenRouter models, not Vercel AI SDK.
The LiteLLM streaming returns plain text tokens. You need to **parse the LLM output**
and emit structured data parts alongside the text.

#### 3.1 Current Python flow (orchestrator.py):

```python
# Current: Only streams text tokens
token_stream = llm.generate_stream(...)  # LiteLLM streaming
for token in token_stream:
    yield {"type": "token", "data": token}
yield {"type": "done"}

#### 3.2 Target Python flow - emit structured parts:

```python
# In orchestrator.py or api/chat.py
async def process_chat(message: str, conversation: list):
    # Run RAG search FIRST (before LLM)
    rag_results = search_rag(message)
    
    # Emit program cards from RAG immediately
    if rag_results:
        for result in rag_results:
            metadata = result.get('metadata', {})
            if metadata.get('record_type') == 'program':
                yield {
                    "type": "data-program",
                    "data": {
                        "program": {
                            "id": metadata.get('record_id'),
                            "name": metadata.get('name'),
                            "description": result.get('text', ''),
                            "benefits": metadata.get('benefits', ''),
                            "regulations": [metadata.get('legal_basis', '')],
                        }
                    }
                }
    
    # Then stream LLM tokens
    token_stream = llm.generate_stream(...)
    for token in token_stream:
        yield {"type": "token", "data": token}
    
    # After LLM completes, emit metadata parts
    
    # 1. Emit citations
    if citations:
        yield {
            "type": "data-citation",
            "data": {
                "citations": citations
            }
        }
    
    # 2. Emit emergency detection
    if escalation['detected']:
        yield {
            "type": "data-emergency",
            "data": {
                "emergency": {
                    "isEmergency": True,
                    "type": "medical",  # or financial, violence, disaster
                    "keywords": escalation['keywords'],
                },
                "immediateSteps": [
                    "Hubungi layanan darurat segera",
                    "Catat nomor ini: 119"
                ],
                "contacts": escalation['hotlines'],
            }
        }
    
    # 3. Emit action buttons
    yield {
        "type": "data-actions",
        "data": {
            "actions": [
                {
                    "type": "marketplace",
                    "label": "Lihat Semua Program",
                    "href": "/marketplace"
                }
            ]
        }
    }
    
    # 4. Emit next steps
    yield {
        "type": "data-steps",
        "data": {
            "steps": [
                "Siapkan KTP dan Kartu Keluarga",
                "Datang ke Dinas Sosial terdekat",
                "Isi formulir pendaftaran"
            ]
        }
    }
    
    yield {"type": "done"}
```

---

## 🚀 QUICK WIN: Test with Mock Data (30 minutes)

Before changing the Python service, test the frontend with mock data:

#### Create `src/app/api/chat-mock/route.ts`:
```typescript
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export async function POST() {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      
      // Start text
      writer.write({ type: 'text-start', id: messageId });
      
      // Write text
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: 'Berdasarkan situasi Anda, anda memenuhi syarat untuk program berikut:\n\n',
      });
      
      // Emit program card
      writer.write({
        type: 'data-program',
        data: {
          program: {
            id: 'pkh',
            name: 'Program Keluarga Harapan (PKH)',
            description: 'Bantuan tunai bersyarat untuk keluarga miskin',
            benefits: 'Rp 3.000.000/tahun per keluarga',
            regulations: ['Permensos No. 1/2024, Pasal 5'],
          },
        },
      });
      
      // Emit citation
      writer.write({
        type: 'data-citation',
        data: {
          citations: [
            {
              regulation: 'Permensos No. 1/2024',
              article: 'Pasal 5',
              fullCitation: 'Permensos No. 1/2024, Pasal 5',
            },
          ],
        },
      });
      
      // Emit actions
      writer.write({
        type: 'data-actions',
        data: {
          actions: [
            {
              type: 'marketplace',
              label: 'Lihat di Marketplace',
              href: '/marketplace',
            },
          ],
        },
      });
      
      // End text
      writer.write({ type: 'text-end', id: messageId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
```

Then temporarily change the frontend to use `/api/chat-mock` instead of `/api/chat`.

---

## 📊 IMPLEMENTATION PRIORITY

### Priority 1 (Do First): Frontend Type Fixes
- ⏱️ Time: 1 hour
- 🎯 Goal: Remove TypeScript errors
- 📝 Files: `llm-response.ts`, `unified-chat-interface.tsx`
- ✅ **Benefit: Can then test with mock data**

### Priority 2 (Test ASAP): Mock API Endpoint
- ⏱️ Time: 30 minutes
- 🎯 Goal: Verify renderers work
- 📝 Files: Create `chat-mock/route.ts`
- ✅ **Benefit: Confirm UI components are correct before touching backend**

### Priority 3 (After Mock Works): Real Backend Updates
- ⏱️ Time: 2-3 hours
- 🎯 Goal: Emit data-* parts from Python metadata
- 📝 Files: `api/chat/route.ts`
- ✅ **Benefit: Real citations/metadata will display**

### Priority 4 (Final Step): Python Service Enhancement
- ⏱️ Time: 3-4 hours
- 🎯 Goal: Structure LLM output for rich UI
- 📝 Files: Python `orchestrator.py`, tool modules
- ✅ **Benefit: Full rich experience with programs, emergency detection, etc.**

---

## 🎨 UI/UX RECOMMENDATIONS

### Current Strengths:
✅ Clean card design with Shadcn components
✅ Emergency alerts are visually distinct
✅ Action buttons are clear CTAs
✅ Good use of icons (Lucide)

### Suggested Improvements:

#### 1. **Progressive Enhancement**
- Show skeleton loaders while cards are "loading"
- Animate cards in with stagger effect
- Use `data-loading` parts to show "Searching programs..." before `data-program`

#### 2. **Better Emergency UX**
```typescript
// Add sound/vibration for emergency
if (part.type === 'data-emergency') {
  // Play alert sound
  new Audio('/alert.mp3').play();
  // Vibrate mobile device
  navigator.vibrate?.(200);
}
```

#### 3. **Collapsible Citations**
```typescript
// Citations collapsed by default, expand on click
const [showCitations, setShowCitations] = useState(false);
<button onClick={() => setShowCitations(!showCitations)}>
  📜 Lihat {citations.length} Dasar Hukum
</button>
```

#### 4. **PDF Generation for Templates**
```typescript
// In ActionButtonsRenderer
<Button onClick={() => generatePDF(template)}>
  📄 Download Template PDF
</Button>
```

---

## 🧪 TESTING STRATEGY

### 1. Unit Tests for Renderers
```typescript
// Test each renderer component
describe('ProgramCardRenderer', () => {
  it('renders program details', () => {
    const program = { id: 'pkh', name: 'PKH', ... };
    render(<ProgramCardRenderer program={program} />);
    expect(screen.getByText('PKH')).toBeInTheDocument();
  });
});
```

### 2. Integration Test with Mock Stream
```typescript
// Test full message flow with mock data
it('displays rich message parts', async () => {
  render(<UnifiedChatInterface />);
  // Send message
  // Wait for stream
  // Assert program cards, citations, etc. appear
});
```

### 3. E2E Test with Real Backend
```typescript
// Test with real Python service
it('handles real AI response', async () => {
  // Send actual user query
  // Verify RAG search happens
  // Verify program recommendations appear
});
```

---

## 📚 REFERENCES

### Vercel AI SDK Documentation
- [Streaming Data](https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-data)
- [Custom Data Parts](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol#custom-data-parts)
- [useChat API](https://sdk.vercel.ai/docs/reference/ai-sdk-ui/use-chat)

### Key Patterns
- Use `data-${string}` for custom structured data
- Use `onData` callback for transient parts (loading states)
- Use `message.parts` for persistent data (saved in history)
- Use `writer.write()` in backend to emit custom parts

---

## 🔧 NEXT ACTIONS FOR YOU

1. **Fix TypeScript errors** (1 hour)
   - Update types to use `data-*` prefix
   - Update switch cases in unified-chat-interface.tsx
   - Remove `initialMessages` prop

2. **Create mock API** (30 min)
   - Copy the mock route code above
   - Test that cards render correctly

3. **Send me a screenshot** 📸
   - Show the working mock UI
   - I'll help with next steps

4. **After mock works, we'll tackle:**
   - Backend SSE transformation
   - Python service structuring
   - RAG-to-card pipeline

---

## 💡 KEY INSIGHTS

1. **Your component architecture is solid!** The renderers are well-designed. The issue is purely in the data flow.

2. **Vercel AI SDK is flexible** but you must use its conventions (`data-*` prefix).

3. **Backend is the missing link** - it needs to transform Python metadata into AI SDK data parts.

4. **Python service needs minimal changes** - just structure the metadata better.

5. **Test incrementally** - mock data first, then real backend, then Python enhancements.

---

**Ready to start with Phase 1? Let me know if you want me to write the code for the type fixes!**
