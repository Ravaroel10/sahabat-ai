## 🔄 Complete LLM Workflow

### Overview: End-to-End Request Pipeline

```
User Message → Orchestrator → LLM → Response Processing → User
     ↓              ↓           ↓           ↓              ↑
  Text Input   Context       AI          Intent         UI with
               Building    Analysis    Extraction     Smart Actions
```

### Detailed Flow (7 Steps)

#### **STEP 1: Escalation Detection (Pre-LLM)**
```python
# DETERMINISTIC - No AI involved yet
escalation = detect_escalation(message)
emergency = escalation["detected"] and escalation["priority"] == "red"
```

**What Happens:**
- Keyword matching for emergency terms: "kelaparan", "kematian", "kebakaran", "kekerasan", "bunuh diri"
- Assigns priority: "red" (critical life-threatening), "yellow" (urgent but stable), "green" (normal)
- Extracts relevant hotlines: 119 (Kemensos), BNPB, BPJS, Komnas HAM, KPAI
- **No LLM used** - deterministic for speed and reliability

**Keywords by Priority:**
- **RED** (Life-threatening): kelaparan, tunawisma, kematian, gagal ginjal, kanker stadium akhir, bencana alam, gempa, tsunami, kebakaran, kekerasan, trafficking, bunuh diri, overdosis, koma
- **YELLOW** (Urgent): sakit, rumah sakit, operasi, medis, hutang, PHK, tidak mampu, kesulitan

**Why Keyword-Based (Not AI)?**

🤔 **"Wait, didn't we just replace keywords with AI for intent classification? Why not for emergencies?"**

Good question! Here's why escalation detection is intentionally kept deterministic:

1. **Life-Critical = Zero False Negatives**
   - Missing an emergency is MUCH worse than a false positive
   - Keywords cast a wide net: "sakit" (yellow) catches all illness mentions
   - LLM might miss subtle emergency signals or get confused by context

2. **Speed Matters for Safety** (< 10ms)
   - Keyword matching: ~5-10ms ⚡
   - LLM call: ~300-500ms (30-50x slower)
   - Emergency = every millisecond counts

3. **Reliability > Flexibility**
   - Keywords work 100% of the time, even if LLM API is down
   - No dependency on external service for safety-critical feature
   - Deterministic = testable, auditable, predictable

4. **Regulatory Compliance**
   - Government services need audit trails
   - "LLM decided it wasn't an emergency" is not acceptable for compliance
   - Keyword rules can be documented and reviewed by legal teams

5. **Different Problem Domain**
   - **Intent classification**: Many subtle variations ("bisa jelaskan PKH?", "PKH itu apa?")
     → AI excels here (understanding nuance)
   - **Emergency detection**: Few high-stakes keywords ("bunuh diri", "koma", "gempa")
     → Keywords are sufficient and safer

**Hybrid Approach = Best of Both Worlds:**
```python
# Safety-critical: Deterministic (keywords)
if "bunuh diri" in message:
    priority = "red"  # ← Always catches it

# User experience: AI-driven (flexible)
llm_decides = {
    "primary_intent": "question",  # ← Understands variations
    "show_program_cards": false
}
```

**Could We Use AI for Escalation?**

Yes, but with tradeoffs:

| Approach | Pros | Cons |
|----------|------|------|
| **Keywords (Current)** | ⚡ Fast (5ms)<br>✅ Always works<br>🔒 Auditable<br>🎯 Zero false negatives | ❌ Can't understand context<br>❌ False positives possible |
| **LLM-Based** | ✅ Understands context<br>✅ Fewer false positives<br>✅ Handles variations | ⏱️ Slower (300ms)<br>❌ Depends on API<br>❌ Might miss emergencies<br>❌ Not auditable |
| **Hybrid** | ✅ Keywords catch emergencies<br>✅ LLM refines priority | 🤷 Complex<br>💰 Extra LLM call |

**Our Decision:** For emergency detection, **false negatives are unacceptable**. Better to show emergency UI for "sakit ringan" (false positive) than miss "anak koma" (false negative).

**Example:**
```python
# User: "Anak saya sakit tapi sepertinya hanya flu biasa"

# Keyword detection:
escalation = {
  "detected": True,
  "priority": "yellow",  # ← "sakit" keyword triggered
  "keywords": ["sakit"]
}

# LLM understands it's not urgent, but keywords ensure safety net
# UI shows: "⚡ Perhatian diperlukan" + relevant BPJS info
# Better safe than sorry!
```

**Note:** Intent classification (question vs application) is lower stakes - wrong intent = suboptimal UI, not missed emergency. That's why we use AI there.

---

#### **STEP 2: RAG Knowledge Base Search**
```python
# Vector similarity search against embedded regulations
rag_results = search_rag(message)
context_text = _build_rag_context(rag_results)
citations = _extract_citations(rag_results)
programs = _extract_programs(rag_results)
```

