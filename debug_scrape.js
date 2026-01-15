const puppeteer = require("puppeteer");
const url = "https://www.zoominfo.com/careers/jr106607/senior-data-analyst?gh_src=cf8f81d2us&gh_jid=8157960002";

async function run() {
    console.log("Starting Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    try {
        console.log(`Navigating to ${url}...`);
        await page.goto(url, { waitUntil: "networkidle2" });
        
        // Wait specifically for potential job content containers
        try {
            await page.waitForSelector('.job-description', { timeout: 5000 });
        } catch (e) {
            console.log("Job description selector not found, proceeding with body.");
        }

        const text = await page.evaluate(() => document.body.innerText);
        console.log("TEXT LENGTH:", text.length);
        
        const skillList = ["SQL", "Python", "Tableau", "R"];
        const found = [];
        skillList.forEach(skill => {
            if (new RegExp("\\b" + skill + "\\b", "i").test(text)) {
                found.push(skill);
            }
        });
        console.log("FOUND:", found);
        if (found.length === 0) {
            console.log("TEXT SAMPLE:", text.substring(0, 1000));
        }
    } catch (e) {
        console.error("Puppeteer Error:", e);
    } finally {
        await browser.close();
    }
}
run();
