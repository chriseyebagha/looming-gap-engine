const { execSync } = require("child_process");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const nlp = require('compromise');

// Load Skills Dictionary (Backup)
let SKILL_DICTIONARY = [];
try {
    const skillsData = fs.readFileSync(path.join(__dirname, 'skills.json'), 'utf8');
    SKILL_DICTIONARY = JSON.parse(skillsData);
} catch (e) {
    console.warn("⚠️ Warning: skills.json not found. Using NLP only.");
}

// Configuration - Using Env Vars for Cloud Compatibility
const NOTION_TOKEN = process.env.NOTION_TOKEN;
const DATABASE_ID = process.env.MASTER_DB_ID; // Note: mapped to MASTER_DB_ID to match other scripts
const INBOX_DB_ID = process.env.INBOX_DB_ID;
const CURL_PATH = process.env.CURL_PATH || 'curl';

if (!NOTION_TOKEN || !DATABASE_ID || !INBOX_DB_ID) {
    console.error("❌ ERROR: Missing required environment variables for upskill.js.");
    process.exit(1);
}

function notionReq(method, path, data) {
    const cmd = `${CURL_PATH} -s -X ${method} "https://api.notion.com/v1${path}" \
        -H "Authorization: Bearer ${NOTION_TOKEN}" \
        -H "Notion-Version: 2022-06-28" \
        -H "Content-Type: application/json" \
        ${data ? `--data '${JSON.stringify(data).replace(/'/g, "'\\''")}'` : ""}`;
    const output = execSync(cmd).toString();
    try {
        return JSON.parse(output);
    } catch (e) {
        console.error("Notion Error:", output);
        return null;
    }
}

async function scrapeJD(url) {
    console.log(`\x1b[36mAttempting to scrape: ${url}...\x1b[0m`);
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: "networkidle2" });
        await new Promise(r => setTimeout(r, 2000));

        const text = await page.evaluate(() => document.body.innerText);

        if (text.includes("confirm you are a human") || text.includes("Access Denied")) {
            throw new Error("BOT_BLOCK");
        }

        if (process.env.DEBUG === "true") {
            console.log("\x1b[90mDEBUG: Scraped Text Preview:\x1b[0m", text.substring(0, 300).replace(/\n/g, " "));
        }

        return text;
    } finally {
        await browser.close();
    }
}

// Load Blocklist
let BLOCKLIST = [];
try {
    const blockData = fs.readFileSync(path.join(__dirname, 'blocklist.json'), 'utf8');
    BLOCKLIST = JSON.parse(blockData);
} catch (e) {
    console.warn("⚠️ Warning: blocklist.json not found. Using default minimal blocklist.");
    BLOCKLIST = ["Inc.", "LLC", "Benefits", "Insurance", "Salary"];
}

function segmentText(text) {
    const lines = text.split('\n');
    const segments = {
        target: [],
        ignore: [],
        neutral: []
    };

    let currentZone = 'neutral';

    // Heuristic patterns for Headers
    const targetHeaders = /^(requirements|qualifications|skills|who you are|what you bring|experience|competencies|tech stack|responsibilities|duties|what you'll do|what you will do)/i;
    const ignoreHeaders = /^(benefits|perks|what we offer|compensation|salary|legal|eeo|about us|company overview)/i;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.length < 50 && /^[A-Z]/.test(trimmed)) { // Likely a header
            if (targetHeaders.test(trimmed)) {
                currentZone = 'target';
            } else if (ignoreHeaders.test(trimmed)) {
                currentZone = 'ignore';
            }
            // If neither, keep previous zone or default to neutral if undefined? 
            // Actually, if it looks like a header but isn't matched, it might be a neutral section (like "Responsibilities").
            // Let's stick to currentZone unless explicitly changed.
        }
        segments[currentZone].push(line);
    }

    return {
        target: segments.target.join('\n'),
        ignore: segments.ignore.join('\n'),
        neutral: segments.neutral.join('\n')
    };
}

