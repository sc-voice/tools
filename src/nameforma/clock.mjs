import { DBG } from '../../src/defines.mjs';
const { C3K } = DBG.N8A;
import { ColorConsole } from '../../src/text/color-console.mjs';
import { Unicode } from '../../src/text/unicode.mjs';
const { CHECKMARK: OK } = Unicode;
const { cc } = ColorConsole;

let HEARTBEAT_INTERVAL = 3000; // default

function DEFAULT_TIME() {
  return Date.now();
}

export class Clock {
  static #instances = 0;
  #referenceBase;
  #referenceTime;
  #idle;
  #done = false;
  constructor(cfg = {}) {
    const msg = 'c3k.ctor';
    const dbg = C3K.CTOR;
    Clock.#instances++;
    let {
      id = 'C3K' + String(Clock.#instances).padStart(3, '0'),
      period = 1000, // ms
      referenceTime = () => Date.now(),
      idle = async () => {
        await new Promise((res) => setTimeout(() => res(), period / 2));
      },
    } = cfg;
    Object.assign(this, {
      id,
      running: false,
      timeIn: 0,
      timeOut: 0,
      period,
    });
    this.#idle = idle;
    this.#referenceTime = referenceTime;
    Object.defineProperty(this, 'interval', {
      writable: true,
      value: null,
    });
    Object.defineProperty(this, 'generator', {
      writable: true,
      value: null,
    });
    dbg && cc.ok1(msg + OK, ...cc.props(this));
  }

  async *#createGenerator() {
    const msg = 'c3k.generator';
    const dbg = C3K.GENERATOR;
    while (this.running) {
      dbg > 1 && cc.ok(msg + 2.1, 'running', this.timeOut);
      if (this.timeIn === this.timeOut) {
        await this.#idle();
        if (this.timeIn === this.timeOut) {
          yield this.timeOut;
          dbg && cc.ok1(msg + OK, '==timeOut:', this.timeOut);
        }
      } else {
        this.timeOut = this.timeIn;
        dbg && cc.ok1(msg + OK, '++timeOut:', this.timeOut);
        yield this.timeOut;
      }
    }
    dbg && cc.ok1(msg + OK, 'stopped');
  }

  now() {
    return this.#referenceTime();
  }

  async start() {
    const msg = 'c3k.start';
    const dbg = C3K.START;
    let now = this.#referenceTime();
    if (this.running) {
      dbg && cc.bad1(msg, 'ignored');
      return;
    }

    this.#referenceBase = now;
    this.update(this.now());
    this.generator = this.#createGenerator();
    if (this.period > 0) {
      dbg > 1 && cc.ok(msg + 2.1, 'setInterval:', Date.now());
      this.interval = setInterval(() => {
        let now = this.now();
        dbg > 1 && cc.ok(msg + 2, 'autoUpdate:', now);
        this.update(now);
      }, this.period);
    }
    this.running = true;
    dbg && cc.ok1(msg + OK, 'started:', this.id);

    return this;
  } // start

  async next() {
    const msg = 'c3k.next';
    const dbg = C3K.NEXT;
    let { running, timeOut, generator } = this;
    if (!running) {
      return { done: this.#done, value: timeOut };
    }

    dbg > 1 && cc.ok(msg + 2.1, ' g7r.next...');
    let result = await generator.next();
    dbg && cc.ok1(msg + OK, '...g7r.next=>', result);

    return result;
  } // next

  async stop() {
    this.running = false;
    this.#done = true;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = undefined;
    }
    if (this.generator) {
      this.generator = null;
    }
  } // stop

  update(timestamp) {
    const msg = 'c3k.update';
    const dbg = C3K.UPDATE;
    if (timestamp == null) {
      throw new Error(`${msg} timestamp?`);
    }
    if (timestamp < this.timeIn) {
      dbg && cc.ok1(msg, 'ignored:', timestamp); // monotonic updates
    } else {
      this.timeIn = timestamp;
      dbg && cc.ok1(msg + OK, timestamp);
    }
  } // update
} // Clock
