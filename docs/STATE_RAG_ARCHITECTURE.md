# State-Specific RAG Architecture
## Retrieval-Augmented Generation for PA Compliance Intelligence

**Version:** 1.0
**Date:** December 1, 2025
**Purpose:** Each state gets its own dedicated RAG knowledge base for accurate, state-specific compliance intelligence

---

## 🎯 Why Each State Needs Its Own RAG

### The Problem with Shared RAG

If we use a **single RAG system** for all 50 states + territories:
- ❌ **Query confusion:** "What's the fee cap?" → Returns FL, TX, TN, IL results mixed together
- ❌ **Semantic bleed:** Texas and Tennessee both have 10% caps but different exceptions
- ❌ **Context pollution:** Louisiana hourly-only rules contaminate percentage fee queries
- ❌ **Slow retrieval:** Must search 50+ state databases for every query
- ❌ **Poor ranking:** Irrelevant states appear in top results

### The Solution: State-Isolated RAG

With **state-specific RAG systems**:
- ✅ **Query precision:** "What's the fee cap?" in Florida RAG → Only FL results
- ✅ **Semantic clarity:** Each state's context is isolated and pure
- ✅ **Fast retrieval:** Only search ONE state's knowledge base
- ✅ **Perfect ranking:** All results are relevant to the target state
- ✅ **Easy updates:** Modify Florida RAG without affecting Texas

---

## 🏗️ Architecture Overview

```
compliance-and-legal-hub/
├── rag/
│   ├── states/
│   │   ├── FL/
│   │   │   ├── vector_store/         # Florida embeddings
│   │   │   ├── documents/            # Florida statutes, DOI docs
│   │   │   ├── metadata.json         # FL-specific metadata
│   │   │   └── config.json           # FL RAG configuration
│   │   ├── TX/
│   │   │   ├── vector_store/
│   │   │   ├── documents/
│   │   │   ├── metadata.json
│   │   │   └── config.json
│   │   ├── LA/
│   │   ├── NY/
│   │   ├── CA/
│   │   ├── PR/                       # Puerto Rico (Spanish docs)
│   │   ├── VI/                       # US Virgin Islands
│   │   └── ...                       # All 50 states + territories
│   ├── shared/
│   │   ├── embeddings_model/         # Shared embedding model
│   │   └── prompts/                  # Shared system prompts
│   └── engine/
│       ├── StateRAG.ts               # State-specific RAG class
│       ├── RAGOrchestrator.ts        # Routes queries to correct state RAG
│       └── VectorStore.ts            # Vector database interface
```

---

## 📦 State RAG Structure

Each state RAG contains:

### 1. Vector Store (Embeddings)
- **Technology:** Pinecone, Weaviate, or ChromaDB
- **Namespace:** `state_${stateCode}` (e.g., `state_FL`, `state_TX`)
- **Embeddings:** Text chunks converted to vectors for semantic search
- **Metadata:** Attached to each chunk for filtering

### 2. Document Store (Source Documents)
```
FL/documents/
├── statutes/
│   ├── florida_statute_626.854_fee_cap.pdf
│   ├── florida_statute_626.865_bonding.pdf
│   └── florida_statute_626.869_licensing.pdf
├── regulations/
│   ├── florida_admin_code_69B-220.pdf
│   └── florida_dfs_rules.pdf
├── bulletins/
│   ├── bulletin_2022_hurricane_restrictions.pdf
│   └── bulletin_2023_fee_enforcement.pdf
├── forms/
│   ├── pa_license_application.pdf
│   └── firm_license_application.pdf
└── case_law/
    ├── smith_v_xyz_insurance.pdf
    └── doe_v_abc_carrier.pdf
```

### 3. Metadata Configuration
```json
{
  "stateCode": "FL",
  "stateName": "Florida",
  "ragVersion": "1.0.0",
  "lastUpdated": "2025-12-01",
  "documentCount": 127,
  "chunkCount": 4521,
  "doiUrl": "https://www.myfloridacfo.com/division/agents",
  "doiPhone": "(850) 413-3089",
  "primaryStatutes": [
    "F.S. Chapter 626 - Insurance Agents and Adjusters"
  ],
  "keyTopics": [
    "licensing",
    "fee_caps",
    "emergency_restrictions",
    "bonding",
    "continuing_education"
  ],
  "enforcementRules": {
    "feeCapStandard": 0.20,
    "feeCapEmergency": 0.10,
    "solicitationWindow": "08:00-20:00"
  }
}
```

