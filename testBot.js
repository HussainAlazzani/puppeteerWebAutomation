const puppeteer = require("puppeteer");
const fs = require("fs");
const csvToJson = require("csvtojson");

const formData = require("./formInputs.json");
// const formData = JSON.parse(fs.readFileSync("./formInputs.json"));


testBot();

async function testBot() {
    const browser = await puppeteer.launch({ headless: true, slowMo: 100 });
    const page = await browser.newPage();

    await login(page);
    await logNotifications(page, "Notifications.txt");
    await offence(page, "TargetList.csv");
    // more actions...

    await page.waitForTimeout(2000);
    await browser.close();
};

async function login(page) {
    await page.goto(formData.loginURL, { waitUntil: "networkidle0" });
    await page.type("#LoginUsername", formData.username, { delay: 100 });
    await page.type("#LoginPassword", formData.password, { delay: 100 });
    await page.click("input[value='Sign in']");

    await page.waitForSelector("div[class='notifications-tab']");
    await page.click("div[class='notifications-tab']");
    await page.waitForTimeout(1000);
}

async function logNotifications(page, fileName) {
    let notifications = await page.$$eval("body > header > div.notifications.js-notifications > ul > li", liElemets => {
        return liElemets.map(li => li.textContent);
    });

    // Save message notifications to a file
    notifications = notifications.toString().replace(",", "\n");
    fs.writeFile(fileName, notifications, "utf8", (err) => {
        if (err) throw err;
        console.log("Notifications saved")
    });
}


async function offence(page, source) {
    await page.goto(formData.offenceURL);
    await page.waitForSelector(".js-kill[type='submit']");

    try {
        // Get the list of targets from csv file
        if (fs.existsSync(source)) {
            const targets = await csvToJson().fromFile(source);

            for (let i = 0; i < targets.length; i++) {
                await page.goto(formData.offenceURL);
                await page.waitForSelector("#KillUser");

                await page.type("#KillUser", targets[i].username, { delay: 100 });
                await page.type("#BulletsRaw", targets[i].bullets);
                await page.type("#DeathMessage", targets[i].message, { delay: 100 })
                if (targets[i].public.toLowerCase() === "yes") {
                    await page.click("#pub");
                }

                // await page.click(".js-kill[type='submit']");
            }
        }
    } catch (error) {
        console.error(error);
    }
}
