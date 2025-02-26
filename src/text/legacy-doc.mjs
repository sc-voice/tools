import { DBG } from '../defines.mjs';

let privateCtor = false;

const HTML_FILTER = (() => {
  let prefixes = [
    '<!DOCTYPE',
    '<html',
    '<head',
    '</html',
    '<meta',
    '<title',
    '</head',
    '<body',
    '</body',
    '<article',
    '</article',
  ].join('|');
  let pat = `^(${prefixes}).*> *$`;
  return new RegExp(pat);
})();

export class LegacyDoc {
  constructor(opts = {}) {
    const msg = 'LegacyDoc.ctor:';
    if (!privateCtor) {
      throw new Error(`${msg} use LegacyDoc.create()`);
    }
    Object.assign(this, opts);
  }

  static filterHtml(line) {
    if (HTML_FILTER.test(line)) {
      return false;
    }

    return true;
  }

  static legacyUrl(opts = {}) {
    let {
      endPoint = 'https://suttacentral.net/api/suttas',
      sutta_uid,
      lang,
      author,
    } = opts;

    return [endPoint, sutta_uid, `${author}?lang=${lang}`].join('/');
  }

  static async fetchLegacy(opts = {}) {
    const msg = 'L7c.fetchLegacy:';
    const dbg = DBG.L7C_FETCH_LEGACY;
    let { maxBuffer = 10 * 1024 * 1024, cache } = opts;
    let url = LegacyDoc.legacyUrl(opts);
    let res;
    if (cache) {
      res = cache(url);
      dbg && console.log(msg, '[1]cached', res.ok);
    } else {
      res = await fetch(url, { maxBuffer });
      dbg && console.log(msg, '[2]scapi', res.ok);
    }
    if (!res.ok) {
      throw new Error(`${msg} ${res.status} ${url}`);
    }
    let json = await res.json();
    let { translation } = json;
    return LegacyDoc.create(translation);
  }

  static create(translation) {
    const msg = 'LegacyDoc.create:';
    if (typeof legacy === 'string') {
      legacy = JSON.parse(legacy);
    }

    let { uid, lang, title, author, author_uid, text } = translation;
    if (typeof text === 'string') {
      text = text.split('\n');
    }

    let para;
    let lines = text.filter((line) => !HTML_FILTER.test(line));
    lines = lines
      .join(' ')
      .replace(/<\/p> */g, '')
      .replace(/<h.*sutta-title.>(.*)<\/h1> /, '$1')
      .split('<p>');
    let footer = [];
    lines.forEach((line, i) => {
      if (/<footer>/.test(line)) {
        let f = line.replace(/.*<footer>(.*)<.footer>.*/, '$1');
        footer.push(f);
        lines[i] = line.replace(/<footer>.*<.footer>/, '');
      }
      lines[i] = lines[i].trim();
    });
    footer = footer.join(' ');

    let opts = {
      uid,
      lang,
      title,
      author,
      author_uid,
      footer,
      lines,
    };

    privateCtor = true;
    let ldoc = new LegacyDoc(opts);
    privateCtor = false;

    return ldoc;
  }
}
