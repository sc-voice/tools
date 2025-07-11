import { ColorConsole } from '../text/color-console.mjs';
const { cc } = ColorConsole;
import { Unicode } from '../text/unicode.mjs';
const { CHECKMARK: UOK, RIGHT_ARROW: URA } = Unicode;
import { DBG } from './defines.mjs';
const { KAFKA: K3A, CONSUMER: C6R, PRODUCER: P6R, RUNNER: R4R } = DBG;
import { Clock } from './clock.mjs';

/*
 * Kafka1 is a single cluster, single node, single partition,
 * in-memory, local implementation of Kafka that can be used
 * to test application logic that uses Kafka protocols.
 *
 * Kafka1 uses a subset of kafkajs api and can be directly
 * replaced with a kafkajs instance.
 */
const SINGLETON_PARTITION = 0; // multiple partitions not supported
const SINGLETON_NODE_ID = '123'; // multiple brokers are not supported
const CLIENT_ID = 'kafka1';
const NO_TOPIC = 'no-topic';

let _consumerCount = 0;
let _producerCount = 0;
let ROLE_CONSTRUCTOR = false;
let HEARTBEAT_INTERVAL = 3000; // default

class Timestamp {
  // Does Kafka REALLY store timestamps as strings???
  static asDate(ts) {
    return new Date(ts);
  }

  static now() {
    return Date.now();
  }
}

class Role {
  constructor(opts = {}) {
    let { tla = 'tla?', kafka } = opts;
    const msg = `${tla}_r2e.ctor`;

    let warn;
    if (!ROLE_CONSTRUCTOR) {
      warn = `${msg} private ctor!`;
    } else if (kafka == null) {
      warn = `${msg} kafka?`;
    }
    if (warn) {
      cc.bad1(msg - 1, warn);
      throw new Error(warn);
    }

    this.tla = tla;
    this.kafka = kafka;
    this.connections = 0;
    this.created = Date.now();
  }

  async connect() {
    const { tla } = this;
    const msg = `${tla}.connect`;
    const dbg = K3A.CONNECT;
    this.connections++;

    dbg && cc.ok1(msg + 9.1, 'connections:', this.connections);
    //return this; // WARNING: kafkajs does not chain
  }

  async disconnect() {
    const { tla } = this;
    const msg = `${tla}.disconnect`;
    const dbg = K3A.DISCONNECT;
    if (this.connections > 0) {
      this.connections--;
      dbg && cc.ok1(msg + 9.1, 'connections:', this.connections);
    } else {
      cc.bad1(msg + 9.2, 'connections:', this.connections);
      throw new Error(msg, 'no connections?');
    }
  }
}

export class Topic {
  constructor(cfg = {}) {
    let { name = NO_TOPIC, created = Date.now() } = cfg;

    this.name = name;
    this.created = created;
    this.partitions = [
      {
        partitionId: SINGLETON_PARTITION,
        _messages: [],
      },
    ];
    Object.defineProperty(this, '_consumerMap', {
      value: new Map(),
    });
  }
}

export class Message {
  constructor(cfg = {}) {
    let {
      key = 'no-key',
      value = null,
      timestamp = Timestamp.now(),
      headers = null,
      partition,
    } = cfg;

    if (partition == null) {
      partition = Message._partitionOfKey(key);
    }

    if (
      value !== null &&
      !(value instanceof Buffer) &&
      typeof value !== 'string'
    ) {
      throw new Error(`${msg} value?`);
    }

    Object.assign(this, { key, value, headers, timestamp, partition });
  }

  static _partitionOfKey(key) {
    // Kafka assigns partition by hash of key for scalability
    // and parallel processing. Since Kafka1 doesn't care about
    // the above, we only use one partition.
    return SINGLETON_PARTITION;
  }
} // Message

