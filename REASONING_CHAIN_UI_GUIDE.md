# Adding Reasoning Chain UI

## Overview

Yes! It's absolutely possible to show the reasoning chain in the UI. The backend already sends metadata about:
- **Citations** (from RAG)
- **Sources** (from web search)
- **Emergency** status

You can enhance this to show the complete reasoning chain: "Searching RAG → Found 3 documents → Using OpenRouter" or "RAG empty → Searching web → Found 2 results"

## Current Architecture

### Backend Already Sends Metadata

The Python service sends this via SSE:

```python
# In orchestrator/orchestrator.py
return token_stream, citations, sources, emergency

# In api/chat.py
metadata = {
    "type": "metadata",
    "citations": citations,      # List of RAG citations
    "sources": sources,          # List of web search results
    "emergency": emergency,      # Boolean
    "final_answer": final_answer
}
```

### Frontend Already Receives It

The Next.js route handler (`src/app/api/chat/route.ts`) receives and forwards it:

```typescript
if (data.type === 'metadata') {
  writer.write({
    type: 'message-metadata',
    messageMetadata: {
      citations: data.citations || [],
      sources: data.sources || [],
      emergency: data.emergency || false,
    },
  });
}
```

## Implementation Plan

### Step 1: Enhance Backend Metadata

**Modify `ai-service/orchestrator/orchestrator.py`** to include reasoning steps:

```python
def orchestrate_chat(...):
    # ... existing code ...
    
    reasoning_chain = {
        "steps": [],  # Will be populated as we go
        "totalTime": 0,
        "used": None  # "rag" or "web"
    }
    
    start_time = time.time()
    
    # Step 2: RAG retrieval
    reasoning_chain["steps"].append({
        "name": "Escalation Detection",
        "status": "complete",
        "time": escalation_time
    })
    
    rag_results = search_rag(message)
    if rag_results:
        reasoning_chain["steps"].append({
            "name": "RAG Search",
            "status": "success",
            "count": len(rag_results),
            "time": rag_time
        })
        reasoning_chain["used"] = "rag"
    else:
        reasoning_chain["steps"].append({
            "name": "RAG Search",
            "status": "empty",
            "time": rag_time
        })
        
        # Web search fallback
        web_results = search_official_web(message)
        if web_results:
            reasoning_chain["steps"].append({
                "name": "Web Search",
                "status": "success",
                "count": len(web_results),
                "time": web_time
            })
            reasoning_chain["used"] = "web"
    
    # Add LLM step
    reasoning_chain["steps"].append({
        "name": "LLM Generation",
        "model": settings.LLM_MODEL,
        "status": "started"
    })
    
    reasoning_chain["totalTime"] = time.time() - start_time
    
    return token_stream, citations, sources, emergency, reasoning_chain
```

**Update `api/chat.py`** to include reasoning_chain in metadata:

```python
token_stream, citations, sources, emergency, reasoning_chain = orchestrate_chat(...)

metadata = {
    "type": "metadata",
    "citations": citations,
    "sources": sources,
    "emergency": emergency,
    "reasoning_chain": reasoning_chain,  # NEW
    "final_answer": final_answer,
}
```

### Step 2: Update Frontend Types

**Add to `src/types/llm-response.ts`:**

```typescript
export interface ReasoningStep {
  name: string;
  status: 'started' | 'success' | 'empty' | 'error' | 'complete';
  count?: number;  // Number of results
  time?: number;   // Time taken in seconds
  model?: string;  // For LLM step
}

export interface ReasoningChain {
  steps: ReasoningStep[];
  totalTime: number;
  used: 'rag' | 'web' | null;
}

// Update LLMResponse interface
export interface LLMResponse {
  // ... existing fields ...
  reasoningChain?: ReasoningChain;  // NEW
}
```

### Step 3: Create Reasoning Chain Component

**Create `src/components/unified-chat/reasoning-chain.tsx`:**

```typescript
'use client';

import { CheckCircle, Search, Globe, Brain, Clock, Database, AlertCircle } from 'lucide-react';
import type { ReasoningChain } from '@/types/llm-response';

interface ReasoningChainProps {
  chain: ReasoningChain;
}

export function ReasoningChainRenderer({ chain }: ReasoningChainProps) {
  if (!chain || chain.steps.length === 0) return null;

  const getStepIcon = (name: string, status: string) => {
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-destructive" />;
    if (status === 'started') return <Clock className="h-4 w-4 text-muted-foreground animate-spin" />;
    
    switch (name) {
      case 'Escalation Detection':
        return <AlertCircle className="h-4 w-4 text-green-500" />;
      case 'RAG Search':
        return <Database className="h-4 w-4 text-blue-500" />;
      case 'Web Search':
        return <Globe className="h-4 w-4 text-purple-500" />;
      case 'LLM Generation':
        return <Brain className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">✓ Success</span>;
      case 'empty':
        return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">○ Empty</span>;
      case 'error':
        return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">✗ Error</span>;
      case 'started':
        return <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">⋯ Running</span>;
      default:
        return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">✓ Done</span>;
    }
  };

  return (
    <div className="my-3 p-3 bg-muted/50 rounded-lg border border-border/50 text-sm">
      <div className="flex items-center gap-2 mb-3 text-muted-foreground">
        <Search className="h-4 w-4" />
        <span className="font-medium">Reasoning Chain</span>
        <span className="ml-auto text-xs">{chain.totalTime.toFixed(2)}s total</span>
      </div>

      <div className="space-y-2">
        {chain.steps.map((step, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {getStepIcon(step.name, step.status)}
            <span className="flex-1">{step.name}</span>
            {step.count !== undefined && (
              <span className="text-muted-foreground">{step.count} results</span>
            )}
            {step.time !== undefined && (
              <span className="text-muted-foreground">{step.time.toFixed(2)}s</span>
            )}
            {step.model && (
              <span className="text-muted-foreground text-[10px]">{step.model}</span>
            )}
            {getStatusBadge(step.status)}
          </div>
        ))}
      </div>

      {chain.used && (
        <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
          <span className="font-medium">Knowledge Source:</span>{' '}
          {chain.used === 'rag' ? '📚 Internal Knowledge Base' : '🌐 Official Web Search'}
        </div>
      )}
    </div>
  );
}
```

