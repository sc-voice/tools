import { 
  v7 as uuidV7, 
  validate as uuidValidate, 
  version as  uuidVersion 
} from 'uuid';
import { ColorConsole } from '../text/color-console.mjs';
const { cc } = ColorConsole;
import { Unicode } from '../text/unicode.mjs';
const { CHECKMARK: UOK } = Unicode;
import { DBG } from '../defines.mjs';
const { F3A } = DBG.N8A;
import { Admin, Consumer, Producer } from './kafka1.mjs';

export class Forma {
  static #instances = {};
  static #registry = {};
  static #avro;
  #prefix;

  constructor(cfg = {}) {
    const msg = 'f3a.ctor';
    const dbg = F3A.CTOR;

    let {
      prefix = Forma.abbreviateName(this.constructor.name).toUpperCase(),
    } = cfg;

    let instances = Forma.#instances[prefix] || 0;
    instances++;
    Forma.#instances[prefix] = instances;

    let { 
      id = `${prefix}${('' + instances).padStart(3, '0')}`,
      name = id,
    } = cfg;

    Object.defineProperty(this, 'prefix', {
      value: prefix,
    });
    Object.defineProperty(this, 'id', {
      enumerable: true,
      value: id,
    });
    this.name = name;

    dbg && cc.ok1(msg + UOK, {id, name});
  }

  static uuid(opts) {
    return uuidV7(opts);
  }

  static uuidToTime(id) {
    const msg = 'f3a.uuidToDate';
    if (!uuidValidate(id)) {
      throw new Error(`${msg} invalid uuid:${id}`);
    }
    if (uuidVersion(id) !== 7) {
      throw new Error(`${msg} expected v7 uuid:${id}`);
    }

    let time = parseInt(id.replace(/-/,'').substring(0,12), 16);
    return time;
  }

  static get REGISTRY() {
    return Object.assign({}, Forma.#registry);
  }

  static register(opts = {}) {
    return Forma.registerSchema(Forma.SCHEMA, opts);
  }

  static registerSchema(schema, opts = {}) {
    const msg = 'f3a.registerSchema';
    const dbg = F3A.REGISTER_SCHEMA;

    let { name, namespace } = schema;
    if (name == null) {
      throw new Error(`${msg} name?`);
    }
    let fullName = namespace ? `${namespace}.${name}` : `${name}`;
    dbg > 1 && cc.ok(msg, 'parsing:', fullName);
    let { avro = Forma.#avro, registry = Forma.#registry } = opts;
    if (avro == null) {
      throw new Error(`${msg} avro?`);
    }
    Forma.#avro = avro;
    let type = registry[fullName];

    if (type == null) {
      type = avro.parse(schema, Object.assign({ registry }, opts));
      dbg && cc.ok1(msg + UOK, fullName);
      registry[fullName] = type;
      Forma.#registry[fullName] = type;
    }

    return type;
  }

  static get SCHEMA() {
    return {
      name: 'Forma',
      namespace: 'scvoice.nameforma',
      type: 'record',
      fields: [
        { name: 'id', type: 'string' },  // immutable, unique
        { name: 'name', type: 'string' } // mutable 
      ],
    };
  }

  static abbreviateName(name) {
    let length = name.length;
    return [name[0], length - 2, name[length - 1]].join('');
  }

  toString() {
    return this.id;
  }

  patch(cfg={}) {
    let { name = this.name } = cfg;
    this.name = name;
  }
} // Forma