### 4. RAG Configuration
```json
{
  "embeddingModel": "text-embedding-ada-002",
  "chunkSize": 512,
  "chunkOverlap": 50,
  "topK": 5,
  "temperature": 0.1,
  "systemPrompt": "You are a Florida PA compliance expert...",
  "retrievalFilters": {
    "confidenceLevel": ["HIGH", "MEDIUM"],
    "documentType": ["statute", "regulation", "bulletin"]
  }
}
```

---

## 🔍 Query Flow

### User Query: "What's the fee cap in Florida?"

1. **Route to State RAG**
   ```typescript
   const stateCode = detectState(query); // "FL"
   const rag = RAGOrchestrator.getStateRAG(stateCode);
   ```

2. **Generate Query Embedding**
   ```typescript
   const queryEmbedding = await embeddings.embed(query);
   ```

3. **Retrieve Relevant Chunks (Florida ONLY)**
   ```typescript
   const chunks = await rag.retrieve(queryEmbedding, {
     topK: 5,
     namespace: "state_FL",
     filter: { category: "fee_cap" }
   });
   ```

4. **Retrieved Chunks (Example)**
   ```
   [
     {
       text: "Florida Statute 626.854 limits public adjuster fees to 10% for claims arising from emergency declarations...",
       metadata: {
         source: "F.S. 626.854",
         url: "https://...",
         verified: "2025-01-15",
         confidence: "HIGH"
       },
       score: 0.94
     },
     {
       text: "Prior to December 16, 2022, Florida allowed up to 20% fees. SB 2A reformed the cap to 10% for all claims...",
       metadata: {
         source: "FL DFS Bulletin 22-07",
         verified: "2025-01-15",
         confidence: "HIGH"
       },
       score: 0.89
     }
   ]
   ```

5. **Generate Response with Sources**
   ```typescript
   const response = await llm.generate({
     systemPrompt: FLORIDA_SYSTEM_PROMPT,
     context: chunks,
     query: query,
     sources: true
   });
   ```

6. **AI Response**
   ```
   ## Florida Fee Cap: 10% (No Exceptions)

   Florida limits public adjuster fees to **10% of the total claim recovery**
   with **no exceptions**. This applies to:
   - All residential claims
   - All commercial claims
   - Emergency declarations
   - Hurricane claims
   - Standard (non-emergency) claims

   **Legal Basis:**
   - Florida Statute 626.854 (Effective December 16, 2022)
   - Senate Bill 2A (2022 Special Session)

   **Prior Law:**
   Before December 16, 2022, Florida allowed up to 20% fees for standard claims
   and 10% for emergency claims. The 2022 reform eliminated this distinction.

   **Consequences of Violation:**
   - License discipline (suspension or revocation)
   - Fee forfeiture (must refund excess fees)
   - Administrative fines up to $5,000 per violation
   - Criminal penalties for willful violations

   ### SOURCES
   - Florida Statute 626.854
     https://www.leg.state.fl.us/statutes/...
     Last Verified: January 15, 2025
     Confidence Level: HIGH

   - Florida DFS Bulletin 22-07
     https://www.myfloridacfo.com/...
     Last Verified: January 15, 2025
     Confidence Level: HIGH

   **Florida Department of Financial Services**
   Phone: (850) 413-3089
   Website: https://www.myfloridacfo.com/division/agents
   ```

---

## 🗂️ Document Chunking Strategy

### Chunking by Legal Unit

Instead of arbitrary 512-character chunks, chunk by **legal meaning**:

#### ✅ GOOD - Semantic Chunking
```json
{
  "chunk_id": "FL-FEE-CAP-001",
  "text": "626.854 Fee limitations.—A public adjuster may not charge, agree to, or accept as compensation or reimbursement any payment, commission, fee, or other thing of value equal to more than 10 percent of the amount of an insurance settlement. [Full statute text...]",
  "metadata": {
    "stateCode": "FL",
    "statute": "F.S. 626.854",
    "topic": "fee_cap",
    "effective_date": "2022-12-16",
    "confidence": "HIGH",
    "verified": "2025-01-15"
  }
}
```

#### ❌ BAD - Arbitrary Chunking
```json
{
  "chunk_id": "FL-RANDOM-047",
  "text": "...te or reimbursement any payment, commission, fee, or other thing of value equal to more than 10 percent of the amount...",
  "metadata": {
    "stateCode": "FL"
  }
}
```

