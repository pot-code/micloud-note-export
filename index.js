const puppeteer = require('puppeteer-core');
const fs = require('fs')
const { join } = require('path');

const { rli, question, HTMLTransformer, DayOneTransformer } = require('./lib');

// Exceptions
const COOKIE_INVALID = 'The cookies are invalid or give it another try due to the network timeout.';
const COOKIE_FILE_NOT_PRESENT = 'Cookie data file not specified or not exists, usage: node index.js COOKIE_DATA_FILE';

let browser;// global reference, for further closing.
let hasUnexpectedOperation = false;

// wrap default behaviors of console
const log = function () {
  console.log.call(console, '[INFO]:', ...arguments);
};
const error = function () {
  console.error.call(console, '[ERROR]:', ...arguments);
};

function writeToFile(data, outStream) {
  return new Promise((res, rej) => {
    outStream.write(data, err => {
      if (err) rej(err);
      res(true);
    });
  })
}

function getCookies(cookieFilePath) {
  const cookieInput = fs.createReadStream(cookieFilePath, 'utf8');
  return new Promise((res, rej) => {
    let cookie = '';
    cookieInput.on('data', (chunk) => {
      cookie += chunk;
    });
    cookieInput.on('error', (err) => {
      if (err) rej(err);
    });
    cookieInput.once('end', () => {
      res(cookie);
    });
  });
}

async function crawl(id, token, transformer) {
  browser = await puppeteer.launch({
    headless: true,
    executablePath: '/Applications/Chromium.app/Contents/MacOS/Chromium',
  });
  log('(headless)browser launched');
  const page = await browser.newPage();

  //TODO: hard-coded agent string
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15');
  await page.setCookie({
    name: 'serviceToken',
    value: token,
    domain: '.i.mi.com'
  }, {
      name: 'userId',
      value: id,
      domain: '.mi.com'
    }
  );
  await page.goto('https://i.mi.com/v1#note');
  log('connection to micloud established');

  let noteArray;
  // inject script
  await page.addScriptTag({ path: join(__dirname, 'core.js') });
  try {
    noteArray = await page.evaluate(async () => {
      let noteRoots = Array.from(document.getElementById('js_note_mod_ctn').contentDocument.getElementsByClassName('js_note_brief note-brief js_normal_note'));

      return noteRoots.map(parseToNote);
    });
  } catch (err) {
    error(COOKIE_INVALID);
    throw err;
  }
  // filter out the note whose contentArray is empty
  noteArray = noteArray.filter(note => note.contentArray.length > 0);
  noteArray = transformer.loads(noteArray);

  await browser.close();
  return JSON.stringify(noteArray, null, 2);
}

async function main() {
  // TODO: 責任鏈模式解析 process.argv
  // fetch cookie data from file
  let cookieFilePath = process.argv[2];
  if (!cookieFilePath) {
    cookieFilePath = join(__dirname, 'cookie.txt');
  }
  log('validating cookie file...');
  if (!fs.existsSync(cookieFilePath)) {
    hasUnexpectedOperation = true;
    error(COOKIE_FILE_NOT_PRESENT);
    return;
  }
  log('parsing cookies...');
  let cookieString = await getCookies(cookieFilePath);
  let cookies = cookieString.split(/\n/);

  // output setup
  const outputFile = join(__dirname, 'output.json');
  let overwriteFlag = true;
  if (fs.existsSync(outputFile)) {
    overwriteFlag = await question('The output.json file is already present, are you sure to overwrite it?');
  }
  if (overwriteFlag) {// write to output.json anyway
    log('preparing to write data...');
    const output = fs.createWriteStream(outputFile, 'utf8');
    const transformer = new DayOneTransformer();
    try {
      const JSONString = await crawl(cookies[0], cookies[1], transformer);

      await writeToFile(JSONString, output);
    } catch (err) {
      throw err;
    } finally {
      // cleanup
      output.close();
    }
  }
}

main().then(() => {
  rli.close();
  if (!hasUnexpectedOperation) log('done!');
}).catch(err => {
  console.trace(err);
  rli.close();
  browser.close();
});
