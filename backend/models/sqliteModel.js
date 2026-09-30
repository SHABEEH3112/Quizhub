const crypto = require("node:crypto");
const {
  deleteDocument,
  readDocumentById,
  readDocuments,
  saveDocument,
} = require("../config/sqlite");

const createId = () => crypto.randomBytes(12).toString("hex");

const comparable = (value) => {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && !Number.isNaN(Date.parse(value))) {
    return Date.parse(value);
  }
  return value == null ? value : String(value);
};

const matches = (document, filter) =>
  Object.entries(filter || {}).every(([field, expected]) => {
    const actual = document[field];

    if (expected && typeof expected === "object" && !Array.isArray(expected) && !(expected instanceof Date)) {
      if (Array.isArray(expected.$in)) {
        return expected.$in.some((value) => comparable(value) === comparable(actual));
      }
      if (expected.$gt !== undefined) {
        return comparable(actual) > comparable(expected.$gt);
      }
    }

    return comparable(actual) === comparable(expected);
  });

const getPath = (document, path) =>
  path.split(".").reduce((value, key) => value?.[key], document);

const deletePath = (document, path) => {
  const keys = path.split(".");
  const lastKey = keys.pop();
  const parent = keys.reduce((value, key) => value?.[key], document);

  if (Array.isArray(parent)) {
    parent.forEach((item) => delete item[lastKey]);
  } else if (parent) {
    delete parent[lastKey];
  }
};

const projectDocument = (document, selection) => {
  if (!selection) return document;

  const fields = typeof selection === "string"
    ? selection.split(/\s+/).filter(Boolean)
    : Object.entries(selection)
      .filter(([, include]) => Boolean(include))
      .map(([field]) => field);

  if (fields.some((field) => field.startsWith("-"))) {
    const projected = Object.assign(
      Object.create(Object.getPrototypeOf(document)),
      document
    );
    fields.filter((field) => field.startsWith("-")).forEach((field) => {
      deletePath(projected, field.slice(1));
    });
    return projected;
  }

  const included = fields.filter((field) => !field.startsWith("+"));
  if (!included.length) return document;
  if (!included.includes("_id") && !fields.includes("-_id")) included.unshift("_id");

  const projected = Object.create(Object.getPrototypeOf(document));
  included.forEach((field) => {
    const value = getPath(document, field);
    if (value !== undefined) projected[field] = value;
  });
  return projected;
};

class SQLiteQuery {
  constructor(Model, filter, single = false) {
    this.Model = Model;
    this.filter = filter;
    this.single = single;
    this.sortOrder = null;
    this.selection = null;
    this.populations = [];
  }

  select(selection) {
    this.selection = selection;
    return this;
  }

  sort(order) {
    this.sortOrder = order;
    return this;
  }

  populate(path, selection) {
    this.populations.push({ path, selection });
    return this;
  }

  async exec() {
    let documents = readDocuments(this.Model.modelName)
      .map((data) => new this.Model(data))
      .filter((document) => matches(document, this.filter));

    if (this.sortOrder) {
      const entries = Object.entries(this.sortOrder);
      documents.sort((left, right) => {
        for (const [field, direction] of entries) {
          const difference = comparable(left[field]) > comparable(right[field])
            ? 1
            : comparable(left[field]) < comparable(right[field])
              ? -1
              : 0;
          if (difference) return difference * Number(direction);
        }
        return 0;
      });
    }

    if (this.single) documents = documents.slice(0, 1);

    for (const document of documents) {
      for (const { path, selection } of this.populations) {
        const RelatedModel = this.Model.populateRefs?.[path]?.();
        const id = document[path];
        const related = RelatedModel && id
          ? readDocumentById(RelatedModel.modelName, id)
          : null;
        document[path] = related
          ? projectDocument(new RelatedModel(related), selection)
          : null;
      }
    }

    documents = documents.map((document) => projectDocument(document, this.selection));
    return this.single ? documents[0] || null : documents;
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

class SQLiteModel {
  constructor(data = {}) {
    Object.assign(this, data);
    this._id = String(data._id || createId());
    this.createdAt = data.createdAt ? new Date(data.createdAt) : new Date();
    this.updatedAt = data.updatedAt ? new Date(data.updatedAt) : new Date();
  }

  async save() {
    this.updatedAt = new Date();
    saveDocument(this.constructor.modelName, this);
    return this;
  }

  async deleteOne() {
    return deleteDocument(this.constructor.modelName, this._id);
  }

  static find(filter = {}) {
    return new SQLiteQuery(this, filter);
  }

  static findOne(filter = {}) {
    return new SQLiteQuery(this, filter, true);
  }

  static findById(id) {
    return this.findOne({ _id: String(id) });
  }

  static async findOneAndUpdate(filter, update, options = {}) {
    let document = await this.findOne(filter);
    if (!document && !options.upsert) return null;
    if (!document) document = new this({ ...filter, ...update });
    else Object.assign(document, update);
    await document.save();
    return document;
  }

  static async findOneAndDelete(filter) {
    const document = await this.findOne(filter);
    return document ? deleteDocument(this.modelName, document._id) : null;
  }

  static async countDocuments(filter = {}) {
    return readDocuments(this.modelName)
      .filter((document) => matches(document, filter))
      .length;
  }
}

module.exports = { SQLiteModel, createId };