**What Happens:**
1. Embeds user message into vector (using sentence-transformers)
2. Searches Qdrant vector database for similar documents
3. Returns top 5 most relevant chunks with metadata
4. Extracts:
   - Legal citations (Permensos No. X/YYYY)
   - Program details (PKH, BPNT, etc.)
   - Regulatory text for context

**Why RAG:**
- **Accuracy**: Grounded in official regulations, not hallucinations
- **Citations**: Can cite exact legal basis (Permensos, Perpres)
- **Up-to-date**: Database updated when regulations change
- **Offline**: Works without internet after initial load

**Example:**
```python
message = "Apa syarat PKH?"

rag_results = [
  {
    "text": "Persyaratan PKH meliputi: keluarga miskin dengan anak usia sekolah...",
    "metadata": {
      "source": "pkh-guidelines",
      "legal_basis": "Permensos No. 1/2024 tentang PKH",
      "record_type": "program",
      "record_id": "pkh"
    },
    "score": 0.92
  }
]

programs = [{
  "id": "pkh",
  "name": "Program Keluarga Harapan",
  "description": "Bantuan tunai bersyarat untuk keluarga miskin...",
  "benefits": "Rp 500.000 - Rp 3.000.000/bulan",
  "regulations": ["Permensos No. 1/2024 tentang PKH"]
}]
```

---

#### **STEP 3: Fallback Web Search (If RAG Fails)**
```python
# Only if RAG returns no results
if not rag_results:
    web_results = search_official_web(message)  # Exa API
    context_text = _build_web_context(web_results)
    sources = web_results
```

**What Happens:**
- Uses Exa API to search official government websites only
- Filters: `.go.id` domains (kemensos.go.id, bpjs-kesehatan.go.id)
- Returns: Title, URL, snippet
- **NOT cited as legal basis** - just supplementary info

**Why Fallback:**
- RAG might not have info on very new programs
- Handles edge cases (regional programs, recent policy changes)
- Better than no answer

**Example:**
```python
web_results = [
  {
    "title": "Panduan PKH Terbaru 2024",
    "url": "https://kemensos.go.id/pkh-2024",
    "snippet": "Kementerian Sosial merilis panduan PKH terbaru..."
  }
]

# LLM will be instructed:
# "Info berasal dari web search. JANGAN sitasi sebagai peraturan resmi."
```

---

#### **STEP 4: Context Composition**
```python
full_context = _compose_context(
    context_text,        # From RAG or Web
    conversation,        # Chat history
    user_context,        # User profile (income, family, etc.)
    escalation          # Emergency flags
)
```

**What Happens:**
Combines multiple context sources into one prompt section:

```markdown
### Dokumen 1
Sumber: pkh-guidelines
Dasar Hukum: Permensos No. 1/2024
Isi: [regulation text]

### Profil Pengguna
- income: 1500000
- family_size: 5
- has_children_in_school: true

### PERINGATAN DARURAT
Prioritas: RED
Kata kunci: jatuh, patah tulang
Hotline: 119
Aksi: Segera hubungi ambulans

### Riwayat Percakapan
[user]: Apa itu PKH?
[assistant]: PKH adalah Program Keluarga Harapan...
[user]: Suami jatuh dari perancah
```

**Why Multi-Source:**
- **Personalization**: User profile = tailored eligibility checking
- **Continuity**: Conversation history = contextual follow-ups
- **Safety**: Emergency context = prioritized response
- **Accuracy**: RAG/Web = grounded facts

---

#### **STEP 5: LLM Generation with Structured Output**
```python
llm = get_llm_service()
token_stream = llm.generate_stream(
    prompt=message,
    system_prompt=BANTUARAH_SYSTEM_PROMPT,  # Special instructions
    context=full_context,
)
```

**System Prompt Instructs LLM to:**

1. **Output JSON First** (metadata classification)
2. **Then write natural response** (user-facing text)
3. **Use inline markers** for UI components

**LLM Response Format:**
```markdown
```json
{
  "intent_classification": {
    "primary_intent": "application",
    "confidence": 0.92,
    "show_program_cards": true,
    "show_action_buttons": true,
    "show_next_steps": true,
    "reasoning": "User describes situation and seeks help"
  }
}
```

Berdasarkan situasi Anda, saya rekomendasikan:

[PROGRAM:pkh]

Program ini cocok karena Anda memiliki anak usia sekolah.

[ACTION:auto-birokrasi]

Untuk memulai, klik tombol di atas untuk generate dokumen.
```

**Why This Format:**
- **Structured Data**: JSON for programmatic decisions
- **Natural Language**: Markdown for user experience
- **Inline Components**: Markers for UI rendering
- **Single Call**: Everything in one LLM response (efficient!)

---

#### **STEP 6: Intent Extraction & Metadata Application**
```python
# Parse JSON from LLM response
intent, cleaned_response = extract_intent_from_response(raw_response)

# Use LLM's decision to generate actions/steps
actions, next_steps = apply_intent_to_metadata(
    intent, programs, escalation, message
)

# Filter programs if LLM says not to show cards
programs = filter_programs_by_intent(intent, programs)
```