function extractSkills(text) {
    const { target, ignore, neutral } = segmentText(text);

    // Strategy:
    // 1. Extract from TARGET and NEUTRAL zones.
    // 2. Validate against IGNORE zone (Penalty Box).

    // Valid text to scan (we largely ignore the 'ignore' zone content for positive extraction)
    // But we might scan 'neutral' with higher scrutiny.
    // For simplicity, let's combine Target + Neutral for scanning.
    const textToScan = target + "\n" + neutral;

    let foundSkills = new Set();
    const doc = nlp(textToScan);

    // 1. Cleanse text
    doc.people().remove();
    doc.places().remove();
    doc.organizations().remove();
    doc.match('#Date').remove();
    doc.match('#Url').remove();
    doc.match('#Money').remove();

    // 2. Extract Topics
    const topics = doc.topics().out('array');
    topics.forEach(t => foundSkills.add(t));

    // 3. Dictionary Match (Reliable Backup)
    SKILL_DICTIONARY.forEach(skill => {
        // Escape special regex characters (e.g. C++, C#) to prevent crashes
        const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        try {
            const regex = new RegExp(`\\b${escaped}\\b`, 'i');
            if (regex.test(textToScan)) foundSkills.add(skill);
        } catch (e) {
            // Ignore invalid regex for now
        }
    });

    // 4. Final Filtering & Context Check
    const cleaned = Array.from(foundSkills)
        .map(s => s.trim())
        .filter(s => {
            // Allow short skills if they are in our dictionary (e.g. S3, Go, R, C#)
            // Case-insensitive check against dictionary
            if (SKILL_DICTIONARY.some(d => d.toLowerCase() === s.toLowerCase())) return true;
            return s.length > 2;
        })
        .filter(s => {
            // Blocklist Check
            if (BLOCKLIST.some(block => s.toLowerCase().includes(block.toLowerCase()))) return false;

            // Generic Word Check
            if (['The', 'An', 'A', 'To', 'In', 'Of', 'And', 'For', 'With', 'From', 'By'].includes(s)) return false;

            // **CONTEXT CHECK (The "Penalty" Logic)**
            // If a skill was NOT found in Target/Neutral (which is impossible by definition of textToScan),
            // we are good. But wait, what if "Insurance" appeared in Neutral?
            // "Insurance" is in the Blocklist, so it's gone.

            // What about a term that is NOT in blocklist but appears in Benefits?
            // e.g. "Free Lunch". 
            // If "Free Lunch" is extracted from Neutral (maybe headers weren't perfect), we might want to check 
            // if it ALSO appears in the 'ignore' zone strongly? 
            // Actually, simply NOT scanning the 'ignore' zone is the strongest penalty.
            // If it's ONLY in 'ignore', it won't be in `textToScan`, so it won't be found.

            return true;
        });

    return [...new Set(cleaned)];
}

async function upsertNotion(skillName, isGap, sourceLabel) {
    console.log(`Updating tracker for: \x1b[35m${skillName}\x1b[0m`);
    const queryData = notionReq("POST", `/databases/${DATABASE_ID}/query`, {});

    if (!queryData || !queryData.results) {
        console.error("Failed to query Notion.");
        return;
    }

    const existingPage = queryData.results.find(page => {
        const title = page.properties.Skill.title[0]?.plain_text || "";
        return title.trim().toLowerCase() === skillName.trim().toLowerCase();
    });

    if (existingPage) {
        const currentSourcesText = existingPage.properties.Sources?.rich_text[0]?.plain_text || "";
        const sources = currentSourcesText.split(",").map(s => s.trim()).filter(Boolean);

        if (sources.includes(sourceLabel)) {
            console.log(`\x1b[34m[SKIP] Already linked to this source.\x1b[0m`);
            return;
        }

        const newSources = [...sources, sourceLabel].join(", ");
        const newFreq = sources.length + 1;

        notionReq("PATCH", `/pages/${existingPage.id}`, {
            properties: {
                "Frequency": { number: newFreq },
                "Sources": { rich_text: [{ text: { content: newSources } }] }
            }
        });
        console.log(`  \x1b[32m[UPDATE] Frequency: ${newFreq}\x1b[0m`);
    } else {
        notionReq("POST", "/pages", {
            parent: { database_id: DATABASE_ID },
            properties: {
                "Skill": { title: [{ text: { content: skillName } }] },
                "Status": { select: { name: isGap ? "Gap" : "Matched" } },
                "Frequency": { number: 1 },
                "Sources": { rich_text: [{ text: { content: sourceLabel } }] },
                "Priority": { select: { name: isGap ? "High" : "Low" } },
                "Roadmap": { rich_text: [{ text: { content: isGap ? "Learning required (Auto-detected)." : "Core strength." } }] }
            }
        });
        console.log(`  \x1b[33m[CREATE] New entry added.\x1b[0m`);
    }
}

