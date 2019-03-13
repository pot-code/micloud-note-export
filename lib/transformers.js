function Note(id, modifyDate, contentArray) {
  if (!(this instanceof Note)) return new Note(id, modifyDate, contentArray);
  this.id = id;
  this.modifyDate = modifyDate;
  this.contentArray = contentArray;
}

/**
 * may modify the orignal array
 * @param {Array<string>} contentArray array that contains lines
 */
function RichText(contentArray) {
  let contents = [];
  let texts = [];// for creating "text" field data
  let firstLine = contentArray.shift();

  if (firstLine.length > 5) {
    contentArray.unshift(firstLine.substring(5));// slice the overflow part, append it to the top of array
    firstLine = firstLine.substring(0, 5);
  }
  texts.push('# ' + firstLine);
  contents.push({
    text: firstLine + '\n',
    attributes: {
      line: { header: 1 }
    }
  });
  if (contentArray.length > 0) {
    contents.push({ text: '\n' });
    
    let lastContent = '';
    for (let i = 0; i < contentArray.length; i++) {
      if (i > 0) lastContent += '\n\n';
      lastContent += contentArray[i];
      texts.push(contentArray[i]);
    }
    contents.push({ text: lastContent });
  }

  this.contents = contents;
  this.texts = texts;
  this.meta = {
    version: RichText.version
  };
}

RichText.version = 1;
RichText.prototype.toString = function () {
  let meta = this.meta;
  let contents = this.contents;

  return JSON.stringify({ meta, contents });
}
RichText.prototype.toTextString = function () {
  return this.texts.join('\n\n');
}

function createDayOneEntry(id, date, contentArray, options) {
  let richText = new RichText(contentArray);

  options = options || {};
  date = modifyDateToISO(date);
  return {
    uuid: id,
    modifiedDate: date,
    creationDate: date,
    text: richText.toTextString(),
    ...options,
    starred: false,
    richText: richText.toString(),
    duration: 0
  };
}

function escapeQuotesAndSlash(str) {
  return JSON.stringify(str.replace(/\n/g, '\\n'));
}

function modifyDateToISO(modifyDate) {
  let values = modifyDate.match(/\d+/g);

  values[1] -= 1;
  return new Date(...values).toISOString().substring(0, 19) + 'Z';
}

// TODO: 讓 Transformer 包含 loads 和 toNotes 方法，loads 將 Note 對象變為 HTML 格式數據
// toNotes 將 HTML 格式數據變回 Note 對象
/**
 * Transformer interface
 * @param {string} name name of transformer
 */
function Transformer(name) {
  this.name = name;
}

Transformer.prototype.loads = function (notes) { };
Transformer.prototype.toNotes = function (dataArray) { };

// Transformer implementations
function HTMLTransformer() {
  Transformer.call(this, 'HTMlTransformer');
}

HTMLTransformer.prototype.loads = function (notes) {
  return notes.map(note => {
    let content = '<div>\n';

    for (let line of note.contentArray) {
      content = content + line + '\n' + '<br>' + '\n';
    }
    content += '</div>';
    return {
      id: note.id,
      title: note.contentArray[0],
      modifyDate: note.modifyDate,
      content: content
    }
  });
}

function DayOneTransformer(options) {
  Transformer.call(this, 'DayOneTransformer');
  options = options || {};

  let _options = {
    creationDevice: options.creationDevice || 'Pot\'s iPhoon',
    creationDeviceModel: options.deviceModel || 'iPhone11,8',
    creationDeviceType: options.creationDeviceType || 'iPhone',
    creationOSVersion: options.creationOSVersion || '12.1',
    creationOSName: options.creationOSName || 'iOS',
    timeZone: options.timeZone || 'Asia\\\/Shanghai',
  };

  this.options = _options;
}

DayOneTransformer.metadata = {
  version: '1.0'
};
DayOneTransformer.prototype.loads = function (notes) {
  let entries = notes.map(note => createDayOneEntry(note.id, note.modifyDate, note.contentArray, this.options));
  let metadata = DayOneTransformer.metadata;
  
  return { metadata, entries };
}

exports.Note = Note;
exports.HTMLTransformer = HTMLTransformer;
exports.DayOneTransformer = DayOneTransformer;
