const puppeteer = require('puppeteer-core');
const { rli, question } = require('./readline_helper');
const fs = require('fs')
const { join } = require('path');

// Exceptions
const COOKIE_INVALID = 'The cookies are invalid or give it another try due to the network timeout.';
const COOKIE_FILE_NOT_PRESENT = 'Cookie data file not specified or not exists, usage: node index.js COOKIE_DATA_FILE';

let broswer;// global reference, for further closing.
let unexpected_operation = false;

// modify default behaviors of console
const log = function () {
  console.log.call(console, '[INFO]:', ...arguments);
};
const error = function () {
  console.error.call(console, '[ERROR]:', ...arguments);
};

function write_to_file(data, out_stream) {
  return new Promise((res, rej) => {
    out_stream.write(data, err => {
      if (err) rej(err);
      res(true);
    });
  })
}

async function crawl(id, token){
	broswer = await puppeteer.launch({
		headless: true,
		executablePath: '/Applications/Chromium.app/Contents/MacOS/Chromium',
	});
  const page = await broswer.newPage();

  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/11.1.2 Safari/605.1.15');
  await page.setCookie({
      // serviceToken 才是核心, 每次登陆时获取填入
      name: 'serviceToken',
      value: token,
      domain: '.i.mi.com'
    }, {
      name: 'userId',
      value: id, // 小米账号 ID
      domain: '.mi.com'
    }
  );
  await page.goto('https://i.mi.com/v1#note');

  let contentArray;
  try{
    contentArray = await page.evaluate(()=>{
      function transformer(node) {
        if (node.nodeType === Node.TEXT_NODE) {
          let data = node.data.trim();
  
          if (data) return '<div>' + data + '</div>';
          else return '';
        }
        return '<br>';
      }
  
      function accumulator(acc, node, index){
        if (index === 0) return acc;
        return acc + transformer(node);
      }
      return Array.from(document.getElementsByTagName('iframe')[1].contentDocument.getElementsByClassName('js_note_brief note-brief js_normal_note'))
        .map(e => {
          let modifiedDate = e.getElementsByClassName('js_modify_date modify-date')[0].getAttribute('title');
          let childNodes = Array.from(e.getElementsByClassName('js_snippet js_note_brief_bd note-brief-bd')[0].childNodes);
  
          const title = childNodes[0].data.trim();
          let body = '<div>' + childNodes.reduce(accumulator, '') + '</div>';
          body = body === "<div><br></div>" ? "" : body;
          return { modifiedDate, title, body };
        });
    });
  } catch (err) {
    log(COOKIE_INVALID);
    throw err;
  }

  await broswer.close();
  return JSON.stringify(contentArray, null, 2);
}

async function main() {
  // fetch cookie data from file
  let cookie_file_path = process.argv[2];
  if (!cookie_file_path) {
    cookie_file_path = join(__dirname, 'cookie.txt');
  }
  if (!fs.existsSync(cookie_file_path)) {
    unexpected_operation = true;
    error(COOKIE_FILE_NOT_PRESENT);
    return;
  }
  const cookie_input = fs.createReadStream(cookie_file_path, 'utf8');
  const fetch_cookie_promise = new Promise((res, rej) => {
    let cookie = '';
    cookie_input.on('data', (chunk) => {
      cookie += chunk;
    });
    cookie_input.on('error', (err) => {
      if(err) rej(err);
    });
    cookie_input.once('end', () => {
      cookie_input.close();// release fd
      res(cookie);
    });
  });
  let cookie_string;
  try {
    cookie_string = await fetch_cookie_promise;
  } catch (err) {
    cookie_input.close();
    throw err;
  }
  let cookies = cookie_string.split(/\n/);

  // output setup
  const output_file = join(__dirname, 'output.json');
  let overwrite_flag = true;
  if (fs.existsSync(output_file)) {
    overwrite_flag = await question('The output.json file is already present, are you sure to overwrite it?');
  }
  if (overwrite_flag) {// write to output.json anyway
    const output = fs.createWriteStream(output_file, 'utf8');
    try {
      const JSON_string = await crawl(cookies[0], cookies[1]);

      await write_to_file(JSON_string, output);
    } catch (err) {
      throw err;
    } finally {
      // cleanup
      output.close();
      cookie_input.close();
    }
  }
}

main().then(() => {
  rli.close();
  if (!unexpected_operation) log('done!');
}).catch(err => {
  console.trace(err);
  rli.close();
  broswer.close();
});