**What Happens:**

1. **Extract JSON Block**
   ```python
   # Regex: ```json ... ```
   json_pattern = r'```json\s*\n?(.*?)\n?```'
   match = re.search(json_pattern, response_text, re.DOTALL)
   ```

2. **Validate Structure**
   ```python
   required_fields = [
       "primary_intent",
       "confidence", 
       "show_program_cards",
       "show_action_buttons",
       "show_next_steps"
   ]
   ```

3. **Apply Decisions**
   ```python
   if intent["show_action_buttons"]:
       if intent["primary_intent"] == "document_request":
           actions = [{"type": "auto-birokrasi", ...}]
       elif intent["primary_intent"] == "application":
           actions = [
               {"type": "auto-birokrasi", ...},
               {"type": "marketplace", ...}
           ]
   ```

4. **Remove JSON from Response**
   ```python
   # User doesn't see the JSON, only the cleaned text
   cleaned_response = re.sub(r'\s*```json.*?```\s*', '', response_text)
   ```

**Why Extract Intent:**
- **AI-Driven UX**: LLM decides what UI elements to show
- **Context-Aware**: Different actions for different intents
- **Graceful Degradation**: Falls back to heuristics if JSON invalid

---

#### **STEP 7: Content Transformation & Response**
```python
# Transform inline markers to UI components
answer = transform_content(cleaned_response)

return {
    "answer": answer,               # Rendered markdown with components
    "citations": citations,         # Legal references
    "sources": sources,             # Web URLs
    "emergency": emergency,         # Red banner flag
    "programs": programs,           # Filtered program cards
    "actions": actions,             # CTA buttons
    "next_steps": next_steps,       # Step-by-step guidance
}
```

**Content Transformation:**

1. **Program Markers** → Program Cards
   ```markdown
   [PROGRAM:pkh]
   
   ↓ transforms to ↓
   
   <ProgramCard id="pkh" />
   ```

2. **Action Markers** → CTA Buttons
   ```markdown
   [ACTION:auto-birokrasi]
   
   ↓ transforms to ↓
   
   <ActionButton type="auto-birokrasi" />
   ```

3. **Markdown** → React Components
   ```markdown
   **Bold text** → <strong>Bold text</strong>
   [Link](url) → <a href="url">Link</a>
   ```

**Final API Response:**
```json
{
  "answer": "<p>Berdasarkan...</p><ProgramCard id='pkh' /><p>...</p>",
  "citations": [
    {"regulation": "Permensos No. 1/2024", "full_citation": "..."}
  ],
  "sources": [],
  "emergency": false,
  "programs": [
    {"id": "pkh", "name": "Program Keluarga Harapan", ...}
  ],
  "actions": [
    {"type": "auto-birokrasi", "label": "📄 Siapkan Dokumen", ...}
  ],
  "next_steps": [
    "📄 Gunakan Auto-Birokrasi...",
    "Datang ke Dinas Sosial..."
  ]
}
```

---

## 🆚 Why This Differs from Normal LLM

### Normal LLM Chat (ChatGPT, Claude, etc.)

```
User → LLM → Text Response → Done
```

**Characteristics:**
- ❌ **Pure Text**: No structured metadata
- ❌ **Stateless**: No knowledge base integration
- ❌ **Generic**: Same response format for all queries
- ❌ **Ungrounded**: Can hallucinate facts
- ❌ **Static UI**: Just a text box
- ❌ **Single Mode**: Conversational only

**Example Normal LLM:**
```
User: "Apa itu PKH?"

LLM: "PKH atau Program Keluarga Harapan adalah program bantuan 
      sosial dari pemerintah Indonesia untuk keluarga miskin..."
      
[That's it. Just text.]
```

---

### Our Hybrid LLM System (BantuArah)

```
User → Pre-Processing → RAG → LLM → Intent Parsing → Multi-Format Response
  ↓         ↓            ↓     ↓          ↓                    ↓
Text   Escalation    Vector  AI    JSON Extract        Text + Cards
       Detection    Search  Agent   + Validation      + Buttons + Steps
```

**Characteristics:**
- ✅ **Hybrid Output**: Text + JSON + Inline Markers
- ✅ **Stateful**: RAG + conversation history + user profile
- ✅ **Adaptive**: Different UI based on intent
- ✅ **Grounded**: Citations from regulations
- ✅ **Dynamic UI**: Cards, buttons, steps change per query
- ✅ **Multi-Mode**: Chat + Navigation + Document Gen + Emergency

**Example Our System:**
```
User: "Apa itu PKH?"

System Response:
{
  // Structured metadata (not shown to user)
  "intent": {
    "primary_intent": "question",
    "show_program_cards": false,
    "show_action_buttons": false
  },
  
  // Natural text (shown to user)
  "answer": "PKH adalah Program Keluarga Harapan...",
  
  // Grounded citations (shown as footnotes)
  "citations": [
    "Permensos No. 1/2024 tentang PKH"
  ],
  
  // NO actions (it's just a question)
  "actions": [],
  "next_steps": []
}
```