export class _Runner {
  constructor(cfg = {}) {
    const msg = 'r4r.ctor';
    const dbg = R4R.CTOR;
    let {
      autoCommit = true,
      consumer,
      eachBatch,
      eachMessage,
      kafka,
      onCrash,
    } = cfg;
    let { _inboxClock } = consumer;

    if (!consumer) {
      throw new Error(`${msg} consumer?`);
    }
    if (!autoCommit) {
      throw new Error(`${msg} autoCommit TBD`);
    }
    if (eachBatch) {
      throw new Error(`${msg} eachBatch TBD`);
    }

    this.running = false;
    Object.assign(this, {
      autoCommit,
      consumer,
      eachBatch,
      eachMessage,
      kafka,
      onCrash,
    });
    Object.defineProperty(this, 'resProcess', {
      writable: true,
    });
    dbg &&
      cc.ok1(msg + UOK, ...cc.props({ c6r_groupId: consumer.groupId }));
  } // ctor

  async process() {
    const msg = 'r4r.process';
    const dbg = R4R.PROCESS;
    let { consumer, eachMessage } = this;
    let { _inboxClock } = consumer;

    let crashed = false;
    while (this.running) {
      try {
        dbg > 1 && cc.ok(msg, '_readTopics...');
        let { committed } = await consumer._readTopics({ eachMessage });
        dbg > 1 &&
          cc.ok(msg, '..._readTopics', ...cc.props({ committed }));

        dbg > 1 && cc.ok(msg, '_inboxClock...');
        let { done, value: clock } = await _inboxClock.next();

        dbg && cc.ok1(msg + URA, ...cc.props({ clock, committed }));
      } catch (e) {
        cc.bad1(`${msg} CRASH`, e.message);
        console.log(msg, e);
        crashed = true;
        await this.stop();
        this.onCrash && this.onCrash(e);
      }
    }

    dbg && !crashed && cc.ok1(msg + UOK, 'stopped');

    return false; // resolved when no longer running
  } // process

  async start() {
    const msg = 'r4r.start';
    const dbg = R4R.START;
    let { _inboxClock } = this.consumer;

    if (this.running) {
      cc.bad1(msg, 'running!');
      return;
    }
    this.running = true;
    dbg > 1 && cc.ok(msg + 1, 'starting...');

    _inboxClock.start();

    this.resProcess = this.process();

    dbg && cc.ok1(msg + UOK, 'running:', this.running);
    return this.running; // true when resolved
  } // r4r.start

  async stop() {
    const msg = 'r4r.stop';
    const dbg = R4R.STOP;
    this.running = false;
    dbg > 1 && cc.ok(msg + UOK, 'stopping...');
    let res = await this.resProcess; // false when resolved
    dbg && cc.ok1(msg + UOK, 'stopped');
  }
} // _Runner

class ConsumerGroup {
  constructor(cfg = {}) {
    const msg = 'c11p.ctor';
    let {
      kafka,
      groupId = 'no-group-id',
      protocolType = 'consumer',
    } = cfg;

    Object.assign(this, { groupId, kafka }, cfg);
    Object.defineProperty(this, '_groupOffsetsetsMap', {
      value: {}, // hack for mock kafka
    });
    Object.defineProperty(this, '_consumers', {
      value: [],
    });
  }

  _topics() {
    return Object.keys(this._groupOffsetsetsMap);
  }

  _offsets() {
    return Object.values(this._groupOffsetsetsMap);
  }
} // ConsumerGroup

class GroupOffsets {
  constructor(cfg = {}) {
    const msg = 'g10s.ctor';
    let { topic, fromBeginning = false } = cfg;
    let partitions = topic.partitions.map((p, i) => {
      let offset = fromBeginning ? 0 : p._messages.length;
      return { partition: i, offset };
    });

    Object.assign(this, { topic: topic.name, partitions });
  }
} // GroupOffsets

