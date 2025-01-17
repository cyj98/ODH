// /* global spell */
function getImageSource(id) {
  return document.querySelector(`#${id}`).src;
}

function registerAddNoteLinks() {
  for (let link of document.getElementsByClassName('odh-addnote')) {
    if (link.src === 'good.png') return;
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = e.currentTarget.dataset;
      e.currentTarget.src = getImageSource('load');
      window.parent.postMessage(
        {
          action: 'addNote',
          params: {
            nindex: ds.nindex,
            dindex: ds.dindex,
            // context: document.querySelector('.spell-content')
            // .innerHTML,
          },
        },
        '*',
      );
    });
  }
}

function registerGuiBrowseLinks() {
  for (let link of document.getElementsByClassName('odh-guibrowse')) {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = e.currentTarget.dataset;
      window.parent.postMessage(
        {
          action: 'guiBrowse',
          params: {
            nindex: ds.nindex,
          },
        },
        '*',
      );
    });
  }
}

function registerAudioLinks() {
  for (let link of document.getElementsByClassName('odh-playaudio')) {
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = e.currentTarget.dataset;
      window.parent.postMessage(
        {
          action: 'playAudio',
          params: {
            nindex: ds.nindex,
            dindex: ds.dindex,
          },
        },
        '*',
      );
    });
  }
}

function registerSoundLinks() {
  for (let link of document.getElementsByClassName('odh-playsound')) {
    link.setAttribute('src', getImageSource('play'));
    link.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      const ds = e.currentTarget.dataset;
      window.parent.postMessage(
        {
          action: 'playSound',
          params: {
            sound: ds.sound,
          },
        },
        '*',
      );
    });
  }
}

// function initSpellnTranslation() {
//     document.querySelector('#odh-container').appendChild(spell())
//     document.querySelector('.spell-content').innerHTML = document.querySelector(
//         '#context'
//     ).innerHTML
//     document.querySelector(
//         '.spell-content'
//     ).textContent = document.querySelector('#context').innerHTML
//     if (document.querySelector('#monolingual').innerText == '1')
//         hideTranslation()
// }

function registerHiddenClass() {
  for (let div of document.getElementsByClassName('odh-definition')) {
    div.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      hideTranslation();
    });
  }
}

function hideTranslation() {
  let className = 'span.chn_dis, span.chn_tran, span.chn_sent, span.tgt_tran, span.tgt_sent'; // to add your bilingual translation div class name here.
  for (let div of document.querySelectorAll(className)) {
    div.classList.toggle('hidden');
  }
}

function onDomContentLoaded() {
  registerAddNoteLinks();
  registerGuiBrowseLinks();
  registerAudioLinks();
  registerSoundLinks();
  registerHiddenClass();
  // initSpellnTranslation()
}

function onMessage(e) {
  const { action, params } = e.data;
  const method = window['api_' + action];
  if (typeof method === 'function') {
    method(params);
  }
}

function api_setActionState(result) {
  const { response, params } = result;
  // const { nindex, dindex } = params;
  const { nindex } = params;

  // const match = document.querySelector(`.odh-addnote[data-nindex="${nindex}"].odh-addnote[data-dindex="${dindex}"]`);
  const match = document.querySelector(`.odh-addnote[data-nindex="${nindex}"]`);
  if (response) {
    const guiBrowseMatch = document.querySelector(`.odh-guibrowse[data-nindex="${nindex}"]`);
    guiBrowseMatch.style.visibility = 'visible';
    match.src = getImageSource('good');
    match.style.cursor = 'not-allowed';
    match.style.opacity = 0.5;
    const newElement = match.cloneNode(true);
    match.parentNode.replaceChild(newElement, match);
  } else {
    match.src = getImageSource('fail');
    setTimeout(() => {
      match.src = getImageSource('plus');
    }, 1000);
  }
}

function onMouseWheel(e) {
  document.querySelector('html').scrollTop -= e.wheelDeltaY / 3;
  document.querySelector('body').scrollTop -= e.wheelDeltaY / 3;
  e.preventDefault();
}

document.addEventListener('DOMContentLoaded', onDomContentLoaded, false);
window.addEventListener('message', onMessage);
window.addEventListener('wheel', onMouseWheel, { passive: false });