### Chunk Hierarchy

1. **Statute Chunks** (Confidence: HIGH)
   - Direct statute text
   - Official statute number
   - Full legal citation

2. **Regulation Chunks** (Confidence: HIGH)
   - Administrative code
   - DOI rules
   - Official regulations

3. **Bulletin Chunks** (Confidence: MEDIUM)
   - DOI bulletins
   - Guidance documents
   - Interpretive memos

4. **Application Chunks** (Confidence: MEDIUM)
   - License application forms
   - Required disclosures
   - Filing requirements

5. **Case Law Chunks** (Confidence: MEDIUM)
   - Court decisions
   - Administrative rulings
   - Precedent cases

---

## 🌐 Multi-State Queries

### Scenario: "Compare fee caps in Florida and Texas"

```typescript
// RAGOrchestrator handles multi-state queries
const response = await RAGOrchestrator.compareStates({
  states: ["FL", "TX"],
  topic: "fee_cap",
  query: "What are the fee caps?"
});
```

**Process:**
1. Query FL RAG → "Florida: 10% no exceptions"
2. Query TX RAG → "Texas: 10% statutory cap"
3. Synthesize comparison response

**Response:**
```
## Fee Cap Comparison: Florida vs Texas

| Aspect | Florida (FL) | Texas (TX) |
|--------|--------------|------------|
| **Maximum Fee** | 10% | 10% |
| **Statutory Authority** | F.S. 626.854 | TIC § 4102.051 |
| **Exceptions** | None | None |
| **Effective Date** | Dec 16, 2022 | [TX Date] |
| **Emergency Provisions** | No emergency exception | 72-hour solicitation ban |

### Florida Details
[FL-specific information from FL RAG...]

### Texas Details
[TX-specific information from TX RAG...]

### SOURCES
**Florida:**
- F.S. 626.854
  https://...
  Verified: 2025-01-15
  Confidence: HIGH

**Texas:**
- TIC § 4102.051
  https://...
  Verified: 2025-01-15
  Confidence: HIGH
```

---

## 🔧 Implementation: StateRAG Class

```typescript
export class StateRAG {
  private stateCode: string;
  private vectorStore: VectorStore;
  private embeddings: Embeddings;
  private llm: LLM;
  private metadata: StateMetadata;

  constructor(stateCode: string) {
    this.stateCode = stateCode;
    this.vectorStore = new VectorStore({
      namespace: `state_${stateCode}`,
      collectionName: `compliance_${stateCode}`
    });
    this.embeddings = new OpenAIEmbeddings();
    this.llm = new ChatOpenAI({ temperature: 0.1 });
    this.metadata = loadStateMetadata(stateCode);
  }

  async query(query: string, options?: QueryOptions): Promise<StateRAGResponse> {
    // 1. Generate query embedding
    const queryEmbedding = await this.embeddings.embed(query);

    // 2. Retrieve relevant chunks (state-specific)
    const chunks = await this.vectorStore.similaritySearch(queryEmbedding, {
      topK: options?.topK || 5,
      filter: {
        stateCode: this.stateCode,
        confidenceLevel: { $in: ['HIGH', 'MEDIUM'] }
      }
    });

    // 3. Build context from chunks
    const context = this.buildContext(chunks);

    // 4. Generate response with state-specific prompt
    const systemPrompt = this.getStateSystemPrompt();
    const response = await this.llm.generate({
      systemPrompt,
      context,
      query
    });

    // 5. Extract and format sources
    const sources = this.extractSources(chunks);

    return {
      answer: response,
      sources,
      stateCode: this.stateCode,
      confidence: this.calculateConfidence(chunks),
      verifiedDate: this.metadata.lastUpdated
    };
  }

  private getStateSystemPrompt(): string {
    return `
You are a ${this.metadata.stateName} public adjuster compliance expert.

Your knowledge is sourced exclusively from official ${this.metadata.stateName} Department of Insurance documents, statutes, regulations, and bulletins.

CORE INSTRUCTIONS:
1. ALWAYS cite ${this.metadata.stateName} statutes and regulations
2. ALWAYS include DOI source URLs
3. ALWAYS provide verification dates
4. ALWAYS assign confidence levels (HIGH/MEDIUM/LOW)
5. NEVER provide information about other states unless explicitly compared
6. NEVER guess or infer - if unsure, recommend contacting ${this.metadata.stateName} DOI

