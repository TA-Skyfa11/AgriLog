import crypto from 'crypto';
import { getSql } from '../config/db';

export function generateId(): string {
  return crypto.randomBytes(12).toString('hex');
}

export class ObjectId {
  public _id: string;

  constructor(id?: string | ObjectId | any) {
    if (id instanceof ObjectId) {
      this._id = id._id;
    } else if (id && typeof id === 'object' && id._id) {
      this._id = String(id._id);
    } else if (id && typeof id === 'string') {
      this._id = id;
    } else if (id && typeof id.toString === 'function') {
      this._id = id.toString();
    } else {
      this._id = generateId();
    }
  }

  toString(): string {
    return this._id;
  }

  toHexString(): string {
    return this._id;
  }

  valueOf(): string {
    return this._id;
  }

  equals(other: any): boolean {
    if (!other) return false;
    const otherStr = other instanceof ObjectId ? other._id : (other.toString ? other.toString() : String(other));
    return this._id === otherStr;
  }

  [Symbol.toPrimitive](): string {
    return this._id;
  }

  static isValid(val: any): boolean {
    if (!val) return false;
    const str = typeof val === 'string' ? val : (val.toString ? val.toString() : '');
    return /^[0-9a-fA-F]{24}$/.test(str) || /^[0-9a-fA-F-]{36}$/.test(str);
  }
}

export const Types = {
  ObjectId: function(id?: any) {
    return new ObjectId(id);
  } as any,
  Mixed: {} as any,
};
Types.ObjectId.isValid = ObjectId.isValid;

export namespace Types {
  export type ObjectId = string | any;
  export type Mixed = any;
}

export class Schema<T = any> {
  public definition: any;
  public options: any;
  public static Types = Types;

  constructor(definition?: any, options?: any) {
    this.definition = definition;
    this.options = options;
  }

  index(_fields: any, _options?: any): this {
    return this;
  }
}

export interface Document {
  _id: any;
  id?: any;
  createdAt?: Date;
  updatedAt?: Date;
  save(): Promise<any>;
  deleteOne(): Promise<any>;
  toObject(): any;
  toJSON(): any;
  [key: string]: any;
}

export const TABLE_MAP: Record<string, string> = {
  User: 'users',
  users: 'users',
  user: 'users',
  company: 'users',
  farm: 'users',
  updatedBy: 'users',
  FarmProfile: 'farm_profiles',
  farmProfile: 'farm_profiles',
  farm_profiles: 'farm_profiles',
  CompanyProfile: 'company_profiles',
  company_profiles: 'company_profiles',
  CultivationBoard: 'cultivation_boards',
  cultivationBoard: 'cultivation_boards',
  cultivation_boards: 'cultivation_boards',
  CultivationEntry: 'cultivation_entries',
  cultivation_entries: 'cultivation_entries',
  FertilizerBoard: 'fertilizer_boards',
  fertilizerBoard: 'fertilizer_boards',
  fertilizer_boards: 'fertilizer_boards',
  FertilizerEntry: 'fertilizer_entries',
  fertilizer_entries: 'fertilizer_entries',
  PesticideBoard: 'pesticide_boards',
  pesticideBoard: 'pesticide_boards',
  pesticide_boards: 'pesticide_boards',
  PesticideEntry: 'pesticide_entries',
  pesticide_entries: 'pesticide_entries',
  Material: 'materials',
  material: 'materials',
  materials: 'materials',
  MaterialLog: 'material_logs',
  material_logs: 'material_logs',
  Notification: 'notifications',
  notifications: 'notifications',
  Order: 'orders',
  orders: 'orders',
  PaymentTransaction: 'payment_transactions',
  payment_transactions: 'payment_transactions',
  Product: 'products',
  products: 'products',
  ServicePackage: 'service_packages',
  service_packages: 'service_packages',
  SystemFeature: 'system_features',
  system_features: 'system_features',
  Task: 'tasks',
  tasks: 'tasks',
  TrialSetting: 'trial_settings',
  trial_settings: 'trial_settings',
  UploadLog: 'upload_logs',
  upload_logs: 'upload_logs',
  CommissionSetting: 'commission_settings',
  commission_settings: 'commission_settings',
  LoginHistory: 'login_histories',
  login_histories: 'login_histories',
};

