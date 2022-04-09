const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const iPhone = puppeteer.devices['iPhone 6'];
const fs = require('fs/promises');
const months = require("./months");

const randDelay = (min, max) => {
  return new Promise(function(resolve) { 
      setTimeout(resolve, Math.random() * (max - min) + min)
  });
}

const checkLoggedIn = async (page) => {
  const isLoggedIn = await page.evaluate(() => {
    if (document.querySelector('.index-services-menu-link-not-authenticated-Pzomx')) return false;
    return true;
  })
  return isLoggedIn;
}

const getDate = (str) => {
  const arr = str.split(' ');
  const date = new Date();
  let key = 1;

  switch (arr[0]) {
    case 'Сегодня':
      break;
    case 'Вчера':
      date.setDate(date.getDate() - 1);
      break;
    default:
      date.setMonth(months[arr[1]]);
      date.setDate(arr[0]);
      key++;
      break;
  }
  date.setHours(arr[key].split(':')[0]);
  date.setMinutes(arr[key].split(':')[1]);
  return '' + date;
}

const getLinks = async (page, url) => {
  const links = [];
  console.log('Prepearing links...');
  const pagesNumber = await page.evaluate(() => {
    return document.querySelector('.pagination-root-Ntd_O').lastChild.previousSibling.textContent;
  });
  let i = 1;
  do {
    const linksPerPage = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a.iva-item-title-py3i_')).map(link => link.href); 
    });
    links.push(...linksPerPage);
    console.log(`Page: [${i}] / [${pagesNumber}]`);
    if (i++ >= pagesNumber) break;
    await randDelay(100, 200);
    await page.goto(`${url}?p=${i}`);
  } while (true);
  console.log('Links are ready!\n');
  return links;
}

const parsePage = async (page, url, isLoggedIn) => {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const advert = await page.evaluate(() => {    
    const advert = {};
    advert.title = document.querySelector('.mav-1cepbnp > h1 > span').textContent;
    advert.description = document.querySelector('._nTsP').textContent;
    advert.price = +document.querySelector('.vDskN').textContent.replace(/\s|₽/g, '');
    advert.author = document.querySelector('.UZhDR').textContent;
    advert.date = document.querySelector('.DeUoO').textContent.trim().replace(',', '');
    document.querySelector('button.mav-12zz5z0').click();
    return advert;
  });
  advert.date = getDate(advert.date);
  advert.url = url;
  if (!isLoggedIn) {
    advert.phone = '';
    return advert;
  }
  await page.waitForSelector('.mWxO4');
  advert.phone = await page.evaluate(() => {
    return document.querySelector('.mWxO4').textContent;
  })
  return advert;
}

async function scraper(url) {
  puppeteerExtra.use(pluginStealth());
  const browser = await puppeteerExtra.launch({
    headless: false,
  });
  let page = (await browser.pages())[0];
  const cookiesString = await fs.readFile('./cookies.json');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const isLoggedIn = await checkLoggedIn(page);
  if (!isLoggedIn) console.log('\x1b[31m%s\x1b[0m', 'Warning: you are not logged in to the site, so you will not receive phone numbers!\n');

  const links = await getLinks(page, url);
  const advertsAmount = links.length;
  let parsedCount = 0;
  const adverts = [];

  await randDelay(100, 200);
  await page.close();
  page = await browser.newPage();
  await page.emulate(iPhone);

  for (let i = 0; i < advertsAmount; i++) {
    try {
      const advert = await parsePage(page, links[i], isLoggedIn);
      adverts.push(advert);
      fs.writeFile('adverts.json', JSON.stringify(adverts, null, ' '));
      parsedCount++;
      console.log(advert);
      console.log(`[${i + 1}] / [${advertsAmount}]`);
      if (isLoggedIn) await randDelay(1000, 2000);
      else await randDelay(3000, 4000);
    }
    catch (err) {
      console.log(err);
    }
  }

  console.log(`Parsed successfully: [${parsedCount}] / [${advertsAmount}]`);
  browser.close();
}

scraper('https://avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV');