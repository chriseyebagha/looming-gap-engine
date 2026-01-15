# Looming Gap Engine: Documentation

Welcome to the Looming Gap Engine. This system is designed to automate the process of identifying skill gaps from job descriptions and providing high-quality learning resources to bridge those gaps.

---

## 👤 User Perspective (The Product)

### Overview
The Looming Gap Engine is your personal up-skilling co-pilot. It eliminates the manual work of tracking what skills the market wants by analyzing jobs you're interested in and telling you exactly what to learn next.

### How It Works
1.  **Job Capture**: Whenever you find a job description (JD) you're interested in—especially on your mobile phone—simply add the link to your **Notion Mobile Inbox**.
2.  **Automated Analysis**: The system periodically scans this inbox. It "reads" the job description, extracts the required technical skills, and compares them against your existing skill set.
3.  **Skill Tracking**: It updates your **Master Skill Tracker** in Notion. If multiple jobs require the same skill that you don't have yet, that skill's "Frequency" and "Priority" will increase, highlighting it as a critical gap.
4.  **Morning Briefs**: Every morning at 8:00 AM, the engine generates a **Morning Brief** delivered directly to your **Apple Notes**. This brief includes:
    *   Your **Top 3 Skill Gaps** based on market demand (frequency in JDs).
    *   **High-Signal Learning Resources**: Direct links to top-rated tutorials and articles (from sites like Dev.to) specifically for those skills.
    *   A summary of your job search pulse and today's schedule.

### Key Benefits
*   **Data-Driven Learning**: You no longer have to guess what to learn. The data from actual jobs you want guides your study plan.
*   **Mobile-First**: Capture jobs instantly from your phone while browsing.
*   **Zero-Effort Delivery**: Everything is delivered to your preferred note-taking app (Apple Notes) automatically.

---

## 🛠 Engineer Perspective (The System)

### Architecture
The engine is built using **Node.js** and leverages several APIs and system-level integrations:
*   **Notion API**: Used as the primary data store (Inbox and Master Tracker).
*   **Puppeteer**: Headless browser used for robust web scraping of job descriptions.
*   **Dev.to API**: Used to fetch high-signal, community-vetted learning resources.
*   **AppleScript**: Used to programmatically interface with the macOS Notes app.
*   **launchd**: macOS system service manager used for scheduling and automation.

### Core Components
*   [`upskill.js`](file:///Users/chriseyebagha/Documents/Projects/looming-gap-engine/upskill.js): 
    *   Handles JD scraping and skill extraction.
    *   The `--watch` flag enables polling the Notion Inbox for new entries.
    *   Uses a regex-based matcher for high-precision skill detection.
*   [`morning_brief.js`](file:///Users/chriseyebagha/Documents/Projects/looming-gap-engine/morning_brief.js):
    *   Aggregates data from Notion.
    *   Calls the `skill_scheduler.js` to process any queued items.
    *   Queries Dev.to for the best learning content.
    *   Formats and sends the brief to Apple Notes using AppleScript.
*   [`skill_scheduler.js`](file:///Users/chriseyebagha/Documents/Projects/looming-gap-engine/skill_scheduler.js): Manages the queue of skills to be processed or studied.

### Automation & Deployment
Automation is handled by two `launchd` agents located in `~/Library/LaunchAgents/`:
1.  **Job Watcher (`com.looming-gap.job-watcher.plist`)**:
    *   Runs `upskill.js --watch` every 6 hours and at 6:00 PM daily.
    *   Logs output to `watcher.log`.
2.  **Morning Brief (`com.looming-gap.morning-brief.plist`)**:
    *   Runs `morning_brief.js` daily at 8:00 AM.
    *   Logs output to `brief.log`.

### System Paths
All core logic resides in: `/Users/chriseyebagha/Documents/Projects/looming-gap-engine/`

---
*Documentation generated on: January 5, 2026*