---

### Key Architectural Differences

| Aspect | Normal LLM | BantuArah Hybrid |
|--------|-----------|------------------|
| **Input** | Raw text | Text + Context (RAG + User Profile + History) |
| **Output** | Plain text | Text + JSON + Markers |
| **Knowledge** | Pre-training only | Pre-training + RAG + Web Search |
| **UI Adaptation** | Static | Dynamic (intent-driven) |
| **Safety** | Content filters | Pre-LLM escalation + Post-LLM validation |
| **Traceability** | None | Legal citations + source URLs |
| **Failure Mode** | Hallucination | Fallback to keywords + web search |
| **Response Type** | Conversational | Task-oriented (Q&A, Docs, Navigation, Emergency) |

---

### Why We Built It This Way

#### 1. **Government Context Requires Accuracy**
```python
# Normal LLM
"PKH memberikan Rp 500.000 per bulan"  # Might be outdated/wrong

# Our System
"Berdasarkan Permensos No. 1/2024, Pasal 5, PKH memberikan 
 Rp 500.000 - Rp 3.000.000 per bulan tergantung komponen."
```
→ **Grounded in regulations = No hallucinations**

#### 2. **Different Queries Need Different UX**

**Question** → Text only
```
"Apa itu PKH?"
→ Answer + citation. Done.
```

**Application** → Full assistance
```
"Saya buruh, 3 anak, penghasilan 1.5 juta"
→ Answer + program cards + document buttons + step-by-step guide
```

**Emergency** → Immediate action
```
"Suami jatuh dari perancah"
→ 🚨 RED BANNER + hotline + priority programs + urgent steps
```

→ **Intent-driven UI = Better UX**

#### 3. **LLM Makes Better Intent Decisions**

**New (AI-Driven):**
```python
llm_decides = {
  "primary_intent": "question",
  "confidence": 0.95,
  "reasoning": "User asking informational question"
}
# ✅ Works on all variations
```

#### 4. **Structured Output = Programmatic Control**

**Normal LLM:**
```
"Saya rekomendasikan PKH untuk Anda. Anda bisa mengajukan..."
[How do we show a program card? Parse the text? Brittle!]
```

**Our System:**
```markdown
Saya rekomendasikan:

[PROGRAM:pkh]

Anda bisa mengajukan...
```
→ **Inline markers = Reliable UI rendering**

#### 5. **Hybrid = Best of Both Worlds**

- **Deterministic** where needed (escalation detection)
- **AI-driven** where beneficial (intent classification)
- **Fallback** when LLM fails (keyword heuristics)

---

## 🧠 How It Works

### 1. Enhanced System Prompt

The system prompt now instructs the LLM to output a JSON classification at the start of every response:

```json
{
  "intent_classification": {
    "primary_intent": "question" | "document_request" | "application" | "emergency" | "general_help",
    "confidence": 0.95,
    "show_program_cards": false,
    "show_action_buttons": false,
    "show_next_steps": false,
    "reasoning": "User is asking an informational question about PKH"
  }
}
```

### 2. Intent Parser

New module: `ai-service/orchestrator/intent_parser.py`

**Functions:**
- `extract_intent_from_response()` - Extracts JSON from LLM response
- `apply_intent_to_metadata()` - Converts intent to actions/steps
- `filter_programs_by_intent()` - Filters program cards based on intent

### 3. Orchestrator Integration

The orchestrator now:
1. Calls LLM (with enhanced prompt)
2. Collects full response
3. Extracts intent JSON
4. Uses LLM's decisions to determine what features to show
5. Returns cleaned response (JSON removed) + metadata

---

## 📋 Intent Types

### 1. `"question"` - Learning/Information Only

**Examples:**
- "Apa itu PKH?"
- "Bagaimana cara kerja bantuan sosial?"
- "Berapa besaran BPNT?"

**LLM Decision:**
```json
{
  "primary_intent": "question",
  "confidence": 0.95,
  "show_program_cards": false,
  "show_action_buttons": false,
  "show_next_steps": false,
  "reasoning": "User wants information, not ready to apply"
}
```

**Result:**
- Text answer + citations only
- NO program cards
- NO action buttons
- NO next steps

---

### 2. `"document_request"` - Ready to Generate Docs

**Examples:**
- "Buatkan SKTM"
- "Saya butuh surat permohonan"
- "Generate formulir pendaftaran"

**LLM Decision:**
```json
{
  "primary_intent": "document_request",
  "confidence": 0.98,
  "show_program_cards": false,
  "show_action_buttons": true,
  "show_next_steps": false,
  "reasoning": "User explicitly requests document generation"
}
```

**Result:**
- Text confirmation
- ONE button: "📄 Buat Dokumen Sekarang" (direct Auto-Birokrasi)
- NO program cards
- NO next steps

---

### 3. `"application"` - Ready to Apply

