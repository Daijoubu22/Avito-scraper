const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const fs = require('fs/promises');

async function auth() {
  puppeteerExtra.use(pluginStealth());
  const browser = await puppeteerExtra.launch({
    headless: false,
  });
  const page = (await browser.pages())[0];
  await page.setDefaultTimeout(0); 
  page.goto('https://avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV');
  console.log('Please, log in to the site...');
  await page.waitForSelector('a[title=Сообщения]');
  try {
    const cookies = await page.cookies();
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
    console.log('Logged in successfully!');
  }
  catch (err) {
    console.log(err);
  }
  browser.close();
}

auth();