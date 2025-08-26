# Requirements Document

## Introduction

The Token Compressor is an AI agent laboratory designed to discover and validate text compression patterns that reduce AI API costs. The system employs three collaborative AI agents working in continuous discovery cycles to identify token-efficient compression techniques. Phase 1 focuses on building a discovery lab website that facilitates agent collaboration, human participation, and real-time validation of compression discoveries.

The current implementation exists as a single 1,528-line HTML file that requires refactoring into a modular, scalable architecture with proper separation of concerns, API security, and database persistence.

## Requirements

### Requirement 1: Multi-Agent Collaboration System

**User Story:** As a researcher studying token compression, I want three AI agents to work together autonomously so that diverse compression patterns can be discovered through collaborative intelligence.

#### Acceptance Criteria

1. WHEN the system starts THEN three distinct AI agents SHALL be initialized with specific roles
2. WHEN Agent 1 (DeepSeek) activates THEN it SHALL perform web searches and detect token waste patterns
3. WHEN Agent 2 (Groq) receives token waste data THEN it SHALL generate creative compression inventions
4. WHEN Testing Agent (DeepSeek) receives compression proposals THEN it SHALL validate reversibility and accuracy
5. WHEN agents communicate THEN their conversations SHALL be limited to 10 turns per 30-second cycle
6. WHEN an agent fails to respond within timeout THEN the system SHALL log the failure and continue with remaining agents

### Requirement 2: Continuous Discovery Process

**User Story:** As a system operator, I want agents to run continuous 30-second discovery cycles for 55 minutes so that maximum compression patterns can be discovered before validation.

#### Acceptance Criteria

1. WHEN discovery mode starts THEN agents SHALL execute 30-second cycles continuously for 55 minutes
2. WHEN each cycle begins THEN Agent 1 SHALL search for new token waste patterns
3. WHEN Agent 2 receives search results THEN it SHALL propose compression techniques within the cycle timeframe
4. WHEN Testing Agent receives proposals THEN it SHALL validate and score compressions before cycle end
5. WHEN 55 minutes elapse THEN the system SHALL automatically transition to testing ceremony
6. WHEN discovery cycles complete THEN all validated compressions SHALL be queued for final testing

### Requirement 3: Hourly Testing Ceremony

**User Story:** As a quality assurance process, I want a dedicated 5-minute testing ceremony every hour so that only verified compressions are added to the permanent codex.

#### Acceptance Criteria

1. WHEN testing ceremony begins (minute 55-60) THEN all agent discovery SHALL pause
2. WHEN ceremony starts THEN Testing Agent SHALL re-validate all queued compressions
3. WHEN validation completes THEN verified compressions SHALL be added to the permanent codex
4. WHEN codex updates THEN the Twitter bot SHALL tweet the best new discovery
5. WHEN ceremony ends THEN discovery cycles SHALL resume automatically
6. WHEN ceremony fails THEN the system SHALL log errors and resume discovery without codex updates

### Requirement 4: Brave Search Integration

**User Story:** As Agent 1, I want to search the web for token compression research so that I can identify current inefficiencies and opportunities.

#### Acceptance Criteria

1. WHEN Agent 1 needs search data THEN it SHALL call Brave Search API through secure backend route
2. WHEN search requests are made THEN API keys SHALL be hidden from frontend code
3. WHEN search results return THEN they SHALL be processed for token waste patterns
4. WHEN API limits are reached THEN the system SHALL queue searches and retry appropriately
5. WHEN search fails THEN Agent 1 SHALL use cached results or skip the current cycle

### Requirement 5: Token Counting Accuracy

**User Story:** As a compression validator, I want precise token counting using tiktoken so that compression efficiency can be accurately measured.

#### Acceptance Criteria

1. WHEN text is submitted for compression THEN tiktoken SHALL count tokens using the appropriate model encoding
2. WHEN compression is applied THEN both original and compressed token counts SHALL be calculated
3. WHEN efficiency is calculated THEN it SHALL be expressed as percentage reduction
4. WHEN token counts differ between measurements THEN the system SHALL use the most recent count
5. WHEN tiktoken fails THEN the system SHALL fallback to character-based estimation with appropriate warnings

### Requirement 6: Secure API Architecture

**User Story:** As a security-conscious developer, I want API keys hidden from the frontend so that credentials remain protected in production.

#### Acceptance Criteria

1. WHEN frontend needs AI services THEN it SHALL call Vercel API routes instead of direct API calls
2. WHEN API routes execute THEN they SHALL authenticate using server-side environment variables
3. WHEN responses return THEN they SHALL contain only necessary data without exposing keys
4. WHEN unauthorized requests occur THEN API routes SHALL return 401 status codes
5. WHEN rate limits are exceeded THEN API routes SHALL implement proper backoff strategies

### Requirement 7: Supabase Database Integration

