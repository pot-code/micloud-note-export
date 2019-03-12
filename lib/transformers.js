function Note(id, modifyDate, contentArray) {
  if (!(this instanceof Note)) return new Note(id, modifyDate, contentArray);
  this.id = id;
  this.modifyDate = modifyDate;
  this.contentArray = contentArray;
}

function escapeQuotesAndSlash(str) {
  return JSON.stringify(str.replace(/\n/g, '\\n'));
}

exports.Note = Note;

exports.HTMLTransformer = function (note) {
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
  };
}

exports.DayOneTransformer = function (note) {
  // TODO
}