${this.metadata.stateName} Department of Insurance
Phone: ${this.metadata.doiPhone}
Website: ${this.metadata.doiUrl}

When enforcement rules apply, clearly state:
- Violation type (BLOCK_ACTION, WARN_BLOCK, etc.)
- Legal consequences
- Recommended alternative actions
`;
  }

  private buildContext(chunks: RetrievedChunk[]): string {
    return chunks.map((chunk, idx) => `
[DOCUMENT ${idx + 1}]
Source: ${chunk.metadata.source}
Confidence: ${chunk.metadata.confidence}
Verified: ${chunk.metadata.verified}

${chunk.text}
---
`).join('\n');
  }

  private extractSources(chunks: RetrievedChunk[]): SourceCitation[] {
    return chunks.map(chunk => ({
      citation: chunk.metadata.source,
      url: chunk.metadata.url,
      verifiedDate: chunk.metadata.verified,
      confidenceLevel: chunk.metadata.confidence,
      documentType: chunk.metadata.documentType
    }));
  }

  private calculateConfidence(chunks: RetrievedChunk[]): 'HIGH' | 'MEDIUM' | 'LOW' {
    const avgScore = chunks.reduce((sum, c) => sum + c.score, 0) / chunks.length;
    const hasHighConfidenceSources = chunks.some(c => c.metadata.confidence === 'HIGH');

    if (avgScore > 0.85 && hasHighConfidenceSources) return 'HIGH';
    if (avgScore > 0.70) return 'MEDIUM';
    return 'LOW';
  }
}
```

---

## 🔀 RAG Orchestrator

```typescript
export class RAGOrchestrator {
  private static stateRAGs: Map<string, StateRAG> = new Map();

  static getStateRAG(stateCode: string): StateRAG {
    if (!this.stateRAGs.has(stateCode)) {
      this.stateRAGs.set(stateCode, new StateRAG(stateCode));
    }
    return this.stateRAGs.get(stateCode)!;
  }

  static async query(stateCode: string, query: string): Promise<StateRAGResponse> {
    const rag = this.getStateRAG(stateCode);
    return await rag.query(query);
  }

  static async compareStates(options: CompareStatesOptions): Promise<ComparisonResponse> {
    const { states, topic, query } = options;

    // Query each state RAG in parallel
    const responses = await Promise.all(
      states.map(stateCode => this.query(stateCode, query))
    );

    // Synthesize comparison
    return this.synthesizeComparison(states, responses, topic);
  }

  private static async synthesizeComparison(
    states: string[],
    responses: StateRAGResponse[],
    topic: string
  ): Promise<ComparisonResponse> {
    // Build comparison table, side-by-side analysis
    // ...
  }
}
```

---

## 🌍 Territory-Specific Considerations

### Puerto Rico (PR)
```json
{
  "stateCode": "PR",
  "primaryLanguage": "Spanish",
  "secondaryLanguage": "English",
  "documentStrategy": "bilingual_priority",
  "specialRequirements": [
    "All consumer contracts must be in Spanish",
    "Spanish fluency essential for compliance",
    "OCS (Oficina del Comisionado de Seguros) unique regulatory structure"
  ],
  "ragConfig": {
    "spanishDocuments": true,
    "bilingualEmbeddings": true,
    "translationRequired": false
  }
}
```

### US Virgin Islands (VI)
```json
{
  "stateCode": "VI",
  "territoryNotes": [
    "Very small regulatory office",
    "Limited online resources",
    "Relationship-based licensing environment",
    "In-person visits to St. Thomas recommended"
  ],
  "documentCoverage": "limited",
  "ragConfig": {
    "fallbackToGeneralKnowledge": true,
    "warningForLimitedData": true
  }
}
```

---

## 📊 State RAG Performance Metrics

Track per-state RAG performance:

```typescript
interface StateRAGMetrics {
  stateCode: string;
  queriesProcessed: number;
  avgResponseTime: number;
  avgConfidenceScore: number;
  documentCount: number;
  chunkCount: number;
  lastUpdated: Date;
  staleDocs: number; // Docs >6 months old
  userFeedbackScore: number; // 1-5 stars
  accuracyRate: number; // % of responses verified accurate
}
```

**Monitor:**
- States with low confidence scores → Need more/better documents
- States with stale docs → Trigger DOI verification workflow
- States with low accuracy → Human review required

---

## 🔄 Document Update Workflow

### Automatic Updates
1. **DOI Website Monitoring**
   - Crawler checks state DOI sites weekly
   - Detects new bulletins, regulations, forms
   - Auto-downloads and processes new docs

