# Compliance & Legal Hub

## 🎯 Unified System - Consolidation of 3 Repositories

This repository is the **unified Compliance & Legal Hub** that consolidates three separate systems into one comprehensive solution:

- ✅ ftdcad/legal-and-compliance-3
- ✅ ftdcad/compliance-legal-2 (now archived)
- ✅ ftdcad/ai-state-compliance (now archived)

---

## 🚀 What's Inside

### Backend Infrastructure
- **MongoDB/NoSQL Database** (Supabase removed)
- **Express.js API** with full CRUD operations
- **JWT Authentication** middleware
- **8 MongoDB Models:**
  - ComplianceRule
  - ComplianceTemplate
  - ComplianceAlert
  - ComplianceState
  - ComplianceChatHistory
  - License
  - Bond
  - User

- **4 API Routes:**
  - `/api/compliance` - Rules, templates, alerts, states, chat, stats
  - `/api/licenses` - Employee license tracking
  - `/api/bonds` - Employee bond tracking
  - `/api/auth` - JWT authentication

### Frontend - ComplianceLegalHub Component

**Employee Compliance View:**
- Track adjuster licenses by state and employee
- Track bonds by state and employee
- Expiration status tracking with color-coding:
  - 🟢 Active (90+ days remaining)
  - 🟡 Expiring Soon (≤30 days)
  - 🔴 Expired
- Group licenses/bonds by employee
- State filtering dropdown

**Additional Features:**
- Company Compliance View (corporate tracking)
- Dashboard with compliance metrics
- State browsing functionality
- Search rules interface
- Compare states feature
- Coastal Admin panel for managing rules, templates, and settings

**UI/UX:**
- Dark mode compatible
- Radix UI components
- Color-coded expiration status indicators
- State filtering dropdowns
- Responsive design

---

## 📦 Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + MongoDB
- **UI Library:** shadcn-ui + Radix UI
- **Styling:** Tailwind CSS
- **Authentication:** JWT
- **Database:** MongoDB (NoSQL)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- MongoDB running locally or connection to MongoDB Atlas

### Installation

```sh
# Clone the repository
git clone https://github.com/Coastal-Claims-Services/compliance-and-legal-hub.git

# Navigate to the project directory
cd compliance-and-legal-hub

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### Environment Variables

Create a `.env` file in the `server/` directory:

```env
PORT=4000
MONGO_URI=mongodb://localhost:27017/legal-compliance-3
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Running the Application

```sh
# Run both frontend and backend concurrently
npm run dev:fullstack

# Or run them separately:
# Terminal 1 - Frontend (port 5173)
npm run dev

# Terminal 2 - Backend (port 4000)
cd server && npm run dev
```

---

## 📝 Integration with Employee Portal

See [INTEGRATION_REQUEST.md](./INTEGRATION_REQUEST.md) for detailed instructions on integrating this hub into the CCS Employee Portal.

**Quick Summary for Talha:**
1. Copy `src/pages/ComplianceLegalHub.tsx` to employee portal
2. Add "Compliance & Legal Hub" tab to navigation
3. Add route in AdminRouter
4. Ensure backend routes are registered
5. Test the integration

---

## 📂 Project Structure

```
compliance-and-legal-hub/
├── server/
│   ├── src/
│   │   ├── config/          # Database & AWS config
│   │   ├── middleware/      # JWT auth middleware
│   │   ├── models/          # MongoDB models (8 total)
│   │   ├── routes/          # API routes (4 total)
│   │   └── index.ts         # Main server file
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── pages/
│   │   └── ComplianceLegalHub.tsx  # Main hub component
│   ├── components/
│   └── ...
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🔗 Related Repositories

**Archived Repositories (DO NOT USE):**
- [compliance-legal-2](https://github.com/Coastal-Claims-Services/compliance-legal-2) - Archived
- [ai-state-compliance](https://github.com/ftdcad/ai-state-compliance) - Archived

---

## 📄 License

Private - Coastal Claims Services

---

## 🤝 Contributing

For questions or issues, please contact the development team.

---

## 🤖 AI Intelligence System

### Core Instructions - December 1, 2025

The Compliance & Legal Hub now includes **AI-powered compliance intelligence** with strict accuracy and verification standards.

**Key Features:**
- **DOI-First Approach:** All compliance information sourced from official Department of Insurance sources
- **Mandatory Source Attribution:** Every statement includes statute citations, URLs, and verification dates
- **Confidence Scoring:** HIGH/MEDIUM/LOW confidence levels for all data
- **50 States + Territories:** Coverage includes Puerto Rico and US Virgin Islands

**Documentation:**
- [AI Core Instructions](./docs/AI_CORE_INSTRUCTIONS.md) - Comprehensive AI system guidelines
- [State Compliance Rules](./docs/STATE_COMPLIANCE_RULES.json) - Programmatic enforcement logic
- State-by-state compliance intelligence
- Licensing requirements and market analysis
- Fee regulations and AOB laws
- Critical state restrictions and violations

**Core Principles:**

1. **Department of Insurance as Primary Source**
   - ALWAYS reference official state DOI sources
   - NEVER rely solely on general AI knowledge
   - VERIFY all compliance statements with current statutes

2. **Source Attribution Requirements**
   - Cite specific statutes and regulation numbers
   - Include direct URLs to official sources
   - Provide verification dates and confidence levels
   - Warn when information may be outdated

**Example State DOI Sources:**
- Florida: [Florida DFS](https://www.myfloridacfo.com/division/agents)
- Texas: [Texas TDI](https://www.tdi.texas.gov/)
- California: [California CDI](https://www.insurance.ca.gov/)
- Louisiana: [Louisiana LDI](https://www.ldi.la.gov/)
- Puerto Rico: [OCS](https://ocs.pr.gov/)

**Critical State Restrictions:**
- 🔴 **Alabama:** Public adjusting is ILLEGAL (UPL)
- 🔴 **Kansas:** Residential PA is ILLEGAL (commercial only)
- 🔴 **Louisiana:** Contingency fees are ILLEGAL (hourly/flat only)
- 🟡 **Florida:** 10% fee cap (no exceptions)
- 🟡 **Illinois:** 10% fee cap
- 🟡 **Tennessee:** 10% fee cap
- ⚠️ **Texas:** 72-hour post-disaster solicitation ban
- ⚠️ **North Carolina:** 48-hour hurricane solicitation ban
- 🌎 **Puerto Rico:** Spanish contracts required

**For detailed AI system documentation, see:**
- [docs/AI_CORE_INSTRUCTIONS.md](./docs/AI_CORE_INSTRUCTIONS.md)
- [docs/STATE_COMPLIANCE_RULES.json](./docs/STATE_COMPLIANCE_RULES.json)

---

*Last Updated: December 1, 2025*
