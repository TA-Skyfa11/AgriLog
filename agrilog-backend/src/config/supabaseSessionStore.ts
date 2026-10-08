import session from 'express-session';
import { getSql } from './db';

export class SupabaseSessionStore extends session.Store {
  private pruneInterval?: NodeJS.Timeout;

  constructor() {
    super();
    // Prune expired sessions every 15 minutes
    this.pruneInterval = setInterval(() => {
      this.pruneExpired().catch(() => {});
    }, 15 * 60 * 1000);
    if (this.pruneInterval.unref) {
      this.pruneInterval.unref();
    }
  }

  async get(sid: string, callback: (err?: any, session?: session.SessionData | null) => void): Promise<void> {
    try {
      const sql = getSql();
      const rows = await sql.unsafe(
        `SELECT sess FROM public.sessions WHERE sid = $1 AND expire > NOW() LIMIT 1`,
        [sid]
      );
      if (rows.length === 0) {
        return callback(null, null);
      }
      const data = typeof rows[0].sess === 'string' ? JSON.parse(rows[0].sess) : rows[0].sess;
      callback(null, data);
    } catch (err) {
      callback(err);
    }
  }

  async set(sid: string, sess: session.SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      const sql = getSql();
      let expire: Date;
      if (sess && sess.cookie && sess.cookie.expires) {
        expire = new Date(sess.cookie.expires);
      } else {
        const oneDay = 24 * 60 * 60 * 1000;
        const maxAge = sess?.cookie?.maxAge || oneDay * 30;
        expire = new Date(Date.now() + maxAge);
      }

      await sql.unsafe(
        `INSERT INTO public.sessions (sid, sess, expire)
         VALUES ($1, $2::jsonb, $3)
         ON CONFLICT (sid) DO UPDATE SET sess = $2::jsonb, expire = $3`,
        [sid, JSON.stringify(sess), expire.toISOString()]
      );
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  async destroy(sid: string, callback?: (err?: any) => void): Promise<void> {
    try {
      const sql = getSql();
      await sql.unsafe(`DELETE FROM public.sessions WHERE sid = $1`, [sid]);
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  async touch(sid: string, sess: session.SessionData, callback?: (err?: any) => void): Promise<void> {
    try {
      const sql = getSql();
      let expire: Date;
      if (sess && sess.cookie && sess.cookie.expires) {
        expire = new Date(sess.cookie.expires);
      } else {
        const maxAge = sess?.cookie?.maxAge || 30 * 24 * 60 * 60 * 1000;
        expire = new Date(Date.now() + maxAge);
      }
      await sql.unsafe(
        `UPDATE public.sessions SET expire = $1 WHERE sid = $2`,
        [expire.toISOString(), sid]
      );
      if (callback) callback(null);
    } catch (err) {
      if (callback) callback(err);
    }
  }

  private async pruneExpired(): Promise<void> {
    try {
      const sql = getSql();
      await sql.unsafe(`DELETE FROM public.sessions WHERE expire <= NOW()`);
    } catch {
      // Ignore background prune error
    }
  }
}

export default SupabaseSessionStore;