**Examples:**
- "Saya buruh penghasilan 1.5 juta, 3 anak"
- "Program apa yang cocok untuk saya?"
- "Anak saya butuh bantuan sekolah"

**LLM Decision:**
```json
{
  "primary_intent": "application",
  "confidence": 0.92,
  "show_program_cards": true,
  "show_action_buttons": true,
  "show_next_steps": true,
  "reasoning": "User describes situation and seeks program recommendations"
}
```

**Result:**
- Text explanation
- Program cards (2-3 relevant programs)
- Action buttons (Auto-Birokrasi + Marketplace)
- Next steps (full application process)

---

### 4. `"emergency"` - Urgent Help Needed

**Examples:**
- "Suami jatuh dari perancah"
- "Rumah saya kebakaran"
- "Anak sakit keras tidak punya biaya"

**LLM Decision:**
```json
{
  "primary_intent": "emergency",
  "confidence": 0.99,
  "show_program_cards": true,
  "show_action_buttons": true,
  "show_next_steps": true,
  "reasoning": "Critical situation requiring immediate assistance"
}
```

**Result:**
- RED emergency alert (first)
- Emergency programs (JKK, BSU)
- Priority actions (hotline first)
- Priority steps (with 🚨 markers)

---

### 5. `"general_help"` - Unclear but Needs Help

**Examples:**
- "Saya butuh bantuan"
- "Tolong saya"
- "Gimana ini?"

**LLM Decision:**
```json
{
  "primary_intent": "general_help",
  "confidence": 0.75,
  "show_program_cards": false,
  "show_action_buttons": true,
  "show_next_steps": false,
  "reasoning": "User needs help but intent unclear, offer exploration"
}
```

**Result:**
- Clarifying questions
- Marketplace button (for exploration)
- NO program cards (until more info)
- NO next steps (no clear path yet)

---

## 🔄 Fallback Mechanism

If LLM fails to output valid JSON (rare), the system falls back to keyword-based heuristics:

```python
if intent is None:
    logger.info("⚠️  Using fallback heuristic approach")
    # Use old keyword matching as safety net
    actions = _generate_actions(programs, escalation, message)
    next_steps = _generate_next_steps(programs, escalation, message)
```

This ensures the system **never breaks**, even if:
- LLM outputs malformed JSON
- Network issues truncate response
- LLM doesn't follow instructions

### AI-Driven Approach

```python
# LLM understands context
{
  "primary_intent": "question",
  "confidence": 0.92,
  "reasoning": "User asking informational question"
}
```

**Handles all variations:**
- "bisa jelaskan PKH?" ✅
- "saya mau tau tentang PKH" ✅
- "pkh itu apa sih?" ✅
- "apa sih pkh?" ✅
- "gw pengen tau pkh dong" ✅
- "explain pkh pls" ✅
- "bantu gw ngerti pkh" ✅

---

## 🏗️ Technical Implementation

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          API Layer                              │
│                    (FastAPI Endpoints)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                       Orchestrator                              │
│   (orchestrator/orchestrator.py)                                │
│                                                                 │
│   ┌─────────────┐  ┌──────────┐  ┌─────────┐  ┌────────────┐ │
│   │ Escalation  │  │   RAG    │  │   Web   │  │    LLM     │ │
│   │  Detection  │→ │  Search  │→ │ Search  │→ │  Service   │ │
│   └─────────────┘  └──────────┘  └─────────┘  └────────────┘ │
│                                                        ↓        │
│                                            ┌───────────────────┐│
│                                            │  Intent Parser    ││
│                                            │  + Transformer    ││
│                                            └───────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Qdrant     │  │   Exa API    │  │  OpenAI/     │        │
│  │  (Vector DB) │  │  (Web Search)│  │  Anthropic   │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

### Core Modules

#### 1. `orchestrator/orchestrator.py` - Main Pipeline Controller

**Responsibilities:**
- Coordinates all 7 steps of the workflow
- Manages state (conversation, user context)
- Handles errors and fallbacks
- Logs performance metrics

**Key Functions:**
```python
def orchestrate_chat(
    message: str,
    conversation: Optional[List[Dict]] = None,
    user_context: Optional[Dict] = None,
) -> Tuple[Iterator[str], List, List, bool, List, List, List]:
    """
    Returns: (token_stream, citations, sources, emergency, 
              programs, actions, next_steps)
    """
    # Step 1: Escalation
    escalation = detect_escalation(message)
    
    # Step 2: RAG
    rag_results = search_rag(message)
    
    # Step 3: Fallback Web
    if not rag_results:
        web_results = search_official_web(message)
    
    # Step 4: Context
    full_context = _compose_context(...)
    
    # Step 5: LLM
    token_stream = llm.generate_stream(...)
    
    # Step 6: Actions/Steps (fallback)
    actions = _generate_actions(...)
    next_steps = _generate_next_steps(...)
    
    return token_stream, citations, sources, emergency, programs, actions, next_steps
```

---

#### 2. `orchestrator/intent_parser.py` - JSON Extraction & Application

