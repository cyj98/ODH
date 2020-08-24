/* global api */
class enen_Collins {
    constructor(options) {
        this.options = options
        this.maxexample = 2
        this.word = ''
    }

    async displayName() {
        let locale = await api.locale()
        if (locale.indexOf('CN') != -1) return 'The Free Dictionary英英词典'
        if (locale.indexOf('TW') != -1) return 'The Free Dictionary英英詞典'
        return 'The Free Dictionary'
    }

    setOptions(options) {
        this.options = options
        this.maxexample = options.maxexample
    }

    async findTerm(word) {
        this.word = word
        //let deflection = api.deinflect(word);
        let results = await Promise.all([this.findTheFreeDictionary(word)])
        return [].concat(...results).filter((x) => x)
    }

    async findTheFreeDictionary(word) {
        let notes = []
        if (!word) return notes // return empty notes

        function T(node) {
            if (!node) return ''
            else return node.innerText.trim()
        }

        let base = 'https://idioms.thefreedictionary.com/'
        let url = base + encodeURIComponent(word)
        let doc = ''
        try {
            let data = await api.fetch(url)
            let parser = new DOMParser()
            doc = parser.parseFromString(data, 'text/html')
        } catch (err) {
            return []
        }

        const contentHolder = doc.querySelector('.content-holder')

        const sections = contentHolder.querySelectorAll('section')
        if (!sections) return notes

        const expression = contentHolder.querySelector('h1')

        if (expression.split(' ').length > 1) {
            // const UKsound = contentHolder.querySelector('span.i.snd-icon-UK')
            // const USsound = contentHolder.querySelector('span.i.snd-icon-US')
            // const audios = [].push(UKsound, USsound)
        }

        // let dictionary = doc.querySelector('.content-holder >')
        // if (!dictionary) return notes // return empty notes

        // let expression = T(dictionary.querySelector('.h2_entry'))
        // let reading = T(dictionary.querySelector('.pron'))

        // let band = dictionary.querySelector('.word-frequency-img')
        // let bandnum = band ? band.dataset.band : ''
        // let extrainfo = bandnum
        //     ? `<span class="band">${'\u25CF'.repeat(Number(bandnum))}</span>`
        //     : ''

        // let sound = dictionary.querySelector('a.hwd_sound')
        // let audios = sound ? [sound.dataset.srcMp3] : []

        // make definition segement
        let definitions = []
        // let defblocks = dictionary.querySelectorAll('.hom') || []
        let defblocks =
            sections[0].querySelector('ds-single') ||
            sections[0].querySelectorAll('ds-list')
        for (const defblock of defblocks) {
            let pos = T(defblock.querySelector('i:first-of-type'))
            // pos.textContent
            pos = pos ? `<span class="pos">${pos.innerText}</span>` : ''
            // let eng_tran = T(defblock.querySelector('.sense .def'))
            let eng_tran = T(
                defblock.querySelector('.sds-list')
                    ? defblock.querySelector('.sds-list')
                    : ''
            )
            if (!eng_tran) continue
            let definition = ''
            eng_tran = eng_tran.replace(RegExp(expression, 'gi'), '<b>$&</b>')
            eng_tran = `<span class='eng_tran'>${eng_tran}</span>`
            let tran = `<span class='tran'>${eng_tran}</span>`
            definition += `${pos}${tran}`

            // make exmaple segement
            let examp = defblock.querySelectorAll('span.illustration') || ''
            let eng_examp = T(examp)
                ? T(examp).replace(RegExp(expression, 'gi'), '<b>$&</b>')
                : ''
            definition += eng_examp
                ? `<li class='sent'><span class='eng_sent'>${eng_examp}</span></li>`
                : ''
            definition && definitions.push(definition)
        }
        console.log(expression, definitions)
        let css = this.renderCSS()
        notes.push({
            css,
            expression,
            // reading,
            // extrainfo,
            definitions,
            // audios,
        })
        return notes
    }

    renderCSS() {
        let css = `
            <style>
                span.band {color:#e52920;}
                span.pos  {text-transform:lowercase; font-size:0.9em; margin-right:5px; padding:2px 4px; color:white; background-color:#0d47a1; border-radius:3px;}
                span.tran {margin:0; padding:0;}
                span.eng_tran {margin-right:3px; padding:0;}
                span.chn_tran {color:#0d47a1;}
                ul.sents {font-size:0.8em; list-style:square inside; margin:3px 0;padding:5px;background:rgba(13,71,161,0.1); border-radius:5px;}
                li.sent  {margin:0; padding:0;}
                span.eng_sent {margin-right:5px;}
                span.chn_sent {color:#0d47a1;}
            </style>`
        return css
    }
}