**User Story:** As a data persistence layer, I want compression discoveries stored in Supabase so that historical data and leaderboards can be maintained.

#### Acceptance Criteria

1. WHEN compressions are validated THEN they SHALL be stored in Supabase with metadata
2. WHEN leaderboard is requested THEN data SHALL be retrieved from Supabase ordered by efficiency
3. WHEN human submissions occur THEN they SHALL be stored alongside agent discoveries
4. WHEN database operations fail THEN the system SHALL continue operating with local storage fallback
5. WHEN data conflicts occur THEN the most recent valid entry SHALL take precedence

### Requirement 8: Real-time Agent Chat Interface

**User Story:** As a user observing the lab, I want to see live agent conversations so that I can understand the discovery process.

#### Acceptance Criteria

1. WHEN agents communicate THEN messages SHALL appear in real-time chat windows
2. WHEN chat windows overflow THEN older messages SHALL scroll out of view
3. WHEN agent identities are displayed THEN they SHALL be visually distinct (colors, avatars)
4. WHEN conversations exceed 10 turns THEN the system SHALL indicate cycle completion
5. WHEN agents are idle THEN chat windows SHALL show waiting states

### Requirement 9: GameBoy Aesthetic Design

**User Story:** As a user experiencing the interface, I want a retro GameBoy aesthetic so that the lab feels engaging and nostalgic.

#### Acceptance Criteria

1. WHEN the interface loads THEN it SHALL use VT323 monospace font throughout
2. WHEN color schemes are applied THEN they SHALL use earth tones (greens, browns, beiges)
3. WHEN UI elements render THEN they SHALL have pixelated, retro gaming appearance
4. WHEN animations occur THEN they SHALL be minimal and reminiscent of classic handheld games
5. WHEN responsive design activates THEN the aesthetic SHALL remain consistent across screen sizes

### Requirement 10: Human Participation System

**User Story:** As a human researcher, I want to submit my own compression discoveries so that I can compete with AI agents on the leaderboard.

#### Acceptance Criteria

1. WHEN humans access submission form THEN they SHALL be able to input original text and compression
2. WHEN submissions are made THEN they SHALL be validated for reversibility automatically
3. WHEN human compressions are validated THEN they SHALL be added to the same leaderboard as agent discoveries
4. WHEN submissions fail validation THEN clear error messages SHALL explain the failure
5. WHEN successful submissions occur THEN users SHALL receive confirmation and efficiency scores

### Requirement 11: Leaderboard and Discovery Display

**User Story:** As a competitive participant, I want to see ranked compression discoveries so that I can track performance and learn from top techniques.

#### Acceptance Criteria

1. WHEN leaderboard loads THEN compressions SHALL be ranked by efficiency percentage
2. WHEN discoveries are displayed THEN they SHALL show original text, compression, efficiency, and creator
3. WHEN partial disclosure is enabled THEN some agent discoveries SHALL be partially hidden
4. WHEN users request details THEN they SHALL be able to view full compression techniques
5. WHEN leaderboard updates THEN new entries SHALL be highlighted temporarily

### Requirement 12: Twitter Bot Integration

**User Story:** As a social media manager, I want automated hourly tweets about discoveries so that the project gains visibility and engagement.

#### Acceptance Criteria

1. WHEN testing ceremony completes THEN Twitter bot SHALL identify the best new discovery
2. WHEN tweets are composed THEN they SHALL include compression efficiency and teaser text
3. WHEN Twitter API is called THEN it SHALL use secure backend authentication
4. WHEN tweet posting fails THEN the system SHALL log the error and continue operating
5. WHEN no new discoveries exist THEN the bot SHALL tweet motivational or educational content

### Requirement 13: Modular Architecture Refactoring

**User Story:** As a developer maintaining the codebase, I want the monolithic HTML file split into modular components so that the system is maintainable and scalable.

#### Acceptance Criteria

1. WHEN refactoring occurs THEN HTML structure SHALL be separated into logical component files
2. WHEN CSS is extracted THEN styles SHALL be organized by component and feature
3. WHEN JavaScript is modularized THEN functions SHALL be grouped by responsibility
4. WHEN API routes are created THEN they SHALL handle specific backend operations
5. WHEN file structure is complete THEN the system SHALL maintain all existing functionality
6. WHEN deployment occurs THEN the modular structure SHALL work seamlessly on Vercel

### Requirement 14: Error Handling and Monitoring

**User Story:** As a system administrator, I want comprehensive error handling and monitoring so that issues can be identified and resolved quickly.

#### Acceptance Criteria

1. WHEN errors occur THEN they SHALL be logged with timestamps and context
2. WHEN API failures happen THEN the system SHALL continue operating with degraded functionality
3. WHEN database connections fail THEN local storage SHALL serve as temporary backup
4. WHEN agent communication fails THEN remaining agents SHALL continue their cycles
5. WHEN critical errors occur THEN appropriate alerts SHALL be generated for monitoring