**Responsibilities:**
- Parse JSON block from LLM response
- Validate structure and required fields
- Apply intent to determine actions/steps
- Filter programs based on intent

**Key Functions:**
```python
def extract_intent_from_response(response_text: str) -> Tuple[Optional[Dict], str]:
    """
    Extract ```json ... ``` block from LLM response.
    
    Returns:
        (intent_dict, cleaned_response_text)
    """
    json_pattern = r'```json\s*\n?(.*?)\n?```'
    match = re.search(json_pattern, response_text, re.DOTALL)
    
    if not match:
        return None, response_text
    
    intent_data = json.loads(match.group(1))
    classification = intent_data["intent_classification"]
    
    # Remove JSON from response
    cleaned = re.sub(r'\s*```json.*?```\s*', '', response_text, count=1)
    
    return classification, cleaned


def apply_intent_to_metadata(
    intent: Optional[Dict],
    programs: list,
    escalation: Dict,
    message: str,
) -> Tuple[list, list]:
    """
    Use LLM's intent classification to generate actions and next_steps.
    Falls back to heuristics if intent is None.
    
    Returns:
        (actions, next_steps)
    """
    if intent is None:
        # Fallback to keyword-based approach
        return _generate_actions_fallback(), _generate_next_steps_fallback()
    
    # Apply LLM's decisions
    if intent["show_action_buttons"]:
        if intent["primary_intent"] == "document_request":
            actions = [{"type": "auto-birokrasi", ...}]
        # ... other intents
    
    return actions, next_steps
```

---

#### 3. `orchestrator/content_transformer.py` - Inline Marker Rendering

**Responsibilities:**
- Transform `[PROGRAM:id]` → `<ProgramCard />`
- Transform `[ACTION:type]` → `<ActionButton />`
- Convert markdown to HTML

**Key Functions:**
```python
def transform_content(raw_text: str) -> str:
    """
    Transform inline markers and markdown to renderable format.
    
    Example:
        "[PROGRAM:pkh]" → "<ProgramCard id='pkh' />"
        "[ACTION:auto-birokrasi]" → "<ActionButton type='auto-birokrasi' />"
    """
    # Replace program markers
    text = re.sub(
        r'\[PROGRAM:([a-z-]+)\]',
        r"<ProgramCard id='\1' />",
        raw_text
    )
    
    # Replace action markers
    text = re.sub(
        r'\[ACTION:([a-z-]+)\]',
        r"<ActionButton type='\1' />",
        raw_text
    )
    
    # Convert markdown
    text = markdown_to_html(text)
    
    return text
```

---

#### 4. `orchestrator/escalation.py` - Emergency Detection

**Responsibilities:**
- Keyword-based detection (deterministic, fast)
- Priority assignment (red, yellow)
- Hotline mapping

**Implementation:**
```python
EMERGENCY_KEYWORDS = {
    "red": [
        "jatuh", "kecelakaan", "cedera", "patah tulang", "luka berat",
        "lapar", "tidak ada makanan", "diusir", "penggusuran",
        "sakit parah", "butuh operasi", "rawat inap",
        "kdrt", "kekerasan", "dipukul", "dianiaya"
    ],
    "yellow": [
        "susah cari kerja", "di-PHK", "gaji telat", "utang menumpuk"
    ]
}

HOTLINE_MAPPING = {
    "medis": "119",
    "polisi": "110",
    "pemadam": "113",
    "dinsos": "1500-799"
}

def detect_escalation(message: str) -> Dict[str, Any]:
    message_lower = message.lower()
    detected_keywords = []
    priority = None
    
    for keyword in EMERGENCY_KEYWORDS["red"]:
        if keyword in message_lower:
            detected_keywords.append(keyword)
            priority = "red"
    
    if not priority:
        for keyword in EMERGENCY_KEYWORDS["yellow"]:
            if keyword in message_lower:
                detected_keywords.append(keyword)
                priority = "yellow"
    
    return {
        "detected": len(detected_keywords) > 0,
        "priority": priority,
        "keywords": detected_keywords,
        "hotlines": _determine_hotlines(detected_keywords),
        "suggestedAction": _suggest_action(priority)
    }
```

---

#### 5. `prompts/system_prompt.py` - LLM Instructions

**Responsibilities:**
- Define agent behavior
- Specify output format (JSON + text + markers)
- Provide examples and guidelines

**Key Sections:**
```python
BANTUARAH_SYSTEM_PROMPT = """
## INSTRUKSI METADATA (PENTING!)

SEBELUM menulis respons utama, klasifikasikan intent dalam JSON:

```json
{
  "intent_classification": {
    "primary_intent": "question" | "document_request" | "application" | "emergency" | "general_help",
    "confidence": 0.0-1.0,
    "show_program_cards": boolean,
    "show_action_buttons": boolean,
    "show_next_steps": boolean,
    "reasoning": "brief explanation"
  }
}
```

## PANDUAN RESPONS

### Gunakan Inline Markers:
- Program cards: [PROGRAM:pkh]
- Action buttons: [ACTION:auto-birokrasi]

### Struktur:
1. JSON classification (in code block)
2. Natural response text
3. Inline markers for UI components
4. Citations when applicable
"""
```

