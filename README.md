# Looming Gap Engine (Cloud Edition)

## 1. Product Overview (Why Use This?)
The **Looming Gap Engine** is your personal, automated career coach. It works silently in the background 24/7 to solve two major problems for ambitious professionals:

1.  **"What should I learn next?"**: It analyzes job descriptions you save, identifies which skills you are missing that are in high market demand, and tells you exactly what to study.
2.  **"What is my plan for the weekend?"**: Instead of waking up on Saturday and guessing what to do, this engine updates a **"Weekly Brief"** every single day. By the time Saturday arrives, you have a finalized, high-signal battle plan with curated learning resources.

**The Result:** You stop guessing and start learning exactly what the market wants to hire you for.

## 2. Technical Overview (How It Works)
The engine runs entirely in the cloud using **GitHub Actions**, meaning it works even if your computer is off.

1.  **Input (Notion Inbox)**: You save job descriptions to a Notion database (from your phone or laptop).
2.  **The Engine (GitHub)**: Every 30 minutes, a cloud server wakes up and:
    *   Reads your Notion Inbox.
    *   **Scrapes** the job links using a headless browser (Puppeteer).
    *   **Extracts** technical skills (SQL, Python, etc.) from the text.
    *   **Compares** them against your "Master Skill Tracker" in Notion.
    *   **Updates** the tracker: Incrementing demand frequency ("This skill appeared in 5 jobs") and flagging gaps.
3.  **The Output (Live Dashboard)**: It then generates a **live "Weekly Brief"** on a Notion Dashboard page, listing your top skill gap and curated learning resources (articles, video, roadmap).

### Deep Dive: How the Brain Works (NLP & Regex)

For the technically curious, here is exactly how the engine identifies skills while ignoring noise:

1.  **Zone Segmentation**:
    The engine reads the Job Description line-by-line and categorizes text into "Zones" based on headers:
    -   **Target Zone** (Scanned): "Requirements", "Qualifications", "Skills", "Tech Stack", "Responsibilities".
    -   **Ignore Zone** (Deleted): "Benefits", "Perks", "Salary", "About Us".
    *Why?* This prevents terms like "Health Insurance" (which contains "Insurance") from counting as a skill.

2.  **Hybrid Extraction**:
    -   **NLP (Compromise)**: Scans for Named Entities (Proper Nouns) to capture new technologies automatically.
    -   **Dictionary Check**: References `skills.json` to find specific keywords you care about (e.g., "GAAP", "React").

3.  **The "Blocklist" Filter**:
    Before saving a skill, it runs a final check against `blocklist.json`. Even if a word is in a "Target Zone", if it's in the blocklist (e.g., "Full Time", "Remote", "Degree"), it is discarded.

---

## 🤖 **Have an AI Agent?**
If you are using an AI assistant (like ChatGPT, Claude, or Gemini), **STOP HERE.**
You don't need to read this manual.
👉 **[Give this file to your AI Agent](AI_SETUP_GUIDE.md)**
It contains instructions for them to guide you through the setup interactively.

---

## 3. Setup Guide (Manual)

Follow these steps to set up your own engine. **No coding knowledge required.**

### Phase 1: Notion Setup
You need a place for the engine to read/write data.

1.  **Duplicate the Template**:
    *   [Link to Template coming soon - Ask Chris for his schema!]
    *   *Alternative:* Create 3 Databases:
        1.  **Skill Tracker** (Columns: Name, Frequency (Number), Status (Select: Gap/Matched), Sources (Text)).
        2.  **Job Inbox** (Columns: Name, URL, Status (Select: New/Processed)).
    *   Create 1 Page: **"Live Intelligence Dashboard"** (Empty page).

2.  **Get Your IDs**:
    *   Open each database/page in your browser.
    *   The ID is the long string of characters in the URL (e.g., `notion.so/my-page-12345abcde...` -> `12345abcde...`).
    *   **Save these 3 IDs:** `MASTER_DB_ID`, `INBOX_DB_ID`, `LIVE_BRIEF_PAGE_ID`.

3.  **Create an Integration Token**:
    *   Go to [Notion My Integrations](https://www.notion.so/my-integrations).
    *   Click **"New integration"**.
    *   Name it "Looming Gap Engine".
    *   **Save the "Internal Integration Secret"** (starts with `ntn_...`). This is your `NOTION_TOKEN`.

4.  **Connect Integration**:
    *   Go back to your Notion pages.
    *   Click the `...` menu (top right) -> `Connect to` -> Select "Looming Gap Engine".
    *   Do this for **ALL 3 databases and the dashboard page**.

### Phase 2: GitHub Setup
This is where the code lives and runs.

1.  **Create a GitHub Account**: Go to [github.com](https://github.com/) and sign up (it's free).
2.  **Create a Repository**:
    *   Click the `+` icon (top right) -> **New repository**.
    *   Name it `looming-gap-engine`.
    *   Select **Private**.
    *   Click **Create repository**.
3.  **Upload the Code**:
    *   Click **"uploading an existing file"**.
    *   Drag and drop all the files from this folder (`upskill.js`, `morning_brief.js`, `package.json`, `.github/workflows/engine.yml`, etc.).
    *   Click **Commit changes**.

### Phase 3: Connect Secrets (The Magic Key)
GitHub needs your Notion keys to talk to your databases.

1.  In your GitHub Repo, go to **Settings** (top tab).
2.  On the left, scroll down to **Secrets and variables** -> **Actions**.
3.  Click **New repository secret**.
4.  Add the following 5 secrets (Copy/Paste exact values from Phase 1):

| Secret Name | Value |
| :--- | :--- |
| `NOTION_TOKEN` | Your `ntn_...` key |
| `MASTER_DB_ID` | Your Skill Tracker DB ID |
| `INBOX_DB_ID` | Your Job Inbox DB ID |
| `LIVE_BRIEF_PAGE_ID` | Your Dashboard Page ID |

### Phase 4: Launch 🚀
1.  Go to the **Actions** tab in your repo.
2.  You should see "Looming Gap Engine Cloud" on the left.
3.  Click **Run workflow** -> **Run workflow**.
4.  If the circle turns **Green**, you are live!
5.  Check your Notion Dashboard. It should now have a "Weekly Brief".

### How to Use It
-   **On Mobile**: Whenever you see a job you like, share the link to your Notion "Job Inbox".
-   **The rest happens automatically.** The engine runs every 30 minutes to process that link and update your strategy.