export class Consumer extends Role {
  constructor(cfg = {}) {
    const msg = 'c6r.ctor';
    const dbg = C6R.CTOR;
    const {
      kafka,
      groupId = 'no-group-id',
      heartbeatInterval = HEARTBEAT_INTERVAL,
      sessionTimeout = HEARTBEAT_INTERVAL * 10,
      _msIdle = heartbeatInterval / 2, // clock idle time
    } = cfg;
    super({ tla: 'c6r', kafka });
    // biome-ignore format:
    dbg > 1 && cc.ok( msg + UOK, ...cc.props({ groupId, _msIdle }));

    Object.assign(this, {
      groupId,
      heartbeatInterval,
      sessionTimeout,
    });
    let group = this._consumerGroup();
    group._consumers.push(this);
    _consumerCount++;
    let _id = `C6R${('' + _consumerCount).padStart(3, '0')}`;
    Object.defineProperty(this, '_id', { value: _id });
    Object.defineProperty(this, '_runner', {
      writable: true,
      value: null,
    });
    let _inboxClock = new Clock();
    Object.defineProperty(this, '_inboxClock', { value: _inboxClock });

    this.eachMessage = null;

    dbg && cc.ok1(msg + UOK, ...cc.props({ _id, groupId, _msIdle }));
  } // c6r.ctor

  get running() {
    let { _runner } = this;
    return _runner && _runner.running;
  }

  _consumerGroup() {
    let { kafka, groupId } = this;
    return kafka._groupOfId(groupId);
  }

  async subscribe(cfg = {}) {
    const msg = 'c6r.subscribe';
    const dbg = C6R.SUBSCRIBE;
    let { topics = [], fromBeginning = false } = cfg;
    const { kafka, groupId } = this;
    const group = this._consumerGroup();
    const { _groupOffsetsetsMap } = group;
    let subscribed = 0;

    for (let i = 0; i < topics.length; i++) {
      let topicName = topics[i];
      let topic = kafka._topicOfName(topicName);
      let c9p = topic._consumerMap.get(this);
      topic._consumerMap.set(this, true);
      let g10s = _groupOffsetsetsMap[topicName];
      if (g10s) {
        dbg > 1 && cc.ok(msg + 2.1, ...cc.props({ groupId, topicName }));
      } else {
        g10s = new GroupOffsets({ topic, fromBeginning });
        _groupOffsetsetsMap[topicName] = g10s;

        subscribed++;
        dbg > 1 &&
          cc.ok(
            msg + 2.2,
            groupId + '+:',
            topicName,
            JSON.stringify(_groupOffsetsetsMap),
          );
      }
    }

    dbg &&
      cc.ok1(
        msg + UOK,
        ...cc.props({ groupId, _topics: group._topics().join(',') }),
      );

    //return this; // WARNING: kafkajs does not chain
  } // subscribe

  async heartbeat() {
    const msg = 'c6r.heartbeat';
    cc.fyi(msg, Date.now());
  }

  async pause() {
    const msg = 'c6r.pause';
    cc.fyi(msg);
  }

  async _readTopics(cfg = {}) {
    const msg = 'c6r._readTopics';
    const dbg = C6R.READ_TOPICS;
    let { kafka, _id, groupId } = this;
    let group = this._consumerGroup();
    let { eachMessage } = cfg;
    let { _groupOffsetsetsMap } = group;

    let committed = 0;
    let groupOffsets = group._offsets();
    dbg > 1 && cc.ok(msg, 'groupOffsets:', groupOffsets.length);
    for (const offsets of groupOffsets) {
      let { topic: topicName, partitions } = offsets;
      let topic = kafka._topicOfName(topicName);
      dbg > 1 && cc.ok(msg, ' topic:', `${topicName}`);
      for (let i = 0; i < partitions.length; i++) {
        let { offset } = partitions[i];
        let messages = topic.partitions[i]._messages;
        if (offset < messages.length) {
          dbg > 1 && cc.ok(msg, '  partition:', `${topicName}.${i}`);
          for (; offset < messages.length; offset++) {
            let message = messages[offset];
            if (message) {
              dbg > 2 && cc.ok(msg, '   eachMessage:', message);
              await eachMessage({
                topic: topicName,
                partition: i,
                message,
                heartbeat: this.heartbeat,
                pause: this.pause,
              });
              committed++;
            } else {
              cc.bad(msg, 'empty message?');
            }
          } // for
          partitions[i].offset = offset; // commit
        } else {
          dbg > 1 && cc.fyi(msg, 'no new messages:', `${topicName}.${i}`);
        }
      } // partitions
    }

    dbg && cc.ok1(msg + UOK, ...cc.props({ _id, committed, groupId }));
    return { committed };
  } // _readTopics

  async run(cfg = {}) {
    const msg = 'c6r.run';
    const dbg = C6R.RUN;
    let { kafka, _runner } = this;
    if (_runner) {
      throw new Error(`${msg} _runner already exists`);
    }
    let { eachMessage, _msIdle = this._msIdle } = cfg;
    if (eachMessage == null) {
      cc.bad1(msg, 'eachMessage?');
      throw new Error(`${msg} eachMessage?`);
    }
    let idle = () => new Promise((r) => setTimeout(() => r(), _msIdle));
    await this._inboxClock.start({ idle });
    this._runner = new _Runner({
      kafka,
      eachMessage,
      consumer: this,
    });

    let promise = this._runner.start(); // do not await!
    dbg && cc.ok1(msg + UOK, 'started');

    return promise;
  }

  async stop() {
    if (this._runner) {
      await this._runner.stop();
    }
    if (this._inboxClock) {
      await this._inboxClock.stop();
    }
  }
} // Consumer

export class Producer extends Role {
  constructor(cfg = {}) {
    const msg = 'p6r.ctor';
    const dbg = K3A.CTOR || P6R.CTOR;
    let { kafka } = cfg;
    super({ tla: 'p6r', kafka });

    _producerCount++;
    Object.defineProperty(this, '_id', {
      value: `P6R-${('' + _producerCount).padStart(3, '0')}`,
    });
    dbg && cc.ok1(msg, this._id);
  }

  async send(request = {}) {
    const msg = 'p6r.send';
    const dbg = K3A.SEND;
    let { kafka } = this;
    let {
      topic: topicName = NO_TOPIC,
      messages = [],
      timestamp = Timestamp.now(),
    } = request;

    let touchedConsumers = {};
    let topic = kafka._topicOfName(topicName);
    for (let i = 0; i < messages.length; i++) {
      let message = messages[i];
      let partitionId = Message._partitionOfKey(message.key);
      let partition = topic.partitions[partitionId];
      if (message.timestamp == null) {
        message.timestamp = timestamp;
      }
      partition._messages.push(message);
      if (dbg > 1) {
        let ts = Timestamp.asDate(timestamp).toLocaleTimeString();
        cc.ok(
          msg,
          ts,
          `${topicName}.${partitionId}`,
          message.key + ':',
          message.value,
        );
      }
    }
    let consumers = [...topic._consumerMap.keys()];
    for (let i = 0; i < consumers.length; i++) {
      let c6r = consumers[i];
      c6r._inboxClock.update(timestamp);
    }

    if (dbg) {
      let ts = Timestamp.asDate(timestamp).toLocaleTimeString('en-US', {
        hour12: false,
      });
      cc.ok1(
        msg + UOK,
        this._id,
        ts,
        topicName,
        'messages:',
        messages.length,
      );
    }
  } // send
} // Producer

export class Admin extends Role {
  constructor(cfg = {}) {
    let { kafka } = cfg;
    super({ tla: 'a3n', kafka });
    const msg = 'p6r.ctor';
    const dbg = P6R.CTOR;
    dbg && cc.ok1(msg);
  }

  async listGroups() {
    const msg = 'k3a.listGroups';
    const dbg = K3A.LIST_GROUPS;
    let { kafka } = this;
    let { _groupMap } = kafka;
    return Object.keys(_groupMap).map((groupId) => {
      let group = kafka._groupOfId(groupId);
      let { protocolType } = group;
      return {
        groupId,
        protocolType,
      };
    });
  }

  async listTopics() {
    const msg = 'a3n.listTopics';
    let { _topicMap } = this.kafka;

    return Object.keys(_topicMap);
  }

