import { Browser, Page } from 'puppeteer';
const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const iPhone = puppeteer.devices['iPhone 6'];
const fs = require('fs/promises');
const months = require('./months');

interface Advert {
  title: string;
  description: string;
  url: string;
  price: number;
  author: string;
  date: string;
  phone: string;
}

const randDelay = (min: number, max: number):Promise<void> => {
  return new Promise(function(resolve) { 
      setTimeout(resolve, Math.random() * (max - min) + min)
  });
}

const checkLoggedIn = async (page:Page) => {
  const isLoggedIn = await page.evaluate(() => {
    if (document.querySelector('.index-services-menu-link-not-authenticated-Pzomx')) return false;
    return true;
  })
  return isLoggedIn;
}

const getDate = (str:string):string => {
  const arr: string[] = str.split(' ');
  const date: Date = new Date();
  let key = 1;

  switch (arr[0]) {
    case 'Сегодня':
      break;
    case 'Вчера':
      date.setDate(date.getDate() - 1);
      break;
    default:
      date.setMonth(months[arr[1]]);
      date.setDate(+arr[0]);
      key++;
      break;
  }
  date.setHours(+arr[key].split(':')[0]);
  date.setMinutes(+arr[key].split(':')[1]);
  return '' + date;
}

const getLinks = async (page:Page, url:string, limit:number):Promise<string[]> => {
  const links: Array<string> = [];
  console.log('Prepearing links...');
  const pagesNumber:number = await page.evaluate(() => {
    return +document.querySelector('.pagination-root-Ntd_O').lastChild.previousSibling.textContent;
  });

  let i:number = 1;
  do {
    try {
      const linksPerPage:string[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll<HTMLAnchorElement>('a.iva-item-title-py3i_')).map(link => link.href); 
      });
      links.push(...linksPerPage);
    }
    catch (err) {
      console.log(err.message);
    }
    console.log(`Page: [${i}] / [${pagesNumber}]`);
    if ((i++ >= pagesNumber) || (links.length >= limit)) break;
    await randDelay(2000, 3000);
    await page.goto(`${url}?p=${i}`);
  } while (true);
  console.log('Links are ready!\n');
  return links;
}

const parsePage = async (page:Page, url:string, isLoggedIn:boolean):Promise<Advert> => {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const advert:Advert = await page.evaluate(() => {    
    const advert = {} as Advert;
    advert.title = document.querySelector('.mav-1cepbnp > h1 > span').textContent;
    advert.description = document.querySelector('._nTsP').textContent;
    advert.price = +document.querySelector('.vDskN').textContent.replace(/\s|₽/g, '');
    advert.author = document.querySelector('.UZhDR').textContent;
    advert.date = document.querySelector('.DeUoO').textContent.trim().replace(',', '');
    return advert;
  });
  advert.date = getDate(advert.date);
  advert.url = url;
  if (!isLoggedIn) {
    advert.phone = null;
    await randDelay(3000, 4000);
    return advert;
  }

  try {
    await randDelay(4000, 5000);
    let err = await page.evaluate(() => {
      if (!document.querySelector('button.mav-12zz5z0')) return true;
      document.querySelector<HTMLButtonElement>('button.mav-12zz5z0').click();
      return false;
    })
    if (err) throw new Error('The seller has hidden phone number. URL:\n' + url);
    await page.waitForSelector('.mWxO4, .QZvpq');
    advert.phone = await page.evaluate(() => {
      if (document.querySelector('.QZvpq')) return null;
      return document.querySelector('.mWxO4').textContent;
    })
    if (!advert.phone) throw new Error('Phone number is temporarily hidden, too many requests. URL:\n' + url);
    advert.phone = advert.phone.replace(/\s|\+|\-/g, '');
  }
  catch (err) {
    console.log(err.message);
    advert.phone = null;
  }
  return advert;
}

async function scrape(url:string, limit:number):Promise<void> {
  puppeteerExtra.use(pluginStealth());
  const browser:Browser = await puppeteerExtra.launch({
    headless: true,
  });
  let page:Page = (await browser.pages())[0];
  const cookiesString:string = await fs.readFile('./cookies.json');
  const cookies = JSON.parse(cookiesString);
  await page.setCookie(...cookies);
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const isLoggedIn:boolean = await checkLoggedIn(page);
  if (!isLoggedIn) console.log('\x1b[31m%s\x1b[0m', 'Warning: you are not logged in to the site, so you will not receive phone numbers!\n');

  const links:string[] = await getLinks(page, url, limit);
  let advertsAmount:number = links.length;
  let parsedCount:number = 0;
  const adverts:Array<Advert> = [];

  await page.close();
  page = await browser.newPage();
  await page.emulate(iPhone);
  await page.setDefaultTimeout(10000); 

  if (limit && (limit < advertsAmount)) advertsAmount = limit;
  for (let i = 0; i < advertsAmount; i++) {
    const advert:Advert = await parsePage(page, links[i], isLoggedIn);
    adverts.push(advert);
    fs.writeFile('adverts.json', JSON.stringify(adverts, null, ' '));
    if (advert.phone) parsedCount++;
    console.log(`[${i + 1}] / [${advertsAmount}]`);
  }

  console.log(`Parsed successfully: [${parsedCount}] / [${advertsAmount}]`);
  browser.close();
}

scrape('https://avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV', 100);