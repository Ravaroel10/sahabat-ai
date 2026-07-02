# Product

## Register

product

## Users

**Primary Users**: Indonesian citizens navigating government social assistance programs (bansos). Many have limited digital literacy, may be in stressful financial situations, and need clear, accessible guidance. Often accessing from mobile devices with varying connectivity.

**Secondary Users**: Government workers (kelurahan, kecamatan staff) and NGO workers who assist citizens in accessing their rights and verifying eligibility.

**Context**: Users are often in vulnerable positions—seeking help during economic hardship, navigating unfamiliar bureaucracy, managing stress. The interface must reduce cognitive load, not add to it. Mobile-first, potentially low bandwidth, may be used on older devices.

## Product Purpose

BantuArah helps Indonesian citizens understand and access their social assistance rights using AI-powered tools. The platform removes barriers between citizens and government programs by:
- Translating complex eligibility criteria into plain Indonesian
- Automating document generation to reduce bureaucratic friction  
- Verifying information to combat misinformation about social assistance
- Connecting communities for mutual aid

Success looks like: citizens discovering programs they qualify for but didn't know existed; documents generated correctly on first try; reduced time from need to benefit access; increased trust in legitimate social assistance information.

## Brand Personality

**Trusted guide. Clear path. Steady support.**

- **Trust and reliability**: Government-adjacent credibility without feeling cold or bureaucratic
- **Empowerment and dignity**: This is about rights, not charity. Citizens accessing what they're entitled to
- **Clarity and calm**: Cutting through complexity and stress with plain language and predictable patterns

The tone is a knowledgeable neighbor who's helped others navigate this before—warm, patient, matter-of-fact. Not talking down, not over-explaining, just showing the way.

## Anti-references

**Do NOT:**
- Generic SaaS dashboard aesthetic (cold blues, sharp corners, data-for-data's-sake)
- Overcomplicated government portal (walls of text, confusing navigation, jargon overload)
- Charity/pity-focused design (sad imagery, guilt-tripping, condescension)
- Silicon Valley hype (aggressive CTAs, gamification for serious needs, growth-at-all-costs energy)

**DO maintain:**
- A touch of modern startup clarity (clean, intentional, well-crafted) without the typical SaaS coldness
- Warmth through color (Claude's warm oranges, soft design, safety) not through infantilizing the interface

## Design Principles

1. **Literacy for all**: Use clear, plain Indonesian. Visual hierarchy carries meaning even before reading. Icons and color reinforce text, never replace it. Short sentences, active voice.

2. **Dignity in every interaction**: Citizens are accessing rights, not asking for favors. Language and UI patterns should reinforce this. No apologetic copy, no "please understand," no hoops that feel like tests.

3. **Reduce, don't relocate cognitive load**: Complexity is inherent to government programs; our job is to absorb it, not pass it to users. One decision at a time. Progressive disclosure. Clear next steps always visible.

4. **Trust through transparency**: Show how the AI reaches conclusions. Surface sources. Make it clear when we're confident vs. when users should verify. Uncertainty is communicated, not hidden.

5. **Practice what we enable**: If we're helping citizens navigate bureaucracy, our own interface can't be bureaucratic. If we're automating documents, our forms can't be painful to fill out. The tool should feel like the world we want government services to be.

## Accessibility & Inclusion

- **WCAG 2.1 AA compliance** minimum (government accessibility standard)
- **Indonesian language throughout**: All UI, content, error messages, documentation in clear Bahasa Indonesia
- **Low-literacy design patterns**: 
  - Visual hierarchy before text density
  - Icons + labels (never icons alone)
  - Simplified navigation (max 2-3 levels deep)
  - Form fields with examples, not just placeholders
  - Progress indicators for multi-step processes
- **Device & bandwidth considerations**:
  - Mobile-first responsive design
  - Support for Android devices 3-5 years old
  - Graceful degradation on slow connections
  - Minimal external dependencies
- **Reduced motion support**: All animations respect `prefers-reduced-motion`
- **Color contrast**: Minimum 4.5:1 for body text, 3:1 for large text
- **Screen reader compatibility**: Semantic HTML, proper ARIA labels for interactive elements
