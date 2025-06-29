import util from 'node:util';
import { DBG } from '../defines.mjs';
import { Unicode } from './unicode.mjs';
const { COLOR_CONSOLE: C10E } = DBG;

const { RED_X: URX, CHECKMARK: UOK } = Unicode;

const {
  BLACK,
  WHITE,
  RED,
  GREEN,
  BLUE,
  CYAN,
  MAGENTA,
  YELLOW,
  BRIGHT_BLACK,
  BRIGHT_WHITE,
  BRIGHT_RED,
  BRIGHT_GREEN,
  BRIGHT_BLUE,
  BRIGHT_CYAN,
  BRIGHT_MAGENTA,
  BRIGHT_YELLOW,
  NO_COLOR,
} = Unicode.LINUX_COLOR;

let CC;

class Props {
  constructor(obj) {
    let entries = Object.entries(obj);

    Object.assign(this, {
      obj,
      entries,
      i: 0,
      done: false,
      value: undefined,
      key: undefined,
      emitKey: true,
    });
  }

  [Symbol.iterator]() {
    return this;
  }

  next() {
    const msg = 'p3s.next';
    const dbg = C10E.PROPS_NEXT;
    let { entries, i, emitKey, done } = this;
    let value;
    let entry = entries[i];
    if (i < entries.length) {
      if (emitKey) {
        value = entry[0] + ':';
      } else {
        value = entry[1];
        dbg > 1 && CC.ok(msg, 'emitKey', value);
        switch (typeof value) {
          case 'object': {
            if (value instanceof Array) {
              dbg > 1 && CC.ok(msg, 'Array', value);
              value = value === null ? null : JSON.stringify(value);
            } else if (value && value.toString !== {}.toString) {
              dbg > 1 && CC.ok(msg, 'toString', value);
              value = value.toString();
            } else {
              dbg > 1 && CC.ok(msg, 'object', value);
              value = value === null ? null : JSON.stringify(value);
            }
            break;
          }
          case 'function':
            dbg > 1 && CC.ok(msg, 'function', value);
            value = `[Function ${value.name}]`;
            break;
          default:
            dbg > 1 && CC.ok(msg, 'default', value);
            break;
        }
      }
      if (!emitKey) {
        this.i++;
      }
      this.emitKey = !this.emitKey;
    } else {
      done = true;
    }
    this.value = value;
    dbg && CC.ok1(msg + UOK, { done, value });

    return { done, value };
  }
} // Props

export class ColorConsole {
  constructor(opts = {}) {
    let {
      badColor1 = BRIGHT_RED,
      badColor2 = RED,
      fyiColor1 = BRIGHT_WHITE,
      fyiColor2 = BRIGHT_BLACK,
      okColor1 = BRIGHT_GREEN,
      okColor2 = GREEN,
      tagColor1 = BRIGHT_MAGENTA,
      tagColor2 = MAGENTA,
      valueColor = CYAN,
      dateFormat = new Intl.DateTimeFormat(undefined, {
        dateStyle: 'short',
      }),
      precision = 3,
      write = (...args) => console.log.call(null, ...args),
    } = opts;

    Object.assign(this, {
      badColor1,
      badColor2,
      dateFormat,
      fyiColor1,
      fyiColor2,
      okColor1,
      okColor2,
      tagColor1,
      tagColor2,
      precision,
      valueColor,
      write,
    });
  }

  static get URX() {
    return URX;
  }

  static get UOK() {
    return UOK;
  }

  static get cc() {
    CC = CC || new ColorConsole();
    return CC;
  }

  static utilColor(ansiColor) {
    switch (ansiColor) {
      case BLACK:
        return 'black';
      case WHITE:
        return 'white';
      case RED:
        return 'red';
      case GREEN:
        return 'green';
      case BLUE:
        return 'blue';
      case CYAN:
        return 'cyan';
      case MAGENTA:
        return 'magenta';
      case YELLOW:
        return 'yellow';
      case BRIGHT_BLACK:
        return 'blackBright';
      case BRIGHT_WHITE:
        return 'whiteBright';
      case BRIGHT_RED:
        return 'redBright';
      case BRIGHT_GREEN:
        return 'greenBright';
      case BRIGHT_BLUE:
        return 'blueBright';
      case BRIGHT_CYAN:
        return 'cyanBright';
      case BRIGHT_MAGENTA:
        return 'magentaBright';
      case BRIGHT_YELLOW:
        return 'yellowBright';
      case NO_COLOR:
        return 'noColor';
    }
  }

  props(obj) {
    return new Props(obj);
  }

