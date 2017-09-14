import * as MongoDB from 'mongodb';

import { Service } from '../classes/service';
import { Api } from '../classes/api';
import {
  getMetadata,
  defineMetadata,
  templates,
  applyTemplates,
  param,
  environment,
  injectable,
  InjectionScope,
  inject,
  simpleClassAnnotation,
  classConfig
} from '../annotations';

export const CLASS_MONGODB_TABLECONFIGURATIONKEY = 'functionly:class:mongoTableConfiguration';
export const MONGO_TABLE_NAME_SUFFIX = '_TABLE_NAME';
export const MONGO_CONNECTION_URL = 'MONGO_CONNECTION_URL';

export const __mongoDefaults = {};
export const mongoConnection = (url: string) => environment(MONGO_CONNECTION_URL, url);
export const mongoCollection = (tableConfig: { collectionName: string; url?: string; environmentKey?: string }) => (
  target: Function
) => {
  let tableDefinitions = getMetadata(CLASS_MONGODB_TABLECONFIGURATIONKEY, target) || [];

  tableConfig.environmentKey = tableConfig.environmentKey || `%ClassName%${MONGO_TABLE_NAME_SUFFIX}`;
  const { templatedKey, templatedValue } = applyTemplates(
    tableConfig.environmentKey,
    tableConfig.collectionName,
    target
  );
  tableDefinitions.push({
    ...tableConfig,
    environmentKey: templatedKey,
    collectionName: templatedValue,
    definedBy: target.name
  });

  defineMetadata(CLASS_MONGODB_TABLECONFIGURATIONKEY, [ ...tableDefinitions ], target);

  const environmentSetter = environment(templatedKey, templatedValue);
  environmentSetter(target);
};

@injectable(InjectionScope.Singleton)
export class MongoConnection extends Api {
  private _connections: Map<string, any>;
  private _connectionPromises: Map<string, any>;

  constructor() {
    super();
    this._connections = new Map<string, any>();
    this._connectionPromises = new Map<string, any>();
  }

  public async connect(url): Promise<MongoDB.Db> {
    const connectionUrl = url || process.env.MONGO_CONNECTION_URL || 'mongodb://localhost:27017/test';

    if (this._connections.has(connectionUrl)) {
      return this._connections.get(connectionUrl);
    }

    if (this._connectionPromises.has(connectionUrl)) {
      return await this._connectionPromises.get(connectionUrl);
    }

    const connectionPromise = MongoDB.MongoClient.connect(connectionUrl);
    this._connections.set(connectionUrl, connectionPromise);

    const connection = await connectionPromise;
    this._connections.set(connectionUrl, connection);

    return connection;
  }
}

