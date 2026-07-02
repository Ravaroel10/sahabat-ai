## Why

The current feature set is fragmented across multiple separate tools (AI Rights Navigator, Evidence Citation Engine, Fact Checker, Emergency Escalation, Rights Marketplace, Eligibility Scanner, Auto-Birokrasi), creating a disjointed user experience that increases cognitive load. Users must navigate between different interfaces to accomplish related tasks, violating our core principle of "Reduce, don't relocate cognitive load." By consolidating these into 3 unified features, we create a more intuitive, accessible experience that better serves our primary users—Indonesian citizens with varying digital literacy navigating social assistance programs.

## What Changes

- **Consolidate AI chat capabilities**: Merge AI Rights Navigator, Evidence Citation Engine, Fact Checker, and Emergency Escalation into a single unified AI chat interface with integrated capabilities
- **Simplify navigator UI**: Remove information-heavy layout from `/navigator` page, replace with clean chat-first interface using OpenUI patterns
- **Unify rights marketplace and eligibility**: Combine Rights Marketplace and Eligibility Scanner into one feature with advanced filtering
- **Integrate auto-birokrasi access**: Ensure Auto-Birokrasi feature is accessible from both the AI chat (via LLM suggestions) and from the Rights Marketplace (as next steps)
- **Add inline example prompts**: Display example questions within the chat UI itself rather than in sidebar panels

## Capabilities

### New Capabilities

- `unified-ai-chat`: Single AI chat interface with multi-capability support (rights navigation, evidence citation, fact checking, emergency escalation)
- `unified-marketplace-scanner`: Combined Rights Marketplace and Eligibility Scanner with advanced filtering
- `cross-feature-navigation`: Navigation system allowing seamless transitions between AI chat, marketplace, and auto-birokrasi

### Modified Capabilities

- `ai-rights-navigator`: Requirement changes from standalone feature to integrated chat capability with simplified UI
- `eligibility-scanner`: Changes from standalone tool to advanced filtering within unified marketplace

## Impact

**Affected Code**:
- `/src/app/(main)/navigator/page.tsx` - Major redesign from layout-heavy to chat-focused
- `/src/app/(main)/scanner/` - Integration with marketplace feature
- `/src/components/chat/chat-interface.tsx` - Enhanced with multi-capability support
- `/src/components/sidebar-nav.tsx` - Navigation structure changes (3 main items instead of 5+)

**New Dependencies**:
- Vercel AI SDK for modern chat interface with streaming (researched via Context7 Power)
- Cross-feature linking logic for AI-suggested actions

**Implementation Approach**:
- Use Context7 Power (Kiro) throughout for accurate, up-to-date documentation lookup
- All library integrations reference Context7 for current patterns and APIs

**User Experience Impact**:
- Reduced navigation complexity (3 main features instead of 5+)
- Streamlined workflow with AI-driven feature suggestions
- Lower cognitive load with unified interfaces
- Better mobile experience with simpler navigation structure
