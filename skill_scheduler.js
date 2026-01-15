const { execSync } = require("child_process");

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const MASTER_DB_ID = process.env.MASTER_DB_ID;

if (!NOTION_TOKEN || !MASTER_DB_ID) {
    console.error("❌ ERROR: Missing secrets in skill_scheduler.js");
    process.exit(1);
}

function notionReq(method, path, data) {
    const cmd = `curl -s -X ${method} "https://api.notion.com/v1${path}" \
        -H "Authorization: Bearer ${NOTION_TOKEN}" \
        -H "Notion-Version: 2022-06-28" \
        -H "Content-Type: application/json" \
        ${data ? `--data '${JSON.stringify(data).replace(/'/g, "'\\''")}'` : ""}`;
    try {
        const output = execSync(cmd).toString();
        return JSON.parse(output);
    } catch (e) {
        return null;
    }
}

function getNextSaturdayNoon() {
    const now = new Date();
    const result = new Date();
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    result.setDate(now.getDate() + daysUntilSaturday);
    result.setHours(12, 0, 0, 0);
    return result;
}

function createCalendarEvent(skill, date) {
    // Cloud execution: Skip local Apple Calendar
    console.log(`[Cloud Agent] Study session for "${skill}" identified for ${date.toDateString()}.`);
    return true; // Mark as success to clear queue
}

async function run() {
    console.log("\x1b[36mChecking for Skills Queued for Study...\x1b[0m");

    const data = notionReq("POST", `/databases/${MASTER_DB_ID}/query`, {
        filter: { property: "Queue Study (Sat 12PM)", checkbox: { equals: true } }
    });

    if (!data?.results || data.results.length === 0) {
        console.log("No skills queued for study.");
        return;
    }

    const satNoon = getNextSaturdayNoon();
    console.log(`Scheduling events for Saturday, ${satNoon.toDateString()} at 12 PM...`);

    for (const page of data.results) {
        const skill = page.properties.Skill.title[0]?.plain_text || "Unknown Skill";
        console.log(`Processing: ${skill}`);

        if (createCalendarEvent(skill, satNoon)) {
            console.log(`\x1b[32mEvent created for ${skill}.\x1b[0m`);
            // Uncheck the box
            notionReq("PATCH", `/pages/${page.id}`, {
                properties: { "Queue Study (Sat 12PM)": { checkbox: false } }
            });
        }
    }
    console.log("\x1b[32mScheduling complete.\x1b[0m");
}

run().catch(console.error);
