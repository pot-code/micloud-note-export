function Note(id, modifyDate, contentArray) {
  if (!(this instanceof Note)) return new Note(id, modifyDate, contentArray);
  this.id = id;
  this.modifyDate = modifyDate;
  this.contentArray = contentArray;
}

function parseToNote (noteRoot) {
  let id = noteRoot.getAttribute('data-note-id');
  let modifyDate = noteRoot.firstElementChild.firstElementChild.title;
  let contentArray = Array.from(noteRoot.firstElementChild.nextElementSibling.childNodes).filter(e => e.nodeType === Node.TEXT_NODE).map(tn => tn.data.trim()).filter(Boolean);

  return new Note(id, modifyDate, contentArray);
}
