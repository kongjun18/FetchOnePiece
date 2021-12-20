const fs = require('fs');
const path = require('path');
const https = require('https');
const axios = require('axios');
const puppeteer = require('puppeteer');

// ONE PIECE 第一话从 1081 开始，共 1034 话。
const CHROME_BIN = '/usr/bin/chromium'; // Linux 使用 chromium
const COMMIC_DIR = 'images'; // 漫画存放路径
const FAILED_URLS_FILE = 'failed-urls.txt'; // 下载失败的 url 存放路径
const FIRST_CHARPER = 1081; // 网站中第一话编号
const CHARPERS = 1034; // ONE PIECE 总话数
const DOWNLOADER = axios.create({httpsAgent: new https.Agent({ keepAlive: true })});

(async () => {
  // 创建 images 目录，存放抓取到的漫画。
  ensureDirExists(COMMIC_DIR);
  const browser = await puppeteer.launch({
    executablePath: CHROME_BIN, // Linux 使用 chromium 需要手动设置
    headless: true, // 无头模式
    timeout: 0, // 禁止超时
  });
  const page = await browser.newPage();
  page.setDefaultNavigationTimeout(0);
  // 抓取漫画的主循环
  for (let i = 0; i < CHARPERS; ++i) {
    let imageUrls; // do while 中定义
    do {
      await page.goto(`https://www.dashuhuwai.com/comic/hanghaiwang/read-${FIRST_CHARPER + i}.html`);
      await page.waitForSelector('#pic-list > .img_info', {timeout: 0}); // 禁止超时
      let picList = await page.$('#pic-list');
      const totalPages = Number(await picList.$eval(':scope .img_info', node => node.innerHTML.match(/.*\([1-9]+\/(?<pages>[0-9]+)\)/).groups['pages']));
      console.log(`ONE PIECE chapter ${i + 1} has ${totalPages} pages.`);

      // 滚动到底，加载全部漫画图片
      await autoScroll(page, totalPages);

      // 将图片列表转换为 url 数组
      imageUrls = await picList.$$eval(':scope img', elems => elems.map(elem => elem.getAttribute('src')));
      // 不知道为什么，有时候会出现最后一个元素是 undefined 的情况。
      // 若出现这种情况，则重新加载。
    } while (imageUrls.some(value => value === undefined || value === 'undefined'));


    // 下载漫画图片到 COMMIC_DIR
    const dir = ensureDirExists(path.join(COMMIC_DIR, String(i + 1)));
    for (let page = 0; page < imageUrls.length; ++page) {
      const url = imageUrls[page];
      downloadComicImage(
        dir,
        String(page + 1) + getExtname(url),
        url
      );
    }
  }
  await browser.close();
})();

/**
 * 自动滚动页面到最底部
 *
 * @async
 * @param {Page} page - puppeteer 创建的 page
 * @param {Number} totalPages - 标签页中漫画总页数（总图片数）
 * @returns {Promise<void>} 等待滚动完成
 * @note 参考了 https://github.com/chenxiaochun/blog/issues/38，感谢 chenxiaochun 的分享。
 */
async function autoScroll(page, totalPages){
  await page.evaluate(async (totalPages) => {
    let counter = 0;
    await new Promise((resolve) => {
      var distance = 300;
      var timer = setInterval(() => {
        window.scrollBy(0, distance);
        if (((++counter) % 10) == 0) {
          // 图片是否全部加载完成
          let imgList = document.querySelectorAll('#pic-list img');
          if(imgList.length >= totalPages){
            clearInterval(timer);
            resolve();
          } else {
            // 上滚一段距离，网站加载图片。
            window.scrollBy(0, -1000);
          }
        }
      }, 100);
    });
  }, totalPages);
}

/**
 * 从 url 下载图片
 *
 * @async
 * @param {String} dir - 文件存储目录
 * @param {String} file - 文件名，包含拓展。
 * @param {String} url - 图片 url
 * @returns {Promise<void>} 等待下载完成
 */
async function downloadComicImage(dir, file, url) {
  const f = path.join(dir, file);
  DOWNLOADER.get(url, {responseType: 'stream'})
    .then(response => {
      response.data.pipe(fs.createWriteStream(f));
      console.log(`Download ${url} to ${f}`);
    })
    .catch(() => fs.appendFileSync(FAILED_URLS_FILE, url));
}


/**
 * 从图片 url 获取拓展名（.png 或 .jpg）
 *
 * @param {String} url - 图片 url
 * @returns {String} 图片拓展名：.png 或 .jpg
 */
function getExtname(url) {
  const matched = url.match(/.*(?<extname>(?:png)|(?:jpg))/);
  return '.' + matched.groups['extname'];
}

/**
 * 确保目录存在。如不存在则创建
 *
 * @param {String} dir - 目录路径（相对路径或绝对路径）
 * @returns {String} 目录路径
 */
function ensureDirExists(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  return dir;
}