  writeColor(color, rest) {
    let { styles, defaultOptions } = util?.inspect || {};
    if (styles) {
      let oldStyles = Object.assign({}, styles);
      let oldColors = defaultOptions.colors;
      defaultOptions.colors = true;
      let valueColor = ColorConsole.utilColor(this.valueColor);
      let textColor = ColorConsole.utilColor(color);
      styles.bigint = valueColor;
      styles.boolean = valueColor;
      styles.date = valueColor;
      //styles.name = textColor;
      styles.module = 'underline';
      styles.null = valueColor;
      styles.number = valueColor;
      styles.regexp = valueColor;
      styles.special = valueColor;
      styles.string = valueColor;
      //styles.undefined = valueColor;

      this.write(...this.color(color, ...rest));

      Object.assign(util.inspect.styles, oldStyles);
      defaultOptions.colors = oldColors;
    } else {
      this.write(...this.color(color, ...rest));
    }
  }

  isOk(thing, tf) {
    if (tf === undefined) {
      tf = thing;
    }

    let v = this.asString(thing);
    let color = tf ? this.okColor2 : this.badColor2;
    return color + v;
  }

  asString(thing) {
    const msg = 'c10e.asString';
    const dbg = C10E.AS_STRING;
    let { okColor1, okColor2, precision } = this;
    dbg > 2 && console.log(okColor2, msg, 'thing:', thing);
    switch (typeof thing) {
      case 'undefined':
        return 'undefined';
      case 'object': {
        if (thing == null) {
          dbg > 1 && console.log(okColor2, msg, 'null');
          return '' + thing;
        }
        if (thing instanceof Date) {
          return this.dateFormat.format(thing);
        }
        let ownToString =
          typeof thing.toString === 'function' &&
          thing.toString !== Array.prototype.toString &&
          thing.toString !== Object.prototype.toString;
        dbg > 1 && this.ok(okColor2, msg, 'ownToString:', ownToString);
        if (ownToString) {
          let s = thing.toString();
          dbg > 1 && this.ok(okColor2, msg, 'ownToString1:', s);
          return thing.toString();
        }
        if (thing instanceof Array) {
          let s =
            '[' +
            thing.map((item) => this.asString(item)).join(', ') +
            ']';
          dbg > 1 && this.ok(okColor2, msg, 'array:', s);
          return s;
        }

        // Generic Object
        let sEntries = Object.entries(thing)
          .map((kv) => kv[0] + ':' + this.asString(kv[1]))
          .join(', ');
        let cname = thing.constructor?.name;
        if (cname === 'Object') {
          cname = '';
        } else if (cname === 'anonymous') {
          cname = Unicode.INVERSE_BULLET;
        }
        let s = cname + '{' + sEntries + '}';
        dbg > 1 &&
          console.log(okColor2, msg, { ownToString }, 'object:', s);
        return s;
      }
      case 'string':
        return thing;
      case 'number': {
        let v = thing.toFixed(precision);
        if (thing === Number(v)) {
          v = v.replace(/\.?0+$/, '');
        }
        return v;
      }
      case 'function': {
        return thing.name;
      }
      default:
        return JSON.stringify(thing);
    }
  } // asString

  color(textColor, ...things) {
    let { valueColor } = this;
    let { styleText } = util;
    let label = '';
    let endColor = NO_COLOR;
    let eol;
    return things.reduce((a, thing) => {
      let newLabel = '';
      let v = this.asString(thing);
      let aLast = a.at(-1);
      if (typeof aLast === 'string' && aLast.endsWith('\n' + endColor)) {
        if (aLast === textColor + '\n' + endColor) {
          a.pop();
        } else {
          const iLast = aLast.lastIndexOf('\n');
          a.pop();
          a.push(aLast.substring(0, iLast) + aLast.substring(iLast + 1));
        }
        v = '\n' + v;
      }
      switch (typeof thing) {
        case 'object': {
          if (
            thing == null ||
            (thing.constructor !== Object &&
              typeof thing.toString === 'function')
          ) {
            a.push(label + valueColor + v + endColor);
          } else {
            label && a.push(label + endColor);
            a.push(v);
          }
          break;
        }
        case 'string':
          if (thing.endsWith(':')) {
            newLabel = textColor + v;
          } else if (label) {
            a.push(label + valueColor + v + endColor);
          } else {
            a.push(textColor + v + endColor);
          }
          break;
        case 'number':
        default:
          a.push(label + valueColor + v + endColor);
          break;
      }
      label = newLabel;
      return a;
    }, []);
  } // color

  fyi(...rest) {
    return this.fyi2(...rest);
  }

  fyi1(...rest) {
    this.writeColor(this.fyiColor1, rest);
  }

  fyi2(...rest) {
    this.writeColor(this.fyiColor2, rest);
  }

  ok(...rest) {
    return this.ok2(...rest);
  }

  ok1(...rest) {
    this.writeColor(this.okColor1, rest);
  }

  ok2(...rest) {
    this.writeColor(this.okColor2, rest);
  }

  bad(...rest) {
    return this.bad2(...rest);
  }

  bad1(...rest) {
    this.writeColor(this.badColor1, rest);
  }

  bad2(...rest) {
    this.writeColor(this.badColor2, rest);
  }

  tag(...rest) {
    return this.tag2(...rest);
  }

  tag1(...rest) {
    this.writeColor(this.tagColor1, rest);
  }

  tag2(...rest) {
    this.writeColor(this.tagColor2, rest);
  }
}