// ... [Existing helper functions: notionReq, scrapeJD, extractSkills, upsertNotion] ...
// (Note: Retaining all previous helper functions logic exactly)

async function watchInbox() {
    console.log("\x1b[36mChecking Mobile Job Inbox...\x1b[0m");
    const data = notionReq("POST", `/databases/${INBOX_DB_ID}/query`, {
        filter: {
            or: [
                { property: "Status", select: { equals: "New" } },
                { property: "Status", select: { is_empty: true } }
            ]
        }
    });

    if (!data || !data.results || data.results.length === 0) {
        console.log("No new jobs in inbox.");
        return;
    }

    console.log(`Found ${data.results.length} new job(s) to process.`);

    for (const page of data.results) {
        const url = page.properties.URL.url || page.properties.Name.title[0]?.plain_text; // Fallback to title if URL empty
        const pageTitle = page.properties.Name.title[0]?.plain_text || "Untitled";

        if (!url || !url.startsWith("http")) {
            console.log(`Skipping invalid URL: ${pageTitle}`);
            continue;
        }

        console.log(`Processing: ${pageTitle} (${url})`);
        let status = "Error";
        let skillSummary = "Failed to scrape";

        try {
            const text = await scrapeJD(url);
            const skills = extractSkills(text);

            if (skills.length > 0) {
                console.log(`  Skills found: ${skills.join(", ")}`);
                const source = `Mobile Inbox: ${pageTitle}`;

                // Update Master Tracker
                for (const skill of skills) {
                    // Quick check for gap/match logic logic reused from main... 
                    // To keep it simple, we assume everything is a potential gap unless known.
                    // We'll hardcode "IsGap" logic based on a small known list for now, or just default to Gap logic 
                    // since the Master Tracker upsert logic handles frequency incrementing regardless.
                    // Actually upsertNotion takes (skillName, isGap). 
                    // Let's reuse the simple check:
                    const mySkills = ["SQL", "Python", "Tableau", "Generative BI"];
                    const isGap = !mySkills.includes(skill);

                    await upsertNotion(skill, isGap, source);
                }
                status = "Processed";
                skillSummary = skills.join(", ");
            } else {
                console.log("  No skills found in text.");
                skillSummary = "No skills detected";
                status = "Processed"; // Processed but empty
            }

        } catch (e) {
            console.error(`  Error processing ${pageTitle}:`, e.message);
            skillSummary = `Error: ${e.message}`;
        }

        // Update Inbox Page
        notionReq("PATCH", `/pages/${page.id}`, {
            properties: {
                "Status": { select: { name: status } },
                "Skills Found": { rich_text: [{ text: { content: skillSummary } }] }
            }
        });
        console.log(`  Inbox updated: ${status}`);
    }
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes("--watch")) {
        await watchInbox();
        return;
    }

    const input = args[0];
    // ... [Existing CLI logic] ...
    if (!input) {
        console.log("Usage: upskill <URL_OR_TEXT> [--watch]");
        return;
    }

    // ... [Rest of existing CLI logic] ...
    let text = "";
    let sourceLabel = "";

    try {
        if (input.startsWith("http")) {
            sourceLabel = input;
            try {
                text = await scrapeJD(input);
            } catch (e) {
                if (e.message === "BOT_BLOCK") {
                    console.log("\x1b[31m[BLOCK] This site has bot protection (Cloudflare/Human Check).\x1b[0m");
                    console.log("\x1b[33mFallback: Copy the JD text and run:\x1b[0m");
                    console.log(`upskill "PASTE_JD_TEXT_HERE"`);
                    return;
                }
                throw e;
            }
        } else {
            text = input;
            sourceLabel = "Manual Paste (" + new Date().toLocaleDateString() + ")";
            console.log("\x1b[36mProcessing manual text input...\x1b[0m");
        }

        const extracted = extractSkills(text);

        if (extracted.length === 0) {
            console.log("\x1b[31mNo skills detected.\x1b[0m");
            return;
        }

        console.log(`Detected: \x1b[35m${extracted.join(", ")}\x1b[0m`);
        const mySkills = ["SQL", "Python", "Tableau", "Generative BI"];

        for (const skill of extracted) {
            const isGap = !mySkills.includes(skill);
            await upsertNotion(skill, isGap, sourceLabel);
        }
        console.log("\x1b[32m\x1b[1mSUCCESS: Notion Updated!\x1b[0m");
    } catch (e) {
        console.error("Error:", e.message);
    }
}

main();