---

#### 6. `tools/rag.py` - Vector Search

**Responsibilities:**
- Embed user query
- Search Qdrant vector database
- Return ranked results with metadata

**Implementation:**
```python
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient

model = SentenceTransformer('all-MiniLM-L6-v2')
qdrant = QdrantClient(host="localhost", port=6333)

def search_rag(query: str, top_k: int = 5) -> List[Dict]:
    # Embed query
    query_vector = model.encode(query).tolist()
    
    # Search Qdrant
    results = qdrant.search(
        collection_name="bantuarah_knowledge",
        query_vector=query_vector,
        limit=top_k
    )
    
    # Format results
    return [
        {
            "text": hit.payload["text"],
            "metadata": hit.payload["metadata"],
            "score": hit.score
        }
        for hit in results
    ]
```

---

#### 7. `tools/official_search.py` - Web Fallback

**Responsibilities:**
- Query Exa API for .go.id domains
- Extract title, URL, snippet
- Return as structured data

**Implementation:**
```python
import requests

def search_official_web(query: str, max_results: int = 5) -> List[Dict]:
    exa_api_key = os.getenv("EXA_API_KEY")
    
    response = requests.post(
        "https://api.exa.ai/search",
        headers={"Authorization": f"Bearer {exa_api_key}"},
        json={
            "query": query,
            "num_results": max_results,
            "include_domains": ["go.id"],  # Only official gov sites
            "type": "keyword"
        }
    )
    
    results = response.json().get("results", [])
    
    return [
        {
            "title": result["title"],
            "url": result["url"],
            "snippet": result["text"][:300]
        }
        for result in results
    ]
```

---

#### 8. `services/llm.py` - LLM Client

**Responsibilities:**
- Abstract LLM provider (OpenAI, Anthropic, etc.)
- Handle streaming
- Manage API keys and rate limits

**Implementation:**
```python
from openai import OpenAI

class LLMService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "gpt-4o-mini"
    
    def generate_stream(
        self, 
        prompt: str, 
        system_prompt: str, 
        context: str
    ) -> Iterator[str]:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"{context}\n\n{prompt}"}
        ]
        
        stream = self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            stream=True
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

def get_llm_service() -> LLMService:
    return LLMService()
```

---

### Data Flow Example

Let's trace a real request through the system:

**Input:**
```json
{
  "message": "Saya buruh harian, istri hamil, 3 anak sekolah, penghasilan 1.5 juta",
  "conversation": [],
  "user_context": {
    "occupation": "buruh_harian",
    "income": 1500000,
    "family_size": 5,
    "has_children_in_school": true,
    "has_pregnant_wife": true
  }
}
```

**Step 1: Escalation** → No emergency detected

**Step 2: RAG** → Returns PKH, BPNT, KIP programs

**Step 3: Web** → Skipped (RAG successful)

**Step 4: Context Built:**
```markdown
### Dokumen 1
Sumber: pkh-guidelines
Dasar Hukum: Permensos No. 1/2024
Isi: PKH memberikan bantuan untuk keluarga miskin dengan...

### Profil Pengguna
- occupation: buruh_harian
- income: 1500000
- family_size: 5
- has_children_in_school: true
- has_pregnant_wife: true

### Riwayat Percakapan
[empty]
```

**Step 5: LLM Generation:**
```markdown
```json
{
  "intent_classification": {
    "primary_intent": "application",
    "confidence": 0.92,
    "show_program_cards": true,
    "show_action_buttons": true,
    "show_next_steps": true,
    "reasoning": "User describes situation seeking program recommendations"
  }
}
```

Berdasarkan situasi Anda sebagai buruh harian dengan penghasilan Rp 1.5 juta 
dan memiliki 3 anak sekolah serta istri hamil, saya rekomendasikan:

[PROGRAM:pkh]

PKH sangat cocok karena Anda memiliki anak usia sekolah dan istri hamil.
Besaran bantuan: Rp 500.000 - Rp 3.000.000/bulan.

[PROGRAM:bpnt]

Bantuan sembako untuk membantu kebutuhan pangan keluarga.

[PROGRAM:kip]

Bantuan pendidikan untuk anak-anak Anda yang bersekolah.

[ACTION:auto-birokrasi]

Untuk memulai pendaftaran, gunakan fitur Auto-Birokrasi untuk generate 
dokumen persyaratan secara otomatis.
```

**Step 6: Intent Extraction:**
```python
intent = {
    "primary_intent": "application",
    "confidence": 0.92,
    "show_program_cards": True,
    "show_action_buttons": True,
    "show_next_steps": True
}

cleaned_response = """Berdasarkan situasi Anda...
[PROGRAM:pkh]
[PROGRAM:bpnt]
..."""
```

