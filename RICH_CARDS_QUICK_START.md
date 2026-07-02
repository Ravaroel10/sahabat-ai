# Rich Message Cards - Quick Start Guide

## 🎯 Goal
Display program cards, citations, emergency alerts, and action buttons in the chat interface.

---

## ❌ Current Problem

Your frontend expects custom part types that don't exist in Vercel AI SDK:
```typescript
// ❌ These types don't exist in AI SDK
'citation'
'emergency-alert'
'program-card'
'action-buttons'
'next-steps'
```

**Result:** TypeScript errors + nothing renders

---

## ✅ Solution

Use Vercel AI SDK's `data-*` pattern for custom data:
```typescript
// ✅ These work with AI SDK
'data-citation'
'data-emergency'
'data-program'
'data-actions'
'data-steps'
```

---

## 🔧 3-Step Fix

### Step 1: Fix Frontend Types (20 min)

**File:** `src/types/llm-response.ts`

**Change from:**
```typescript
export type MessagePartType = 
  | 'text'
  | 'citation'           // ❌
  | 'program-card'       // ❌
  | 'action-buttons'     // ❌
  | 'emergency-alert'    // ❌
  | 'next-steps';        // ❌
```

**Change to:**
```typescript
export type MessagePartType = 
  | 'text'
  | 'data-citation'      // ✅
  | 'data-program'       // ✅
  | 'data-actions'       // ✅
  | 'data-emergency'     // ✅
  | 'data-steps';        // ✅
```

**Also wrap data in a `data` property:**
```typescript
export interface CitationPart {
  type: 'data-citation';  // ✅
  data: {                 // ✅ Add this wrapper
    citations: RegulationCitation[];
  };
}

export interface ProgramCardPart {
  type: 'data-program';   // ✅
  data: {                 // ✅ Add this wrapper
    program: SocialProgram;
  };
}

// Same pattern for all other parts...
```

---

### Step 2: Update Component (10 min)

**File:** `src/components/unified-chat/unified-chat-interface.tsx`

**Change from:**
```typescript
case 'citation':               // ❌
  return <CitationRenderer key={index} {...part} />;
```

**Change to:**
```typescript
case 'data-citation':          // ✅
  return <CitationRenderer key={index} {...part.data} />;
  //                                           ^^^^^ Add .data
```

**Full switch statement:**
```typescript
{message.parts.map((part, index) => {
  switch (part.type) {
    case 'text':
      return <div key={index}>...</div>;
    
    case 'data-citation':   // ✅
      return <CitationRenderer key={index} {...part.data} />;
    
    case 'data-emergency':  // ✅
      return <EmergencyAlertRenderer key={index} {...part.data} />;
    
    case 'data-actions':    // ✅
      return <ActionButtonsRenderer key={index} {...part.data} />;
    
    case 'data-program':    // ✅
      return <ProgramCardRenderer key={index} {...part.data} />;
    
    case 'data-steps':      // ✅
      return <NextStepsRenderer key={index} {...part.data} />;
    
    default:
      return null;
  }
})}
```

**Also remove the `initialMessages` prop:**
```typescript
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat',
  }),
  // ❌ Remove this line - it doesn't exist in AI SDK:
  // initialMessages: [],
});
```

---

### Step 3: Test with Mock Data (15 min)

**Create:** `src/app/api/chat-mock/route.ts`

```typescript
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai';

export async function POST() {
  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      const messageId = crypto.randomUUID();
      
      // Start message
      writer.write({ type: 'text-start', id: messageId });
      
      // Write some text
      writer.write({
        type: 'text-delta',
        id: messageId,
        delta: 'Berdasarkan situasi Anda, berikut program yang cocok:\n\n',
      });
      
      // Emit a program card ✨
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
      
      // Emit a citation ✨
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
      
      // Emit action buttons ✨
      writer.write({
        type: 'data-actions',
        data: {
          actions: [
            {
              type: 'marketplace',
              label: '📋 Lihat di Marketplace',
              href: '/marketplace',
            },
            {
              type: 'external',
              label: '🌐 Kunjungi Website Kemensos',
              href: 'https://kemensos.go.id',
            },
          ],
        },
      });
      
      // Emit next steps ✨
      writer.write({
        type: 'data-steps',
        data: {
          steps: [
            'Siapkan KTP dan Kartu Keluarga (KK)',
            'Datang ke Dinas Sosial terdekat',
            'Isi formulir pendaftaran',
            'Tunggu verifikasi 7-14 hari kerja',
          ],
        },
      });
      
      // End message
      writer.write({ type: 'text-end', id: messageId });
      writer.write({ type: 'finish', finishReason: 'stop' });
    },
  });
  
  return createUIMessageStreamResponse({ stream });
}
```

**Temporarily change frontend to use mock:**
```typescript
const { messages, sendMessage, status, error } = useChat({
  transport: new DefaultChatTransport({
    api: '/api/chat-mock',  // ← Use mock endpoint
  }),
});
```

---

## 🎉 Expected Result

After these 3 steps, you should see:

1. **Text message** with "Berdasarkan situasi Anda..."
2. **Program card** with PKH information in a colored card
3. **Citation** showing "📜 Dasar Hukum: Permensos No. 1/2024, Pasal 5"
4. **Action buttons** with "📋 Lihat di Marketplace" and "🌐 Kunjungi Website"
5. **Next steps** checklist with 4 steps

---

## 🐛 Troubleshooting

### "Type errors still showing"
- Make sure you updated **both** the type definitions AND the component
- Restart TypeScript server: Cmd+Shift+P → "TypeScript: Restart TS Server"

### "Cards not showing"
- Check browser console for errors
- Verify the mock API is returning data (Network tab)
- Add `console.log(message.parts)` to see what's being received

### "Mock endpoint not found"
- Make sure you created the file at `src/app/api/chat-mock/route.ts`
- Restart the Next.js dev server

---

## 🚀 After Mock Works

Once you see the cards rendering correctly:

1. **Update real backend** (`api/chat/route.ts`)
   - Transform Python metadata into `data-*` parts
   - I'll help you with this!

2. **Update Python service** (optional, for richer data)
   - Return structured program data from RAG
   - Return emergency detection results
   - Return action suggestions

3. **Polish UX**
   - Add animations
   - Add loading skeletons
   - Add error states

---

## 📸 Send Me a Screenshot!

Once you get the mock working, send me a screenshot of:
- The chat interface
- A program card rendered
- Citations showing
- Action buttons visible

Then we'll move to the next phase: making it work with real backend data!

---

## 🔗 Quick Links

- [Full Analysis Document](./RICH_MESSAGE_PARTS_ANALYSIS.md)
- [Vercel AI SDK - Streaming Data](https://sdk.vercel.ai/docs/ai-sdk-ui/streaming-data)
- [Vercel AI SDK - Stream Protocol](https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol)

---

**Let's get those cards rendering! 🎨**