### Step 4: Add to Message Parts

**Update `src/components/unified-chat/message-parts.tsx`:**

```typescript
// Add import
export { ReasoningChainRenderer } from './reasoning-chain';

// Export the type
export type { ReasoningChain } from '@/types/llm-response';
```

### Step 5: Integrate into Chat Interface

**Update `src/components/unified-chat/unified-chat-interface.tsx`:**

```typescript
import {
  CitationRenderer,
  EmergencyAlertRenderer,
  ActionButtonsRenderer,
  ProgramCardRenderer,
  NextStepsRenderer,
  ReasoningChainRenderer,  // NEW
} from './message-parts';

// In the message rendering section:
{message.role === 'assistant' && (
  <>
    {/* Show reasoning chain first, if available */}
    {message.reasoningChain && (
      <ReasoningChainRenderer chain={message.reasoningChain} />
    )}
    
    {/* Then show the actual response */}
    {message.content}
    
    {/* Followed by citations, emergency alerts, etc. */}
    {message.citations && <CitationRenderer citations={message.citations} />}
    {message.emergency && <EmergencyAlertRenderer {...message.emergency} />}
  </>
)}
```

## Visual Examples

### When RAG is Used:
```
┌─────────────────────────────────────┐
│ 🔍 Reasoning Chain        2.15s     │
├─────────────────────────────────────┤
│ ⚠️  Escalation Detection     ✓ Done │
│     0.00s                            │
│ 💾 RAG Search            ✓ Success  │
│     3 results | 0.15s               │
│ 🧠 LLM Generation        ✓ Success  │
│     owl-alpha | 2.00s               │
├─────────────────────────────────────┤
│ Knowledge Source: 📚 Internal KB    │
└─────────────────────────────────────┘
```

### When Web Search is Used:
```
┌─────────────────────────────────────┐
│ 🔍 Reasoning Chain        3.42s     │
├─────────────────────────────────────┤
│ ⚠️  Escalation Detection     ✓ Done │
│     0.00s                            │
│ 💾 RAG Search              ○ Empty  │
│     0.14s                            │
│ 🌐 Web Search            ✓ Success  │
│     2 results | 0.65s               │
│ 🧠 LLM Generation        ✓ Success  │
│     owl-alpha | 2.63s               │
├─────────────────────────────────────┤
│ Knowledge Source: 🌐 Official Web   │
└─────────────────────────────────────┘
```

## Advanced Features

### Option 1: Collapsible Reasoning Chain

Make it collapsible by default, expandable on click:

```typescript
const [isExpanded, setIsExpanded] = useState(false);

return (
  <div className="my-3">
    <button
      onClick={() => setIsExpanded(!isExpanded)}
      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
      <Search className="h-4 w-4" />
      <span>Show reasoning ({chain.totalTime.toFixed(2)}s)</span>
      {isExpanded ? <ChevronUp /> : <ChevronDown />}
    </button>
    
    {isExpanded && (
      <div className="mt-2 p-3 bg-muted/50 rounded-lg">
        {/* Steps here */}
      </div>
    )}
  </div>
);
```

### Option 2: Real-time Streaming

Show steps as they happen (streaming):

```typescript
// In the backend, emit reasoning step events:
yield f"data: {json.dumps({'type': 'reasoning_step', 'step': {...}})}\n\n"

// In the frontend, handle them:
case 'reasoning_step':
  setReasoningSteps(prev => [...prev, data.step]);
```

### Option 3: Performance Metrics

Add a performance badge:

```typescript
const getPerformanceBadge = (time: number) => {
  if (time < 1) return <span className="text-green-600">⚡ Fast</span>;
  if (time < 3) return <span className="text-yellow-600">👍 Good</span>;
  return <span className="text-orange-600">🐌 Slow</span>;
};
```

## Benefits

1. **Transparency** - Users see exactly how the AI arrived at the answer
2. **Trust** - Showing the sources (RAG vs Web) builds confidence
3. **Debugging** - You can see if RAG is working or always falling back to web
4. **Performance** - Users can see response times for each step
5. **Education** - Users learn about the AI system

## Next Steps

1. **Implement backend changes** - Add reasoning_chain to metadata
2. **Create frontend component** - ReasoningChainRenderer
3. **Test with real queries** - See the flow in action
4. **Iterate on design** - Make it look great
5. **Add more details** - Model used, token count, cache hits, etc.

This will make your AI system much more transparent and trustworthy! 🎉