function formatParam(val: any): any {
  if (val === undefined) return null;
  if (val instanceof Date) return val.toISOString();
  if (val instanceof ObjectId) return val.toString();
  if (typeof val === 'boolean') return String(val); // 'true' or 'false' for PostgreSQL JSONB text matching
  if (val && typeof val === 'object' && val._id) return String(val._id);
  return val;
}

export function buildWhere(filter: any, params: any[]): string {
  if (!filter || Object.keys(filter).length === 0) {
    return '1=1';
  }

  const conditions: string[] = [];

  for (const [key, val] of Object.entries(filter)) {
    if (key === '$or') {
      if (Array.isArray(val) && val.length > 0) {
        const subConds = val.map(subFilter => buildWhere(subFilter, params));
        conditions.push(`(${subConds.join(' OR ')})`);
      }
      continue;
    }

    if (key === '$and') {
      if (Array.isArray(val) && val.length > 0) {
        const subConds = val.map(subFilter => buildWhere(subFilter, params));
        conditions.push(`(${subConds.join(' AND ')})`);
      }
      continue;
    }

    const isId = (key === '_id' || key === 'id');
    const isCreatedAt = (key === 'createdAt');
    const isUpdatedAt = (key === 'updatedAt');

    let colRef: string;
    if (isId) colRef = 'id';
    else if (isCreatedAt) colRef = 'created_at';
    else if (isUpdatedAt) colRef = 'updated_at';
    else if (key.includes('.')) {
      const [parent, child] = key.split('.');
      params.push(formatParam(val));
      const pIdx = params.length;
      conditions.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(COALESCE(data->'${parent}', '[]'::jsonb)) elem WHERE elem->>'${child}' = $${pIdx})`);
      continue;
    } else {
      colRef = `data->>'${key}'`;
    }

    if (val === null || val === undefined) {
      if (isId) {
        conditions.push('id IS NULL');
      } else {
        conditions.push(`(${colRef} IS NULL)`);
      }
      continue;
    }

    if (typeof val === 'object' && !(val instanceof Date) && !(val instanceof ObjectId) && !Array.isArray(val)) {
      for (const [op, opVal] of Object.entries(val)) {
        if (op === '$in') {
          const arr = (Array.isArray(opVal) ? opVal : [opVal]).map(formatParam);
          params.push(arr);
          const pIdx = params.length;
          conditions.push(`${colRef} = ANY($${pIdx})`);
        } else if (op === '$ne') {
          params.push(formatParam(opVal));
          const pIdx = params.length;
          if (isId) {
            conditions.push(`id != $${pIdx}`);
          } else {
            conditions.push(`(${colRef} IS NULL OR ${colRef} != $${pIdx})`);
          }
        } else if (op === '$gte' || op === '$lte' || op === '$gt' || op === '$lt') {
          const sqlOp = op === '$gte' ? '>=' : op === '$lte' ? '<=' : op === '$gt' ? '>' : '<';
          const pVal = formatParam(opVal);
          params.push(pVal);
          const pIdx = params.length;
          if (isCreatedAt || isUpdatedAt) {
            conditions.push(`${colRef} ${sqlOp} $${pIdx}::timestamptz`);
          } else if (typeof opVal === 'number') {
            conditions.push(`(${colRef})::numeric ${sqlOp} $${pIdx}`);
          } else {
            conditions.push(`(${colRef})::timestamptz ${sqlOp} $${pIdx}::timestamptz`);
          }
        } else if (op === '$regex') {
          let pat = String(opVal);
          let sqlPattern: string;
          if (pat.startsWith('^') && pat.endsWith('$')) {
            sqlPattern = pat.slice(1, -1);
          } else if (pat.startsWith('^')) {
            sqlPattern = `${pat.slice(1)}%`;
          } else if (pat.endsWith('$')) {
            sqlPattern = `%${pat.slice(0, -1)}`;
          } else {
            sqlPattern = `%${pat}%`;
          }
          params.push(sqlPattern);
          const pIdx = params.length;
          conditions.push(`${colRef} ILIKE $${pIdx}`);
        }
      }
      continue;
    }

    // Plain equality
    params.push(formatParam(val));
    const pIdx = params.length;
    conditions.push(`${colRef} = $${pIdx}`);
  }

  return conditions.length > 0 ? conditions.join(' AND ') : '1=1';
}

export function applyUpdates(existingData: any, updateObj: any): any {
  const result = { ...existingData };

  if (updateObj.$set) {
    Object.assign(result, updateObj.$set);
  }

  if (updateObj.$inc) {
    for (const [field, incVal] of Object.entries(updateObj.$inc)) {
      result[field] = (Number(result[field]) || 0) + Number(incVal);
    }
  }

  // Direct fields (not $-prefixed)
  for (const [k, v] of Object.entries(updateObj)) {
    if (!k.startsWith('$')) {
      result[k] = v;
    }
  }

  delete result._id;
  delete result.id;
  delete result.createdAt;
  delete result.updatedAt;

  return result;
}

function applySchemaDefaults(raw: any, schema?: any): any {
  if (!schema || !schema.definition || !raw) return raw;
  const result = { ...raw };
  for (const [key, fieldDef] of Object.entries(schema.definition)) {
    if (result[key] === undefined && fieldDef) {
      if (typeof fieldDef === 'object' && 'default' in (fieldDef as any)) {
        const defVal = (fieldDef as any).default;
        result[key] = typeof defVal === 'function' ? defVal() : defVal;
      }
    }
  }
  return result;
}

export function createDoc<T = any>(tableName: string, row: any, modelInstance?: any): T & Document {
  if (!row) return null as any;
  let docData = typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {});
  const id = row.id;

  if (modelInstance?.schema) {
    docData = applySchemaDefaults(docData, modelInstance.schema);
    for (const [k, v] of Object.entries(docData)) {
      const fieldDef = modelInstance.schema.definition?.[k];
      const isDateField = fieldDef === Date || fieldDef?.type === Date || k.endsWith('Date') || k.endsWith('At');
      if (isDateField && typeof v === 'string') {
        const parsed = new Date(v);
        if (!isNaN(parsed.getTime())) {
          docData[k] = parsed;
        }
      }
    }
  }

  const doc: any = {
    ...docData,
    _id: id,
    id: id,
    createdAt: row.created_at instanceof Date ? row.created_at : new Date(row.created_at),
    updatedAt: row.updated_at instanceof Date ? row.updated_at : new Date(row.updated_at),
  };

  doc.toObject = function() {
    const obj = { ...this };
    delete obj.toObject;
    delete obj.toJSON;
    delete obj.save;
    delete obj.deleteOne;
    return obj;
  };

  doc.toJSON = function() {
    return this.toObject();
  };

  doc.save = async function() {
    const sql = getSql();
    const raw = this.toObject();
    const saveId = this._id || this.id;
    const createdAt = raw.createdAt || new Date();
    const updatedAt = new Date();
    delete raw._id;
    delete raw.id;
    delete raw.createdAt;
    delete raw.updatedAt;

    const [updatedRow] = await sql.unsafe(
      `INSERT INTO public.${tableName} (id, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (id) DO UPDATE SET data = $2, updated_at = $4
       RETURNING *`,
      [saveId, (sql as any).json(raw), createdAt, updatedAt]
    );
    this.updatedAt = updatedRow.updated_at instanceof Date ? updatedRow.updated_at : new Date(updatedRow.updated_at);
    return this;
  };

  doc.deleteOne = async function() {
    const sql = getSql();
    await sql.unsafe(`DELETE FROM public.${tableName} WHERE id = $1`, [this._id]);
    return { acknowledged: true, deletedCount: 1 };
  };

  return doc;
}

export class Query<T = any> {
  private tableName: string;
  private filter: any;
  private modelInstance: any;
  private isSingle: boolean;
  private _sort: any = null;
  private _limit: number | null = null;
  private _skip: number | null = null;
  private _select: any = null;
  private _populates: Array<{ path: string; select?: string }> = [];
  private _isLean = false;

  constructor(tableName: string, filter: any, modelInstance: any, isSingle = false) {
    this.tableName = tableName;
    this.filter = filter || {};
    this.modelInstance = modelInstance;
    this.isSingle = isSingle;
    if (isSingle) this._limit = 1;
  }

  sort(sortObj: any): this {
    this._sort = sortObj;
    return this;
  }

  limit(n: number): this {
    if (!this.isSingle) this._limit = n;
    return this;
  }

  skip(n: number): this {
    this._skip = n;
    return this;
  }

  select(fields: any): this {
    this._select = fields;
    return this;
  }

  populate(path: string, select?: string): this {
    this._populates.push({ path, select });
    return this;
  }

  lean(): this {
    this._isLean = true;
    return this;
  }

  async exec(): Promise<T> {
    const sql = getSql();
    const params: any[] = [];
    const whereSql = buildWhere(this.filter, params);

    let querySql = `SELECT id, data, created_at, updated_at FROM public.${this.tableName} WHERE ${whereSql}`;

    if (this._sort) {
      const sortParts: string[] = [];
      for (const [k, dir] of Object.entries(this._sort)) {
        const order = dir === 1 || dir === 'asc' ? 'ASC' : 'DESC';
        if (k === 'createdAt') sortParts.push(`created_at ${order}`);
        else if (k === 'updatedAt') sortParts.push(`updated_at ${order}`);
        else if (k === 'dueDate') sortParts.push(`(data->>'dueDate')::timestamptz ${order}`);
        else if (k === 'price') sortParts.push(`((data->>'price')::numeric) ${order}`);
        else sortParts.push(`(data->>'${k}') ${order}`);
      }
      if (sortParts.length > 0) {
        querySql += ` ORDER BY ${sortParts.join(', ')}`;
      }
    } else {
      querySql += ` ORDER BY created_at DESC`;
    }

    if (this._limit !== null) {
      querySql += ` LIMIT ${Number(this._limit)}`;
    }

    if (this._skip !== null) {
      querySql += ` OFFSET ${Number(this._skip)}`;
    }

    const rows = await sql.unsafe(querySql, params);
    let results: any[] = rows.map(r => createDoc(this.tableName, r, this.modelInstance));

    // Handle populates
    for (const pop of this._populates) {
      const path = pop.path;
      const targetTable = TABLE_MAP[path];
      if (!targetTable) continue;

      const refIds = [...new Set(results.map(d => d[path]).filter(id => id && typeof id === 'string'))];
      if (refIds.length > 0) {
        const refRows = await sql.unsafe(
          `SELECT id, data, created_at, updated_at FROM public.${targetTable} WHERE id = ANY($1)`,
          [refIds]
        );
        const refMap = new Map();
        for (const r of refRows) {
          const refDoc = createDoc(targetTable, r, null);
          if (pop.select) {
            const allowed = pop.select.split(' ').filter(Boolean);
            const projected: any = { _id: refDoc._id, id: refDoc._id };
            for (const f of allowed) {
              if (refDoc[f] !== undefined) projected[f] = refDoc[f];
            }
            refMap.set(refDoc._id, projected);
          } else {
            refMap.set(refDoc._id, refDoc);
          }
        }

        for (const d of results) {
          if (d[path] && refMap.has(d[path])) {
            d[path] = refMap.get(d[path]);
          }
        }
      }
    }

    // Handle select projection
    if (this._select) {
      const allowed = typeof this._select === 'string' ? this._select.split(' ').filter(Boolean) : this._select;
      if (allowed.length === 1 && allowed[0] === '_id') {
        results = results.map(d => ({ _id: d._id, id: d._id }));
      }
    }

    if (this._isLean) {
      results = results.map(d => (d.toObject ? d.toObject() : d));
    }

    return (this.isSingle ? (results[0] || null) : results) as unknown as T;
  }

  then<TResult1 = T, TResult2 = never>(
    onFulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onRejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onFulfilled, onRejected);
  }

  catch<TResult = never>(
    onRejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    return this.exec().catch(onRejected);
  }
}

export interface ModelType<T extends Document = any> {
  new (data?: any): T;
  modelName: string;
  tableName: string;
  create(docOrDocs: any): Promise<any>;
  insertMany(docs: any[]): Promise<any[]>;
  find(filter?: any, projection?: any): Query<T[]>;
  findOne(filter?: any, projection?: any): Query<T>;
  findById(id: any, projection?: any): Query<T>;
  findByIdAndUpdate(id: any, update: any, options?: any): Promise<T>;
  findOneAndUpdate(filter: any, update: any, options?: any): Promise<T>;
  findByIdAndDelete(id: any): Promise<T>;
  findOneAndDelete(filter: any): Promise<T>;
  updateOne(filter: any, update: any, options?: any): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }>;
  updateMany(filter: any, update: any, options?: any): Promise<{ acknowledged: boolean; matchedCount: number; modifiedCount: number }>;
  deleteOne(filter: any): Promise<{ acknowledged: boolean; deletedCount: number }>;
  deleteMany(filter?: any): Promise<{ acknowledged: boolean; deletedCount: number }>;
  countDocuments(filter?: any, options?: any, ...args: any[]): Promise<number>;
}

export function model<T extends Document = any>(modelName: string, schema?: any): ModelType<T> {
  const table = TABLE_MAP[modelName] || modelName.toLowerCase();

  function ModelConstructor(this: any, data?: any) {
    const id = data?._id ? String(data._id) : (data?.id ? String(data.id) : generateId());
    const raw = applySchemaDefaults({ ...data }, schema);
    const row = {
      id,
      data: raw,
      created_at: new Date(),
      updated_at: new Date(),
    };
    delete row.data._id;
    delete row.data.id;
    return createDoc<T>(table, row, ModelConstructor as any);
  }

  ModelConstructor.modelName = modelName;
  ModelConstructor.tableName = table;
  (ModelConstructor as any).schema = schema;

  ModelConstructor.create = async function(docOrDocs: any): Promise<any> {
    const sql = getSql();
    if (Array.isArray(docOrDocs)) {
      const docs: any[] = [];
      for (const d of docOrDocs) {
        docs.push(await ModelConstructor.create(d));
      }
      return docs;
    }

    const id = docOrDocs._id ? String(docOrDocs._id) : (docOrDocs.id ? String(docOrDocs.id) : generateId());
    const raw = applySchemaDefaults({ ...docOrDocs }, schema);
    delete raw._id;
    delete raw.id;
    delete raw.createdAt;
    delete raw.updatedAt;

    for (const [k, v] of Object.entries(raw)) {
      if (v instanceof ObjectId) {
        raw[k] = v.toString();
      }
    }

    const now = new Date();
    const [row] = await sql.unsafe(
      `INSERT INTO public.${table} (id, data, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, (sql as any).json(raw), now, now]
    );
    return createDoc<T>(table, row, ModelConstructor);
  };

  ModelConstructor.insertMany = async function(docs: any[]): Promise<any[]> {
    return ModelConstructor.create(docs);
  };

  ModelConstructor.find = function(filter?: any, projection?: any): Query<T[]> {
    const q = new Query<T[]>(table, filter, ModelConstructor, false);
    if (projection) q.select(projection);
    return q;
  };

  ModelConstructor.findOne = function(filter?: any, projection?: any): Query<T> {
    const q = new Query<T>(table, filter, ModelConstructor, true);
    if (projection) q.select(projection);
    return q;
  };

  ModelConstructor.findById = function(id: any, projection?: any): Query<T> {
    const idStr = id instanceof ObjectId ? id.toString() : String(id);
    const q = new Query<T>(table, { _id: idStr }, ModelConstructor, true);
    if (projection) q.select(projection);
    return q;
  };

  ModelConstructor.findByIdAndUpdate = async function(id: any, update: any, options: any = {}): Promise<any> {
    const idStr = id instanceof ObjectId ? id.toString() : String(id);
    return ModelConstructor.findOneAndUpdate({ _id: idStr }, update, options);
  };

  ModelConstructor.findOneAndUpdate = async function(filter: any, update: any, options: any = {}): Promise<any> {
    const sql = getSql();
    const existing = await ModelConstructor.findOne(filter);
    if (!existing) return null;

    const updatedData = applyUpdates(existing.toObject(), update);
    const now = new Date();

    const [updatedRow] = await sql.unsafe(
      `UPDATE public.${table}
       SET data = $1, updated_at = $2
       WHERE id = $3
       RETURNING *`,
      [(sql as any).json(updatedData), now, existing._id]
    );

    const returnAfter = options.new === true || options.returnDocument === 'after' || (!options.returnDocument && options.new !== false);
    return returnAfter ? createDoc<T>(table, updatedRow, ModelConstructor) : existing;
  };

  ModelConstructor.findByIdAndDelete = async function(id: any): Promise<any> {
    const idStr = id instanceof ObjectId ? id.toString() : String(id);
    return ModelConstructor.findOneAndDelete({ _id: idStr });
  };

  ModelConstructor.findOneAndDelete = async function(filter: any): Promise<any> {
    const sql = getSql();
    const existing = await ModelConstructor.findOne(filter);
    if (!existing) return null;
    await sql.unsafe(`DELETE FROM public.${table} WHERE id = $1`, [existing._id]);
    return existing;
  };

  ModelConstructor.updateOne = async function(filter: any, update: any): Promise<any> {
    const sql = getSql();
    const existing = await ModelConstructor.findOne(filter);
    if (!existing) return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
    const updatedData = applyUpdates(existing.toObject(), update);
    await sql.unsafe(
      `UPDATE public.${table} SET data = $1, updated_at = NOW() WHERE id = $2`,
      [(sql as any).json(updatedData), existing._id]
    );
    return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
  };

  ModelConstructor.updateMany = async function(filter: any, update: any): Promise<any> {
    const sql = getSql();
    const docs = await ModelConstructor.find(filter);
    let count = 0;
    for (const d of docs) {
      const updatedData = applyUpdates(d.toObject(), update);
      await sql.unsafe(
        `UPDATE public.${table} SET data = $1, updated_at = NOW() WHERE id = $2`,
        [(sql as any).json(updatedData), d._id]
      );
      count++;
    }
    return { acknowledged: true, matchedCount: count, modifiedCount: count };
  };

  ModelConstructor.deleteOne = async function(filter: any): Promise<any> {
    const sql = getSql();
    const existing = await ModelConstructor.findOne(filter);
    if (!existing) return { acknowledged: true, deletedCount: 0 };
    await sql.unsafe(`DELETE FROM public.${table} WHERE id = $1`, [existing._id]);
    return { acknowledged: true, deletedCount: 1 };
  };

  ModelConstructor.deleteMany = async function(filter: any = {}): Promise<any> {
    const sql = getSql();
    const params: any[] = [];
    const whereSql = buildWhere(filter, params);
    const rows = await sql.unsafe(
      `DELETE FROM public.${table} WHERE ${whereSql} RETURNING id`,
      params
    );
    return { acknowledged: true, deletedCount: rows.length };
  };

  ModelConstructor.countDocuments = async function(filter: any = {}, _options?: any, ..._args: any[]): Promise<number> {
    const sql = getSql();
    const params: any[] = [];
    const whereSql = buildWhere(filter, params);
    const [res] = await sql.unsafe(
      `SELECT COUNT(*) as count FROM public.${table} WHERE ${whereSql}`,
      params
    );
    return Number(res?.count || 0);
  };

  return ModelConstructor as unknown as ModelType<T>;
}

const mongoose = {
  Types,
  Schema,
  model,
  connect: async () => {},
  disconnect: async () => {},
  connection: { host: 'supabase-postgresql' },
};

export default mongoose;
