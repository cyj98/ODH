async function sendtoBackend(request) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage(request, (result) => {
      resolve(result);
    });
  });
}

async function isConnected() {
  try {
    return await sendtoBackend({ action: 'isConnected', params: {} });
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function getTranslation(expression) {
  try {
    return await sendtoBackend({
      action: 'getTranslation',
      params: { expression },
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function addNote(notedef) {
  try {
    return await sendtoBackend({ action: 'addNote', params: { notedef } });
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function findNotes(expression) {
  try {
    return await sendtoBackend({
      action: 'findNotes',
      params: { expression },
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}

async function guiBrowse(expression) {
  try {
    return await sendtoBackend({
      action: 'guiBrowse',
      params: { expression },
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}
