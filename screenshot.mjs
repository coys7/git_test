import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
await page.goto('file://' + path.join(__dirname, 'fomc-day.html'), { waitUntil: 'networkidle0', timeout: 15000 });
await page.screenshot({ path: path.join(__dirname, 'fomc-day.png'), type: 'png' });
await browser.close();
console.log('done');