**Step 7: Content Transformation:**
```html
<p>Berdasarkan situasi Anda...</p>
<ProgramCard id="pkh" />
<p>PKH sangat cocok...</p>
<ProgramCard id="bpnt" />
...
<ActionButton type="auto-birokrasi" />
```

**Final Output:**
```json
{
  "answer": "<p>Berdasarkan...</p><ProgramCard id='pkh' />...",
  "citations": [
    {"regulation": "Permensos No. 1/2024", ...}
  ],
  "sources": [],
  "emergency": false,
  "programs": [
    {"id": "pkh", "name": "Program Keluarga Harapan", ...},
    {"id": "bpnt", ...},
    {"id": "kip", ...}
  ],
  "actions": [
    {"type": "auto-birokrasi", "label": "📄 Siapkan Dokumen", ...},
    {"type": "marketplace", "label": "📋 Lihat Semua Program", ...}
  ],
  "next_steps": [
    "📄 Gunakan Auto-Birokrasi untuk generate dokumen",
    "Siapkan KTP, KK, SKTM",
    "Datang ke Dinas Sosial terdekat"
  ]
}
```

---

### Performance Metrics

**Typical Request (with RAG hit):**
- Escalation detection: ~10ms
- RAG search: ~100ms
- Context building: ~5ms
- LLM generation (first token): ~300ms
- LLM streaming: ~2-3s (total)
- Intent parsing: ~5ms
- Content transformation: ~10ms

**Total Time to First Token: ~415ms**
**Total Time to Complete: ~3.5s**

---

### Error Handling & Fallbacks

```python
# 1. RAG fails → Web search
if not rag_results:
    web_results = search_official_web(message)

# 2. Web search fails → LLM with minimal context
if not rag_results and not web_results:
    context = user_context + conversation  # No external knowledge

# 3. Intent parsing fails → Keyword heuristics
if intent is None:
    actions = _generate_actions_fallback(programs, escalation, message)
    next_steps = _generate_next_steps_fallback(programs, escalation, message)

# 4. LLM fails → Error message with contact info
try:
    response = llm.generate_stream(...)
except Exception as e:
    logger.error(f"LLM failed: {e}")
    return {
        "answer": "Maaf, sistem sedang bermasalah. Silakan hubungi Dinas Sosial.",
        "emergency": False,
        "actions": [{"type": "external", "label": "Hubungi Dinsos", ...}]
    }
```

**Multi-Layer Fallback Strategy:**
1. **RAG** → Web Search → Minimal Context
2. **LLM Intent** → Keyword Heuristics
3. **Structured Output** → Plain Text
4. **Full System** → Error Message + Manual Contact

---

## 🎉 Summary: Why This Architecture Matters

### The Problem with Traditional Chatbots

Most chatbots follow a simple pattern:
```
User Input → LLM → Text Output → Done
```

This works for generic Q&A but fails for task-oriented applications like government services because:

1. **No Grounding**: LLM can hallucinate regulations
2. **No Adaptability**: Same UI for all query types
3. **No Safety**: Emergencies treated like normal questions
4. **No Traceability**: Can't cite legal basis
5. **No Action**: Just information, no next steps

### Our Hybrid Solution

```
User → Pre-Processing → RAG → LLM → Intent Parsing → Structured Response
  ↓         ↓           ↓     ↓          ↓                ↓
Text   Emergency    Vector  AI     JSON Extract    Text + UI + Actions
       Detection   Search  Agent   + Validation    + Citations + Steps
```

**Key Innovations:**

✅ **Pre-LLM Escalation**: Deterministic emergency detection (fast, reliable)
✅ **RAG Grounding**: Citations from real regulations, no hallucinations
✅ **Structured Output**: JSON + Text in one LLM call (efficient)
✅ **AI-Driven UX**: LLM decides what UI elements to show
✅ **Inline Markers**: Declarative UI rendering (`[PROGRAM:pkh]`)
✅ **Multi-Layer Fallback**: RAG → Web → Heuristics → Error (always works)
✅ **Task-Oriented**: Not just chat, but navigation + docs + emergency

### Real-World Impact

**After (AI-Driven):**
```python
llm_decides = {
    "primary_intent": "question",
    "confidence": 0.95,
    "show_program_cards": false
}
# ✅ Understands all phrasings, adapts UI dynamically
```

### Business Value

1. **Accuracy**: Legal citations prevent misinformation
2. **Efficiency**: Users get next steps immediately (Auto-Birokrasi, etc.)
3. **Safety**: Emergencies prioritized automatically
4. **Scalability**: New programs/policies = just update RAG, no code changes
5. **User Experience**: Dynamic UI based on actual intent, not guesswork

### Technical Achievement

We built a system that:
- **Combines deterministic safety with AI flexibility**
- **Produces structured + natural output in one call**
- **Gracefully degrades when components fail**
- **Adapts UI based on AI understanding**
- **Grounds every claim in cited sources**

This is NOT just a chatbot. It's a **multi-modal, task-oriented, grounded AI agent** that understands user intent and takes contextual action.