export class MongoCollection<T = any> extends Api implements MongoDB.Collection<T> {
  /* MongoDB.Collection<T> */
  get collectionName() {
    return this._collection.collectionName;
  }
  get namespace() {
    return this._collection.namespace;
  }
  get writeConcern() {
    return this._collection.writeConcern;
  }
  get readConcern() {
    return this._collection.readConcern;
  }
  get hint() {
    return this._collection.hint;
  }
  aggregate<T = T>(pipeline: Object[], callback: MongoDB.MongoCallback<T[]>): MongoDB.AggregationCursor<T>;
  aggregate<T = T>(
    pipeline: Object[],
    options?: MongoDB.CollectionAggregationOptions,
    callback?: MongoDB.MongoCallback<T[]>
  ): MongoDB.AggregationCursor<T>;
  aggregate(pipeline: any, options?: any, callback?: any) {
    return this._collection.aggregate(pipeline, options, callback) as any;
  }
  bulkWrite(operations: Object[], callback: MongoDB.MongoCallback<MongoDB.BulkWriteOpResultObject>): void;
  bulkWrite(
    operations: Object[],
    options?: MongoDB.CollectionBluckWriteOptions
  ): Promise<MongoDB.BulkWriteOpResultObject>;
  bulkWrite(
    operations: Object[],
    options: MongoDB.CollectionBluckWriteOptions,
    callback: MongoDB.MongoCallback<MongoDB.BulkWriteOpResultObject>
  ): void;
  bulkWrite(operations: any, options?: any, callback?: any) {
    return this._collection.bulkWrite(operations, options, callback) as any;
  }
  count(query: Object, callback: MongoDB.MongoCallback<number>): void;
  count(query: Object, options?: MongoDB.MongoCountPreferences): Promise<number>;
  count(query: Object, options: MongoDB.MongoCountPreferences, callback: MongoDB.MongoCallback<number>): void;
  count(query: any, options?: any, callback?: any) {
    return this._collection.count(query, options, callback) as any;
  }
  createIndex(fieldOrSpec: any, callback: MongoDB.MongoCallback<string>): void;
  createIndex(fieldOrSpec: any, options?: MongoDB.IndexOptions): Promise<string>;
  createIndex(fieldOrSpec: any, options: MongoDB.IndexOptions, callback: MongoDB.MongoCallback<string>): void;
  createIndex(fieldOrSpec: any, options?: any, callback?: any) {
    return this._collection.createIndex(fieldOrSpec, options, callback) as any;
  }
  createIndexes(indexSpecs: Object[]): Promise<any>;
  createIndexes(indexSpecs: Object[], callback: MongoDB.MongoCallback<any>): void;
  createIndexes(indexSpecs: any, callback?: any) {
    return this._collection.createIndexes(indexSpecs, callback) as any;
  }
  deleteMany(filter: Object, callback: MongoDB.MongoCallback<MongoDB.DeleteWriteOpResultObject>): void;
  deleteMany(filter: Object, options?: MongoDB.CollectionOptions): Promise<MongoDB.DeleteWriteOpResultObject>;
  deleteMany(
    filter: Object,
    options: MongoDB.CollectionOptions,
    callback: MongoDB.MongoCallback<MongoDB.DeleteWriteOpResultObject>
  ): void;
  deleteMany(filter: any, options?: any, callback?: any) {
    return this._collection.deleteMany(filter, options, callback) as any;
  }
  deleteOne(filter: Object, callback: MongoDB.MongoCallback<MongoDB.DeleteWriteOpResultObject>): void;
  deleteOne(
    filter: Object,
    options?: { w?: string | number; wtimmeout?: number; j?: boolean; bypassDocumentValidation?: boolean }
  ): Promise<MongoDB.DeleteWriteOpResultObject>;
  deleteOne(
    filter: Object,
    options: { w?: string | number; wtimmeout?: number; j?: boolean; bypassDocumentValidation?: boolean },
    callback: MongoDB.MongoCallback<MongoDB.DeleteWriteOpResultObject>
  ): void;
  deleteOne(filter: any, options?: any, callback?: any) {
    return this._collection.deleteOne(filter, options, callback) as any;
  }
  distinct(key: string, query: Object, callback: MongoDB.MongoCallback<any>): void;
  distinct(key: string, query: Object, options?: { readPreference?: string | MongoDB.ReadPreference }): Promise<any>;
  distinct(
    key: string,
    query: Object,
    options: { readPreference?: string | MongoDB.ReadPreference },
    callback: MongoDB.MongoCallback<any>
  ): void;
  distinct(key: any, query: any, options?: any, callback?: any) {
    return this._collection.distinct(key, query, options, callback) as any;
  }
  drop(): Promise<any>;
  drop(callback: MongoDB.MongoCallback<any>): void;
  drop(callback?: any) {
    return this._collection.drop(callback) as any;
  }
  dropIndex(indexName: string, callback: MongoDB.MongoCallback<any>): void;
  dropIndex(indexName: string, options?: MongoDB.CollectionOptions): Promise<any>;
  dropIndex(indexName: string, options: MongoDB.CollectionOptions, callback: MongoDB.MongoCallback<any>): void;
  dropIndex(indexName: any, options?: any, callback?: any) {
    return this._collection.dropIndex(indexName, options, callback) as any;
  }
  dropIndexes(): Promise<any>;
  dropIndexes(callback?: MongoDB.MongoCallback<any>): void;
  dropIndexes(callback?: any) {
    return this._collection.dropIndexes(callback) as any;
  }
  find<T = T>(query?: Object): MongoDB.Cursor<T>;
  find<T = T>(query: Object, fields?: Object, skip?: number, limit?: number, timeout?: number): MongoDB.Cursor<T>;
  find(query?: any, fields?: any, skip?: any, limit?: any, timeout?: any) {
    return this._collection.find(query, fields, skip, limit, timeout);
  }
  findOne<T = T>(filter: Object, callback: MongoDB.MongoCallback<T>): void;
  findOne<T = T>(filter: Object, options?: MongoDB.FindOneOptions): Promise<T>;
  findOne<T = T>(filter: Object, options: MongoDB.FindOneOptions, callback: MongoDB.MongoCallback<T>): void;
  findOne(filter: any, options?: any, callback?: any) {
    return this._collection.findOne(filter, options, callback) as any;
  }
  findOneAndDelete(filter: Object, callback: MongoDB.MongoCallback<MongoDB.FindAndModifyWriteOpResultObject<T>>): void;
  findOneAndDelete(
    filter: Object,
    options?: { projection?: Object; sort?: Object; maxTimeMS?: number }
  ): Promise<MongoDB.FindAndModifyWriteOpResultObject<T>>;
  findOneAndDelete(
    filter: Object,
    options: { projection?: Object; sort?: Object; maxTimeMS?: number },
    callback: MongoDB.MongoCallback<MongoDB.FindAndModifyWriteOpResultObject<T>>
  ): void;
  findOneAndDelete(filter: any, options?: any, callback?: any) {
    return this._collection.findOneAndDelete(filter, options, callback) as any;
  }
  findOneAndReplace(
    filter: Object,
    replacement: Object,
    callback: MongoDB.MongoCallback<MongoDB.FindAndModifyWriteOpResultObject<T>>
  ): void;
  findOneAndReplace(
    filter: Object,
    replacement: Object,
    options?: MongoDB.FindOneAndReplaceOption
  ): Promise<MongoDB.FindAndModifyWriteOpResultObject<T>>;
  findOneAndReplace(
    filter: Object,
    replacement: Object,
    options: MongoDB.FindOneAndReplaceOption,
    callback: MongoDB.MongoCallback<MongoDB.FindAndModifyWriteOpResultObject<T>>
  ): void;
  findOneAndReplace(filter: any, replacement: any, options?: any, callback?: any) {
    return this._collection.findOneAndReplace(filter, replacement, options, callback) as any;
  }
  findOneAndUpdate(
    filter: Object,
    update: Object,
    callback: MongoDB.MongoCallback<MongoDB.FindAndModifyWriteOpResultObject<T>>
  ): void;
  findOneAndUpdate(
    filter: Object,
    update: Object,
    options?: MongoDB.FindOneAndReplaceOption
  ): Promise<MongoDB.FindAndModifyWriteOpResultObject<T>>;
  findOneAndUpdate(
    filter: Object,
    update: Object,
    options: MongoDB.FindOneAndReplaceOption,
    callback: MongoDB.MongoCallback<MongoDB.FindAndModifyWriteOpResultObject<T>>
  ): void;
  findOneAndUpdate(filter: any, update: any, options?: any, callback?: any) {
    return this._collection.findOneAndUpdate(filter, update, options, callback) as any;
  }
  geoHaystackSearch(x: number, y: number, callback: MongoDB.MongoCallback<any>): void;
  geoHaystackSearch(x: number, y: number, options?: MongoDB.GeoHaystackSearchOptions): Promise<any>;
  geoHaystackSearch(
    x: number,
    y: number,
    options: MongoDB.GeoHaystackSearchOptions,
    callback: MongoDB.MongoCallback<any>
  ): void;
  geoHaystackSearch(x: any, y: any, options?: any, callback?: any) {
    return this._collection.geoHaystackSearch(x, y, options, callback) as any;
  }
  geoNear(x: number, y: number, callback: MongoDB.MongoCallback<any>): void;
  geoNear(x: number, y: number, options?: MongoDB.GeoNearOptions): Promise<any>;
  geoNear(x: number, y: number, options: MongoDB.GeoNearOptions, callback: MongoDB.MongoCallback<any>): void;
  geoNear(x: any, y: any, options?: any, callback?: any) {
    return this._collection.geoNear(x, y, options, callback) as any;
  }
  group(
    keys: Object | Function | any[] | MongoDB.Code,
    condition: Object,
    initial: Object,
    reduce: Function | MongoDB.Code,
    finalize: Function | MongoDB.Code,
    command: boolean,
    callback: MongoDB.MongoCallback<any>
  ): void;
  group(
    keys: Object | Function | any[] | MongoDB.Code,
    condition: Object,
    initial: Object,
    reduce: Function | MongoDB.Code,
    finalize: Function | MongoDB.Code,
    command: boolean,
    options?: { readPreference?: string | MongoDB.ReadPreference }
  ): Promise<any>;
  group(
    keys: Object | Function | any[] | MongoDB.Code,
    condition: Object,
    initial: Object,
    reduce: Function | MongoDB.Code,
    finalize: Function | MongoDB.Code,
    command: boolean,
    options: { readPreference?: string | MongoDB.ReadPreference },
    callback: MongoDB.MongoCallback<any>
  ): void;
  group(
    keys: any,
    condition: any,
    initial: any,
    reduce: any,
    finalize: any,
    command: any,
    options?: any,
    callback?: any
  ) {
    return this._collection.group(keys, condition, initial, reduce, finalize, command, options, callback) as any;
  }
  indexes(): Promise<any>;
  indexes(callback: MongoDB.MongoCallback<any>): void;
  indexes(callback?: any) {
    return this._collection.indexes(callback) as any;
  }
  indexExists(indexes: string | string[]): Promise<boolean>;
  indexExists(indexes: string | string[], callback: MongoDB.MongoCallback<boolean>): void;
  indexExists(indexes: any, callback?: any) {
    return this._collection.indexExists(callback) as any;
  }
  indexInformation(callback: MongoDB.MongoCallback<any>): void;
  indexInformation(options?: { full: boolean }): Promise<any>;
  indexInformation(options: { full: boolean }, callback: MongoDB.MongoCallback<any>): void;
  indexInformation(options?: any, callback?: any) {
    return this._collection.indexInformation(options, callback) as any;
  }
  initializeOrderedBulkOp(options?: MongoDB.CollectionOptions): MongoDB.OrderedBulkOperation {
    return this._collection.initializeOrderedBulkOp(options);
  }
  initializeUnorderedBulkOp(options?: MongoDB.CollectionOptions): MongoDB.UnorderedBulkOperation {
    return this._collection.initializeUnorderedBulkOp(options);
  }
  insert(docs: Object, callback: MongoDB.MongoCallback<MongoDB.InsertOneWriteOpResult>): void;
  insert(docs: Object, options?: MongoDB.CollectionInsertOneOptions): Promise<MongoDB.InsertOneWriteOpResult>;
  insert(
    docs: Object,
    options: MongoDB.CollectionInsertOneOptions,
    callback: MongoDB.MongoCallback<MongoDB.InsertOneWriteOpResult>
  ): void;
  insert(docs: any, options?: any, callback?: any) {
    return this._collection.insert(docs, options, callback) as any;
  }
  insertMany(docs: Object[], callback: MongoDB.MongoCallback<MongoDB.InsertWriteOpResult>): void;
  insertMany(docs: Object[], options?: MongoDB.CollectionInsertManyOptions): Promise<MongoDB.InsertWriteOpResult>;
  insertMany(
    docs: Object[],
    options: MongoDB.CollectionInsertManyOptions,
    callback: MongoDB.MongoCallback<MongoDB.InsertWriteOpResult>
  ): void;
  insertMany(docs: any, options?: any, callback?: any) {
    return this._collection.insertMany(docs, options, callback) as any;
  }
  insertOne(docs: Object, callback: MongoDB.MongoCallback<MongoDB.InsertOneWriteOpResult>): void;
  insertOne(docs: Object, options?: MongoDB.CollectionInsertOneOptions): Promise<MongoDB.InsertOneWriteOpResult>;
  insertOne(
    docs: Object,
    options: MongoDB.CollectionInsertOneOptions,
    callback: MongoDB.MongoCallback<MongoDB.InsertOneWriteOpResult>
  ): void;
  insertOne(docs: any, options?: any, callback?: any) {
    return this._collection.insertOne(docs, options, callback) as any;
  }
  isCapped(): Promise<any>;
  isCapped(callback: MongoDB.MongoCallback<any>): void;
  isCapped(callback?: any) {
    return this._collection.isCapped(callback) as any;
  }
  listIndexes(options?: {
    batchSize?: number;
    readPreference?: string | MongoDB.ReadPreference;
  }): MongoDB.CommandCursor {
    return this._collection.listIndexes(options);
  }
  mapReduce(map: string | Function, reduce: string | Function, callback: MongoDB.MongoCallback<any>): void;
  mapReduce(map: string | Function, reduce: string | Function, options?: MongoDB.MapReduceOptions): Promise<any>;
  mapReduce(
    map: string | Function,
    reduce: string | Function,
    options: MongoDB.MapReduceOptions,
    callback: MongoDB.MongoCallback<any>
  ): void;
  mapReduce(map: any, reduce: any, options?: any, callback?: any) {
    return this._collection.mapReduce(map, reduce, options, callback) as any;
  }
  options(): Promise<any>;
  options(callback: MongoDB.MongoCallback<any>): void;
  options(callback?: any) {
    return this._collection.options(callback) as any;
  }
  parallelCollectionScan(callback: MongoDB.MongoCallback<MongoDB.Cursor<any>[]>): void;
  parallelCollectionScan(options?: MongoDB.ParallelCollectionScanOptions): Promise<MongoDB.Cursor<any>[]>;
  parallelCollectionScan(
    options: MongoDB.ParallelCollectionScanOptions,
    callback: MongoDB.MongoCallback<MongoDB.Cursor<any>[]>
  ): void;
  parallelCollectionScan(options?: any, callback?: any) {
    return this._collection.parallelCollectionScan(options, callback) as any;
  }
  reIndex(): Promise<any>;
  reIndex(callback: MongoDB.MongoCallback<any>): void;
  reIndex(callback?: any) {
    return this._collection.reIndex(callback) as any;
  }
  remove(selector: Object, callback: MongoDB.MongoCallback<MongoDB.WriteOpResult>): void;
  remove(selector: Object, options?: MongoDB.CollectionOptions & { single?: boolean }): Promise<MongoDB.WriteOpResult>;
  remove(
    selector: Object,
    options?: MongoDB.CollectionOptions & { single?: boolean },
    callback?: MongoDB.MongoCallback<MongoDB.WriteOpResult>
  ): void;
  remove(selector: any, options?: any, callback?: any) {
    return this._collection.remove(selector, options, callback) as any;
  }
  rename(newName: string, callback: MongoDB.MongoCallback<MongoDB.Collection<T>>): void;
  rename(newName: string, options?: { dropTarget?: boolean }): Promise<MongoDB.Collection<T>>;
  rename(
    newName: string,
    options: { dropTarget?: boolean },
    callback: MongoDB.MongoCallback<MongoDB.Collection<T>>
  ): void;
  rename(newName: any, options?: any, callback?: any) {
    return this._collection.rename(newName, options, callback) as any;
  }
  replaceOne(
    filter: Object,
    doc: Object,
    callback: MongoDB.MongoCallback<MongoDB.UpdateWriteOpResult & { ops: any[] }>
  ): void;
  replaceOne(
    filter: Object,
    doc: Object,
    options?: MongoDB.ReplaceOneOptions
  ): Promise<MongoDB.UpdateWriteOpResult & { ops: any[] }>;
  replaceOne(
    filter: Object,
    doc: Object,
    options: MongoDB.ReplaceOneOptions,
    callback: MongoDB.MongoCallback<MongoDB.UpdateWriteOpResult & { ops: any[] }>
  ): void;
  replaceOne(filter: any, doc: any, options?: any, callback?: any) {
    return this._collection.replaceOne(filter, doc, options, callback) as any;
  }
  save(doc: Object, callback: MongoDB.MongoCallback<MongoDB.WriteOpResult>): void;
  save(doc: Object, options?: MongoDB.CollectionOptions): Promise<MongoDB.WriteOpResult>;
  save(doc: Object, options: MongoDB.CollectionOptions, callback: MongoDB.MongoCallback<MongoDB.WriteOpResult>): void;
  save(doc: any, options?: any, callback?: any) {
    return this._collection.save(doc, options, callback) as any;
  }
  stats(callback: MongoDB.MongoCallback<MongoDB.CollStats>): void;
  stats(options?: { scale: number }): Promise<MongoDB.CollStats>;
  stats(options: { scale: number }, callback: MongoDB.MongoCallback<MongoDB.CollStats>): void;
  stats(options?: any, callback?: any) {
    return this._collection.stats(options, callback) as any;
  }
  update(filter: Object, update: Object, callback: MongoDB.MongoCallback<MongoDB.WriteOpResult>): void;
  update(
    filter: Object,
    update: Object,
    options?: MongoDB.ReplaceOneOptions & { multi?: boolean }
  ): Promise<MongoDB.WriteOpResult>;
  update(
    filter: Object,
    update: Object,
    options: MongoDB.ReplaceOneOptions & { multi?: boolean },
    callback: MongoDB.MongoCallback<MongoDB.WriteOpResult>
  ): void;
  update(filter: any, update: any, options?: any, callback?: any) {
    return this._collection.update(filter, update, options, callback) as any;
  }
  updateMany(filter: Object, update: Object, callback: MongoDB.MongoCallback<MongoDB.UpdateWriteOpResult>): void;
  updateMany(
    filter: Object,
    update: Object,
    options?: { upsert?: boolean; w?: any; wtimeout?: number; j?: boolean }
  ): Promise<MongoDB.UpdateWriteOpResult>;
  updateMany(
    filter: Object,
    update: Object,
    options: { upsert?: boolean; w?: any; wtimeout?: number; j?: boolean },
    callback: MongoDB.MongoCallback<MongoDB.UpdateWriteOpResult>
  ): void;
  updateMany(filter: any, update: any, options?: any, callback?: any) {
    return this._collection.updateMany(filter, update, options, callback) as any;
  }
  updateOne(filter: Object, update: Object, callback: MongoDB.MongoCallback<MongoDB.UpdateWriteOpResult>): void;
  updateOne(filter: Object, update: Object, options?: MongoDB.ReplaceOneOptions): Promise<MongoDB.UpdateWriteOpResult>;
  updateOne(
    filter: Object,
    update: Object,
    options: MongoDB.ReplaceOneOptions,
    callback: MongoDB.MongoCallback<MongoDB.UpdateWriteOpResult>
  ): void;
  updateOne(filter: any, update: any, options?: any, callback?: any) {
    return this._collection.updateMany(filter, update, options, callback) as any;
  }

  /* Api */
  private _collection: MongoDB.Collection<T>;
  private connection: MongoConnection;
  constructor(@inject(MongoConnection) connection: MongoConnection) {
    super();
    this.connection = connection;
  }

  public async init() {
    const tableConfig = (getMetadata(CLASS_MONGODB_TABLECONFIGURATIONKEY, this) || [])[0];

    const tableName =
      (process.env[`${this.constructor.name}${MONGO_TABLE_NAME_SUFFIX}`] || tableConfig.collectionName) +
      `-${process.env.FUNCTIONAL_STAGE}`;

    const db = await this.connection.connect(tableConfig.url);
    this._collection = db.collection(tableName);
  }

  public getCollection() {
    return this._collection;
  }
}
