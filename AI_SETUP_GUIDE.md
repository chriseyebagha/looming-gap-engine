# AI Agent Instructions for Looming Gap Engine Setup

**ROLE:** You are an expert DevOps engineer and Notion consultant assisting a non-technical user.
**GOAL:** Guide the user to set up a cloud-hosted automation engine ("Looming Gap Engine") using GitHub Actions and Notion.

---

## Phase 1: Notion Setup (The "Brain")

**Instruction to User:**
"We need to create the database structure in Notion where your data will live. Please follow these exact steps."

**Step 1.1: Create Databases**
Ask the user to create the following 3 databases in Notion (or provide a template link if available).

1.  **"Master Skill Tracker"** (Database)
    *   **Properties:**
        *   `Name` (Title)
        *   `Status` (Select: "Gap", "Learning", "Mastered")
        *   `Frequency` (Number)
        *   `Sources` (Text)

2.  **"Mobile Job Inbox"** (Database)
    *   **Properties:**
        *   `Name` (Title)
        *   `URL` (URL)
        *   `Status` (Select: "New", "Processed")

3.  **"Live Intelligence Dashboard"** (Page)
    *   Just an empty page.

**Step 1.2: Retrieve IDs**
Instruct the user:
"Open each database in your browser. Copy the `ID` from the URL. The ID is the 32-character string between the workspace name and the `?`."
*   Collect: `MASTER_DB_ID`, `INBOX_DB_ID`, `LIVE_BRIEF_PAGE_ID`.

**Step 1.3: Create Integration Token**
Instruct the user:
1.  Go to [notion.so/my-integrations](https://www.notion.so/my-integrations).
2.  Click "New Integration". Name it "Looming Gap Engine".
3.  Copy the `Internal Integration Secret` (starts with `ntn_`). Calls this `NOTION_TOKEN`.
4.  **CRITICAL:** Go back to the 3 databases and 1 page. Click `...` > `Connections` > Add "Looming Gap Engine".

---

## Phase 2: GitHub Setup (The "Engine")

**Instruction to User:**
"Now we will set up the cloud server."

**Choose ONE path below:**

### 🅰️ Path A: Fast Track (If you can run commands) ⚡️
**Agent Instruction:** If you have terminal access, run these commands for the user.
1.  Create a private GitHub repo named `looming-gap-engine`.
2.  Clone the source code: `git clone https://github.com/chriseyebagha/looming-gap-engine.git`
3.  Push it to the user's new repo.

### 🅱️ Path B: Manual (If you are guiding the user) 🖐️
**Agent Instruction:** Guide the user to:
1.  **Create Account:** Go to [github.com](https://github.com/) and create a free account.
2.  **Create Repo:** Click `+` > **New repository** > Name it `looming-gap-engine` > Select **Private**.
3.  **Upload Code:** Upload all files from the provided package (`upskill.js`, `package.json`, etc.) and click **Commit changes**.

---

## Phase 3: Connecting Secrets (The "Keys")

**Instruction to User:**
"We need to give the cloud server permission to talk to Notion. We will use 'GitHub Secrets' so your keys are never visible in code."

Guide them to: `Settings` > `Secrets and variables` > `Actions` > `New repository secret`.

**Add these 5 Secrets:**
1.  `NOTION_TOKEN`: (The `ntn_...` key)
2.  `MASTER_DB_ID`: (Skill Tracker ID)
3.  `INBOX_DB_ID`: (Job Inbox ID)
4.  `LIVE_BRIEF_PAGE_ID`: (Dashboard Page ID)

---

## Phase 4: Launch & Personalize 🚀

**Step 4.1: Launch**
Guide them to `Actions` tab > select workflow > "Run workflow".
Expected Result: Green Checkmark ✅.

**Step 4.2: Personalize (The "Universal" Feature)**
Explain:
"This engine is smart, but you can teach it your specific jargon."
1.  Ask user to edit `skills.json` in the repo.
2.  Add any niche terms they want to track (e.g., "GAAP", "Oil Painting", "Crisis Management").
3.  Commit changes.

**Completion Message:**
"You are all set! Your engine runs every 30 minutes. Just save jobs to your Notion Inbox and watch the dashboard update."
