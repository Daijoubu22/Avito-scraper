const puppeteer = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const pluginStealth = require('puppeteer-extra-plugin-stealth');
const { default: axios } = require('axios');
const fs = require('fs/promises');
const months = require("./months");

function randDelay(min, max) {
  return new Promise(function(resolve) { 
      setTimeout(resolve, Math.random() * (max - min) + min)
  });
}

const getPhoneNumber = async (url) => {
  const advertID = url.split('_')[url.split('_').length - 1];
  const res = await axios.get(`https://m.avito.ru/api/1/items/${advertID}/phone?key=af0deccbgcgidddjgnvljitntccdduijhdinfgjgfjir`);
  const uri = res.data.result.action.uri;
  return uri.substring(uri.length - 11);
}

const getDate = (str) => {
  const arr = str.split(' ');
  const date = new Date();
  let key = 2;

  switch (arr[0]) {
    case 'сегодня':
      break;
    case 'вчера':
      date.setDate(date.getDate() - 1);
      break;
    default:
      date.setMonth(months[arr[1]]);
      date.setDate(arr[0]);
      key = 3;
      break;
  }
  date.setHours(arr[key].split(':')[0]);
  date.setMinutes(arr[key].split(':')[1]);
  return '' + date;
}

const getLinks = async (page, url) => {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const res = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a.iva-item-title-py3i_')).map(link => link.href); 
  });
  return res;
}

const parsePage = async (page, url) => {
  await page.goto(url, {waitUntil: 'domcontentloaded'});
  const advert = await page.evaluate(() => {    
    const advert = {};
    advert.title = document.querySelector('.title-info-title-text').textContent;
    advert.description = Array.from(document.querySelector('div[itemprop=description]').children).map(p => p.textContent).join('\n');
    try {
      advert.price = +document.querySelector('.js-item-price').textContent.replace(/\s/g,'');
    }
    catch {
      advert.price = 'цена не указана';
    }
    if (document.querySelector('span.text-text-1PdBw')) advert.author = document.querySelector('span.text-text-1PdBw').textContent.replace(/\s/g,'');
    else advert.author = document.querySelector('.seller-info-name').textContent.replace(/\s/g,'');
    if (document.querySelector('.style-item-metadata-date-1y5w6')) advert.date = document.querySelector('.style-item-metadata-date-1y5w6').textContent.trim();
    else advert.date = document.querySelector('.title-info-metadata-item-redesign').textContent.trim();
    return advert;
  });
  advert.date = getDate(advert.date);
  advert.url = url;
  // await randDelay(1000, 2000);
  // advert.phone = await getPhoneNumber(url);
  return advert;
}

async function scraper(url) {
  puppeteerExtra.use(pluginStealth());
  const browser = await puppeteerExtra.launch({
    headless: true,
    devtools: true
  });
  const page = (await browser.pages())[0];
  const links = await getLinks(page, url);
  const advertsAmount = 5;
  let parsedCount = 0;

  await randDelay(2000, 3000);

  for (let i = 0; i < advertsAmount; i++) {
    try {
      const advert = await parsePage(page, links[i]);
      console.log(`[${i + 1}] / [${advertsAmount}]`);
      parsedCount++;
      await randDelay(1000, 2000);
    }
    catch {
      throw new Error('Something went wrong!');
    }
  }
  console.log(`Parsed successfully: [${parsedCount}] / [${advertsAmount}]`);
}

scraper('https://avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV');