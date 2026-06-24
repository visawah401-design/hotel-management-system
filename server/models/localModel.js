const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.join(__dirname, '..', 'data');
const dataFile = path.join(dataDir, 'local-db.json');

const initialData = {
  users: [],
  rooms: [
    {
      _id: 'room-single-101',
      id: 'room-single-101',
      roomNumber: '101',
      roomType: 'Single',
      capacity: 1,
      pricePerNight: 900,
      status: 'Available',
      amenities: ['Free WiFi', 'AC', 'Smart TV', 'Water Cooler', 'Restaurant', 'Room Service'],
      description: 'Comfortable single room for solo guests.',
      images: [],
      floor: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'room-double-204',
      id: 'room-double-204',
      roomNumber: '204',
      roomType: 'Double',
      capacity: 2,
      pricePerNight: 1150,
      status: 'Available',
      amenities: ['Free WiFi', 'AC', 'Smart TV', 'Balcony', 'Water Cooler', 'Restaurant'],
      description: 'Spacious double room with balcony.',
      images: [],
      floor: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'room-suite-301',
      id: 'room-suite-301',
      roomNumber: '301',
      roomType: 'Couple Hourly (3-4 Hrs)',
      capacity: 2,
      pricePerNight: 600,
      status: 'Available',
      amenities: ['Free WiFi', 'AC', 'Smart TV', 'Total Privacy', 'In-room Dining'],
      description: 'Short stay couple room with absolute privacy for 3-4 hours.',
      images: [],
      floor: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  bookings: [],
  payments: [],
  facilities: [
    {
      _id: 'facility-wifi',
      id: 'facility-wifi',
      name: 'Free WiFi',
      description: 'High speed internet across the hotel.',
      icon: 'wifi',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'facility-parking',
      id: 'facility-parking',
      name: 'Parking',
      description: 'Secure parking for guests.',
      icon: 'parking',
      available: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
};

const collectionNames = {
  User: 'users',
  Room: 'rooms',
  Booking: 'bookings',
  Payment: 'payments',
  Facility: 'facilities',
};

const refs = {
  userId: 'users',
  roomId: 'rooms',
  bookingId: 'bookings',
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function ensureStore() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(initialData, null, 2));
  }
}

function readStore() {
  ensureStore();
  return JSON.parse(fs.readFileSync(dataFile, 'utf8'));
}

function writeStore(store) {
  ensureStore();
  fs.writeFileSync(dataFile, JSON.stringify(store, null, 2));
}

function createId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}${Math.random().toString(16).slice(2)}`;
}

function normalizeId(value) {
  if (!value) return value;
  if (typeof value === 'object' && value._id) return value._id;
  return String(value);
}

function matches(doc, filter = {}) {
  return Object.entries(filter).every(([key, value]) => {
    const docValue = doc[key];

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.$in) {
        return value.$in.some((candidate) => normalizeId(docValue) === normalizeId(candidate));
      }

      if (value.$ne) {
        return normalizeId(docValue) !== normalizeId(value.$ne);
      }
    }

    return normalizeId(docValue) === normalizeId(value);
  });
}

function stripFields(doc, fields) {
  if (!doc || !fields) return doc;
  const output = clone(doc);
  fields
    .split(/\s+/)
    .filter(Boolean)
    .forEach((field) => {
      if (field.startsWith('-')) {
        delete output[field.slice(1)];
      }
    });
  return output;
}

function pickFields(doc, fields) {
  if (!doc || !fields) return doc;
  const requested = fields.split(/\s+/).filter(Boolean);
  if (!requested.length) return doc;

  const output = { _id: doc._id, id: doc.id };
  requested.forEach((field) => {
    if (doc[field] !== undefined) output[field] = doc[field];
  });
  return output;
}

function populateDoc(doc, populateCalls, store) {
  let output = clone(doc);

  populateCalls.forEach(({ field, fields }) => {
    const collection = refs[field];
    if (!collection || !output[field]) return;

    const related = store[collection].find((item) => item._id === normalizeId(output[field]));
    if (related) {
      output[field] = pickFields(related, fields);
    }
  });

  return output;
}

class LocalQuery {
  constructor(executor) {
    this.executor = executor;
    this.selectFields = null;
    this.populateCalls = [];
    this.sortSpec = null;
  }

  select(fields) {
    this.selectFields = fields;
    return this;
  }

  populate(field, fields) {
    this.populateCalls.push({ field, fields });
    return this;
  }

  sort(sortSpec = {}) {
    this.sortSpec = sortSpec;
    return this;
  }

  async exec() {
    const store = readStore();
    const result = await this.executor(store);
    const applyTransforms = (doc) => stripFields(populateDoc(doc, this.populateCalls, store), this.selectFields);

    const applySorting = (docs) => {
      if (!this.sortSpec || !Object.keys(this.sortSpec).length) {
        return docs;
      }

      return [...docs].sort((a, b) => {
        for (const [field, direction] of Object.entries(this.sortSpec)) {
          const valueA = a[field];
          const valueB = b[field];
          const factor = direction === -1 ? -1 : 1;
          if (valueA === valueB) continue;
          if (valueA == null) return 1;
          if (valueB == null) return -1;
          if (valueA < valueB) return -1 * factor;
          if (valueA > valueB) return 1 * factor;
        }
        return 0;
      });
    };

    if (Array.isArray(result)) {
      return applyTransforms ? applySorting(result.map(applyTransforms)) : applySorting(result);
    }

    return result ? applyTransforms(result) : result;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }

  catch(reject) {
    return this.exec().catch(reject);
  }
}

function createLocalModel(modelName, defaults = {}) {
  const collection = collectionNames[modelName];

  return class LocalModel {
    constructor(data = {}) {
      Object.assign(this, defaults, data);
      this._id = this._id || data.id || createId();
      this.id = this._id;
      this.createdAt = this.createdAt || new Date().toISOString();
      this.updatedAt = new Date().toISOString();
    }

    async save() {
      const store = readStore();
      const doc = clone(this);
      const index = store[collection].findIndex((item) => item._id === doc._id);

      if (index >= 0) {
        store[collection][index] = doc;
      } else {
        store[collection].push(doc);
      }

      writeStore(store);
      Object.assign(this, doc);
      return clone(doc);
    }

    static find(filter = {}) {
      return new LocalQuery((store) => clone(store[collection].filter((doc) => matches(doc, filter))));
    }

    static findOne(filter = {}) {
      return new LocalQuery((store) => {
        const doc = store[collection].find((item) => matches(item, filter));
        return doc ? clone(doc) : null;
      });
    }

    static findById(id) {
      return new LocalQuery((store) => {
        const doc = store[collection].find((item) => item._id === normalizeId(id));
        return doc ? clone(doc) : null;
      });
    }

    static findByIdAndUpdate(id, update = {}, options = {}) {
      return new LocalQuery(() => {
        const store = readStore();
        const index = store[collection].findIndex((item) => item._id === normalizeId(id));
        if (index === -1) return null;

        const previous = clone(store[collection][index]);
        store[collection][index] = {
          ...store[collection][index],
          ...clone(update),
          _id: store[collection][index]._id,
          id: store[collection][index]._id,
          updatedAt: new Date().toISOString(),
        };
        writeStore(store);

        return options.new === false ? previous : clone(store[collection][index]);
      });
    }

    static findByIdAndDelete(id) {
      return new LocalQuery(() => {
        const store = readStore();
        const index = store[collection].findIndex((item) => item._id === normalizeId(id));
        if (index === -1) return null;

        const [removed] = store[collection].splice(index, 1);
        writeStore(store);
        return clone(removed);
      });
    }

    static findOneAndUpdate(filter = {}, update = {}, options = {}) {
      return new LocalQuery(() => {
        const store = readStore();
        const index = store[collection].findIndex((item) => matches(item, filter));
        if (index === -1) return null;

        const previous = clone(store[collection][index]);
        store[collection][index] = {
          ...store[collection][index],
          ...clone(update),
          _id: store[collection][index]._id,
          id: store[collection][index]._id,
          updatedAt: new Date().toISOString(),
        };
        writeStore(store);

        return options.new === false ? previous : clone(store[collection][index]);
      });
    }
  };
}

module.exports = createLocalModel;
