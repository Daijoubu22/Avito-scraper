"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var puppeteer = require('puppeteer');
var puppeteerExtra = require('puppeteer-extra');
var pluginStealth = require('puppeteer-extra-plugin-stealth');
var iPhone = puppeteer.devices['iPhone 6'];
var fs = require('fs/promises');
var months = require('./months');
var randDelay = function (min, max) {
    return new Promise(function (resolve) {
        setTimeout(resolve, Math.random() * (max - min) + min);
    });
};
var checkLoggedIn = function (page) { return __awaiter(void 0, void 0, void 0, function () {
    var isLoggedIn;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, page.evaluate(function () {
                    if (document.querySelector('.index-services-menu-link-not-authenticated-Pzomx'))
                        return false;
                    return true;
                })];
            case 1:
                isLoggedIn = _a.sent();
                return [2 /*return*/, isLoggedIn];
        }
    });
}); };
var getDate = function (str) {
    var arr = str.split(' ');
    var date = new Date();
    var key = 1;
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
};
var getLinks = function (page, url, limit) { return __awaiter(void 0, void 0, void 0, function () {
    var links, pagesNumber, i, linksPerPage, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                links = [];
                console.log('Prepearing links...');
                return [4 /*yield*/, page.evaluate(function () {
                        return +document.querySelector('.pagination-root-Ntd_O').lastChild.previousSibling.textContent;
                    })];
            case 1:
                pagesNumber = _a.sent();
                i = 1;
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, page.evaluate(function () {
                        return Array.from(document.querySelectorAll('a.iva-item-title-py3i_')).map(function (link) { return link.href; });
                    })];
            case 3:
                linksPerPage = _a.sent();
                links.push.apply(links, linksPerPage);
                return [3 /*break*/, 5];
            case 4:
                err_1 = _a.sent();
                console.log(err_1.message);
                return [3 /*break*/, 5];
            case 5:
                console.log("Page: [".concat(i, "] / [").concat(pagesNumber, "]"));
                if ((i++ >= pagesNumber) || (links.length >= limit))
                    return [3 /*break*/, 9];
                return [4 /*yield*/, randDelay(2000, 3000)];
            case 6:
                _a.sent();
                return [4 /*yield*/, page.goto("".concat(url, "?p=").concat(i))];
            case 7:
                _a.sent();
                _a.label = 8;
            case 8:
                if (true) return [3 /*break*/, 2];
                _a.label = 9;
            case 9:
                console.log('Links are ready!\n');
                return [2 /*return*/, links];
        }
    });
}); };
var parsePage = function (page, url, isLoggedIn) { return __awaiter(void 0, void 0, void 0, function () {
    var advert, err, _a, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, page.goto(url, { waitUntil: 'domcontentloaded' })];
            case 1:
                _b.sent();
                return [4 /*yield*/, page.evaluate(function () {
                        var advert = {};
                        advert.title = document.querySelector('.mav-1cepbnp > h1 > span').textContent;
                        advert.description = document.querySelector('._nTsP').textContent;
                        advert.price = +document.querySelector('.vDskN').textContent.replace(/\s|₽/g, '');
                        advert.author = document.querySelector('.UZhDR').textContent;
                        advert.date = document.querySelector('.DeUoO').textContent.trim().replace(',', '');
                        return advert;
                    })];
            case 2:
                advert = _b.sent();
                advert.date = getDate(advert.date);
                advert.url = url;
                if (!!isLoggedIn) return [3 /*break*/, 4];
                advert.phone = null;
                return [4 /*yield*/, randDelay(3000, 4000)];
            case 3:
                _b.sent();
                return [2 /*return*/, advert];
            case 4:
                _b.trys.push([4, 9, , 10]);
                return [4 /*yield*/, randDelay(4000, 5000)];
            case 5:
                _b.sent();
                return [4 /*yield*/, page.evaluate(function () {
                        if (!document.querySelector('button.mav-12zz5z0'))
                            return true;
                        document.querySelector('button.mav-12zz5z0').click();
                        return false;
                    })];
            case 6:
                err = _b.sent();
                if (err)
                    throw new Error('The seller has hidden phone number. URL:\n' + url);
                return [4 /*yield*/, page.waitForSelector('.mWxO4, .QZvpq')];
            case 7:
                _b.sent();
                _a = advert;
                return [4 /*yield*/, page.evaluate(function () {
                        if (document.querySelector('.QZvpq'))
                            return null;
                        return document.querySelector('.mWxO4').textContent;
                    })];
            case 8:
                _a.phone = _b.sent();
                if (!advert.phone)
                    throw new Error('Phone number is temporarily hidden, too many requests. URL:\n' + url);
                advert.phone = advert.phone.replace(/\s|\+|\-/g, '');
                return [3 /*break*/, 10];
            case 9:
                err_2 = _b.sent();
                console.log(err_2.message);
                advert.phone = null;
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/, advert];
        }
    });
}); };
function scrape(url, limit) {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page, cookiesString, cookies, isLoggedIn, links, advertsAmount, parsedCount, adverts, i, advert;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    puppeteerExtra.use(pluginStealth());
                    return [4 /*yield*/, puppeteerExtra.launch({
                            headless: true
                        })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.pages()];
                case 2:
                    page = (_a.sent())[0];
                    return [4 /*yield*/, fs.readFile('./cookies.json')];
                case 3:
                    cookiesString = _a.sent();
                    cookies = JSON.parse(cookiesString);
                    return [4 /*yield*/, page.setCookie.apply(page, cookies)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'domcontentloaded' })];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, checkLoggedIn(page)];
                case 6:
                    isLoggedIn = _a.sent();
                    if (!isLoggedIn)
                        console.log('\x1b[31m%s\x1b[0m', 'Warning: you are not logged in to the site, so you will not receive phone numbers!\n');
                    return [4 /*yield*/, getLinks(page, url, limit)];
                case 7:
                    links = _a.sent();
                    advertsAmount = links.length;
                    parsedCount = 0;
                    adverts = [];
                    return [4 /*yield*/, page.close()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 9:
                    page = _a.sent();
                    return [4 /*yield*/, page.emulate(iPhone)];
                case 10:
                    _a.sent();
                    return [4 /*yield*/, page.setDefaultTimeout(10000)];
                case 11:
                    _a.sent();
                    if (limit && (limit < advertsAmount))
                        advertsAmount = limit;
                    i = 0;
                    _a.label = 12;
                case 12:
                    if (!(i < advertsAmount)) return [3 /*break*/, 15];
                    return [4 /*yield*/, parsePage(page, links[i], isLoggedIn)];
                case 13:
                    advert = _a.sent();
                    adverts.push(advert);
                    fs.writeFile('adverts.json', JSON.stringify(adverts, null, ' '));
                    if (advert.phone)
                        parsedCount++;
                    console.log("[".concat(i + 1, "] / [").concat(advertsAmount, "]"));
                    _a.label = 14;
                case 14:
                    i++;
                    return [3 /*break*/, 12];
                case 15:
                    console.log("Parsed successfully: [".concat(parsedCount, "] / [").concat(advertsAmount, "]"));
                    browser.close();
                    return [2 /*return*/];
            }
        });
    });
}
scrape('https://avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV', 100);