2. **Legislative Session Tracking**
   - Monitor state legislative calendars
   - Flag new bills affecting PA compliance
   - Queue for human review and RAG update

3. **Disaster Declarations**
   - Monitor FEMA declarations
   - Auto-flag states with active disasters
   - Update enforcement rules (72hr bans, etc.)

### Manual Updates
1. Compliance officer reviews new document
2. Verifies accuracy with DOI source
3. Chunks document semantically
4. Generates embeddings
5. Uploads to state RAG
6. Updates metadata (verifiedDate, confidence)
7. Notifies team of changes

---

## 🚀 Deployment Strategy

### Phase 1: Priority States (Weeks 1-4)
- FL, TX, LA, CA, NY, NC, GA, SC, IL, TN
- These are Coastal's primary markets
- Full RAG implementation with comprehensive docs

### Phase 2: Secondary States (Weeks 5-8)
- AZ, CO, CT, DE, IN, KY, MD, MS, OK, VA, WA
- Moderate document coverage
- Basic RAG with key statutes and regulations

### Phase 3: Remaining States (Weeks 9-12)
- All other states + territories (PR, VI)
- Minimum viable RAG
- Fallback to general knowledge with warnings

### Phase 4: Continuous Improvement (Ongoing)
- Add case law
- Expand bulletin coverage
- Improve chunking strategies
- Fine-tune retrieval parameters

---

## 💡 Benefits Summary

### Accuracy
- ✅ State-specific context eliminates cross-contamination
- ✅ Only relevant documents retrieved
- ✅ Higher confidence scores

### Performance
- ✅ Faster queries (search 1 state vs 50)
- ✅ Better ranking (all results relevant)
- ✅ Lower costs (fewer embeddings to search)

### Maintainability
- ✅ Update one state without affecting others
- ✅ Easy to add new states
- ✅ Clear ownership per state

### User Experience
- ✅ More precise answers
- ✅ Better source attribution
- ✅ State-specific recommendations

---

## 🎓 Example: Full State RAG Query

**User:** "Can I charge 15% fee in Florida for a hurricane claim?"

**System:**
```typescript
const rag = RAGOrchestrator.getStateRAG('FL');
const response = await rag.query("Can I charge 15% fee for a hurricane claim?");
```

**AI Response:**
```
⛔ FEE CAP VIOLATION

No, you CANNOT charge a 15% fee in Florida for any claim, including hurricane claims.

## Florida Fee Cap: 10% (No Exceptions)

Florida Statute 626.854 limits public adjuster fees to **10% of the total claim recovery**.
This cap applies to:
- ✅ Hurricane claims
- ✅ Flood claims
- ✅ Fire claims
- ✅ All residential claims
- ✅ All commercial claims
- ✅ Emergency declarations

**There are NO exceptions to the 10% cap.**

### Prior Law (Before Dec 16, 2022)
Before the 2022 reform, Florida allowed:
- 20% for standard claims
- 10% for emergency/disaster claims

Senate Bill 2A (2022 Special Session) eliminated this distinction and set a uniform 10% cap.

### Consequences of Charging 15%
- ❌ License discipline (suspension or revocation)
- ❌ Fee forfeiture (must refund 5% excess)
- ❌ Administrative fines up to $5,000
- ❌ Criminal penalties for willful violations

### Recommended Action
Revise your fee to 10% or less to comply with Florida law.

### SOURCES & VERIFICATION

**Primary Sources:**
- Florida Statute 626.854
  https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0600-0699/0626/0626.html
  Section: 626.854 Fee limitations

- Senate Bill 2A (2022 Special Session)
  Effective Date: December 16, 2022
  https://www.flsenate.gov/Session/Bill/2022D/2A

**Last Verified:** January 15, 2025
**Confidence Level:** HIGH

**Verification Contact:**
Florida Department of Financial Services
Division of Agent and Agency Services
Phone: (850) 413-3089
Website: https://www.myfloridacfo.com/division/agents
```

---

**Next Steps:**
1. Build vector store infrastructure (Pinecone/Weaviate)
2. Implement StateRAG class
3. Implement RAGOrchestrator
4. Start with Phase 1 states (FL, TX, LA, CA, NY)
5. Develop document processing pipeline
6. Deploy state-specific AI assistants

---

*This architecture ensures each state gets accurate, isolated, fast compliance intelligence powered by official DOI sources.*