  async describeGroups(groupIds) {
    const msg = 'k3a.describeGroups';
    const dbg = K3A.DESCRIBE_GROUPS;
    let { kafka } = this;
    let { _groupMap } = kafka;

    if (groupIds == null) {
      groupIds = Object.keys(_groupMap);
    }

    let result = [];
    for (const groupId of groupIds) {
      let group = kafka._groupOfId(groupId);
      result.push({
        errorCode: 0,
        groupId,
        protocolType: 'consumer',
        state: 'stable',
      });
    }

    return result;
  }

  async fetchOffsets(args = {}) {
    const msg = 'a3n.fetchOffsets';
    const dbg = K3A.FETCH_OFFSETS;
    const { kafka } = this;
    let { groupId, topics } = args;

    let group = kafka._groupOfId(groupId);
    let { _groupOffsetsetsMap } = group;
    if (topics == null) {
      topics = Object.keys(_groupOffsetsetsMap);
    }
    let offsets = topics.reduce((a, topicName) => {
      let g10s = _groupOffsetsetsMap[topicName];
      g10s && a.push(g10s);
      return a;
    }, []);
    dbg && cc.ok1(msg + UOK, groupId, JSON.stringify(offsets));

    return offsets;
  }
} // Admin

export class KRaftNode {
  // i.e., broker
  constructor(cfg = {}) {
    const msg = 'k7e.ctor';
    let { nodeId = SINGLETON_NODE_ID } = cfg;

    Object.assign(this, cfg, {
      nodeId,
    });
    Object.defineProperty(this, '_groupMap', {
      value: {}, // hack for mock kafka
    });
    Object.defineProperty(this, '_topicMap', {
      value: {}, // hack for mock kafka
    });
  }

  _topicOfName(topicName) {
    const msg = 'k7e._topicOfName';
    const dbg = K3A.TOPIC_OF_NAME;
    let { _topicMap } = this;
    let topic = _topicMap[topicName];
    if (topic == null) {
      topic = new Topic({ name: topicName });
      _topicMap[topicName] = topic;
      dbg && cc.ok1(msg + 9.1, 'created:', topicName);
    } else {
      dbg && cc.ok1(msg + 9.2, 'existing:', topicName);
    }
    return topic;
  }

  _groupOfId(groupId, opts = {}) {
    const msg = 'k7e._groupOfId';
    const dbg = K3A.GROUP_OF_ID;
    let { _groupMap } = this;
    let { protocolType = 'consumer' } = opts;
    let group = _groupMap[groupId];
    if (group == null) {
      // auto create
      group = new ConsumerGroup({ kafka: this, groupId, protocolType });
      _groupMap[groupId] = group;
      dbg && cc.ok1(msg + OK + '+', groupId);
    } else {
      dbg && cc.ok1(msg + OK + '=', groupId);
    }
    return group;
  }
} // KRaftNode

export class Kafka1 extends KRaftNode {
  constructor(cfg = {}) {
    super();
    const msg = 'k3a.ctor';
    const dbg = K3A.CTOR;
    let { clientId = 'no-client-id' } = cfg;

    Object.assign(this, { clientId });

    dbg && cc.ok1(msg);
  }

  static get HEARTBEAT_INTERVAL() {
    return HEARTBEAT_INTERVAL;
  }

  consumer(cfg = {}) {
    ROLE_CONSTRUCTOR = true;
    let role = new Consumer(Object.assign({ kafka: this }, cfg));
    ROLE_CONSTRUCTOR = false;
    return role;
  }

  producer(cfg = {}) {
    ROLE_CONSTRUCTOR = true;
    let role = new Producer(Object.assign({ kafka: this }, cfg));
    ROLE_CONSTRUCTOR = false;
    return role;
  }

  admin(cfg = {}) {
    ROLE_CONSTRUCTOR = true;
    let role = new Admin(Object.assign({ kafka: this }, cfg));
    ROLE_CONSTRUCTOR = false;
    return role;
  }
} // Kafka1
