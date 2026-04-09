import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from './db';

const KEYS = {
  SESSION: 'mstore_auth_user',
};

// Types
export interface Product {
  id: number;
  name: string;
  current_quantity: number;
  original_quantity: number;
  image_url: string;
  created_at?: string;
}

export interface User {
  id: number;
  username: string;
  full_name: string;
  role: string;
  security_answer?: string;
  password?: string;
  created_at?: string;
}

export interface Log {
  id: number;
  product_name: string;
  quantity: number;
  note: string;
  employee_name: string;
  created_at: string;
  username: string;
}

export const initStorage = async () => {
  try {
    // 1. Create Tables
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        full_name TEXT,
        role TEXT,
        password TEXT,
        security_answer TEXT,
        created_at TEXT DEFAULT ''
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        original_quantity INTEGER,
        current_quantity INTEGER,
        image_url TEXT,
        created_at TEXT DEFAULT ''
      );
    `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_name TEXT,
        quantity INTEGER,
        note TEXT,
        employee_name TEXT,
        username TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Migrations (Safe column additions)
    const migrations = [
      "ALTER TABLE users ADD COLUMN security_answer TEXT",
      "ALTER TABLE users ADD COLUMN created_at TEXT DEFAULT ''",
      "ALTER TABLE products ADD COLUMN created_at TEXT DEFAULT ''"
    ];

    for (const sql of migrations) {
      try {
        await db.execute(sql);
      } catch (e) {
        // Silently fail if column already exists
      }
    }

    // 3. Initial Admin Setup
    const usersCount = await db.execute('SELECT COUNT(*) as count FROM users');
    if (Number(usersCount.rows[0].count) === 0) {
      await db.execute({
        sql: 'INSERT INTO users (username, full_name, role, password, security_answer, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        args: ['admin', 'المسؤول الرئيسي', 'admin', 'admin123', 'العنزي', new Date().toISOString()]
      });
    }
  } catch (error) {
    console.error('Storage Initialization Failed:', error);
  }
};

export const StorageService = {
  // Auth
  login: async (username: string, password: string): Promise<User> => {
    const result = await db.execute({
      sql: 'SELECT id, username, full_name, role FROM users WHERE username = ? AND password = ?',
      args: [username, password],
    });

    if (result.rows.length > 0) {
      const user = result.rows[0] as unknown as User;
      await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
  },

  getSession: async (): Promise<User | null> => {
    const session = await AsyncStorage.getItem(KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },

  logout: async () => {
    await AsyncStorage.removeItem(KEYS.SESSION);
  },

  // Products
  getProducts: async (): Promise<Product[]> => {
    try {
      const result = await db.execute('SELECT * FROM products ORDER BY id DESC');
      return result.rows as unknown as any[];
    } catch (e) {
      const result = await db.execute('SELECT id, name, original_quantity, current_quantity, image_url FROM products ORDER BY id DESC');
      return result.rows as unknown as any[];
    }
  },

  addProduct: async (product: Partial<Product>) => {
    const timestamp = new Date().toISOString();
    const result = await db.execute({
      sql: 'INSERT INTO products (name, original_quantity, current_quantity, image_url, created_at) VALUES (?, ?, ?, ?, ?)',
      args: [
        product.name || '',
        product.original_quantity || 0,
        product.original_quantity || 0,
        product.image_url || '',
        timestamp
      ],
    });
    return { ...product, id: Number(result.lastInsertRowid), created_at: timestamp };
  },

  updateProduct: async (id: number, updates: Partial<Product>) => {
    const sets: string[] = [];
    const args: any[] = [];

    if (updates.name) { sets.push('name = ?'); args.push(updates.name); }
    if (updates.original_quantity !== undefined) { sets.push('original_quantity = ?'); args.push(updates.original_quantity); }
    if (updates.current_quantity !== undefined) { sets.push('current_quantity = ?'); args.push(updates.current_quantity); }
    if (updates.image_url !== undefined) { sets.push('image_url = ?'); args.push(updates.image_url); }

    if (sets.length === 0) return;

    args.push(id);
    await db.execute({
      sql: `UPDATE products SET ${sets.join(', ')} WHERE id = ?`,
      args,
    });
  },

  deleteProduct: async (id: number) => {
    await db.execute({
      sql: 'DELETE FROM products WHERE id = ?',
      args: [id],
    });
  },

  // Withdrawals
  withdraw: async (productId: number, quantity: number, note: string) => {
    const session = await StorageService.getSession();

    // 1. Get Product
    const pResult = await db.execute({
      sql: 'SELECT * FROM products WHERE id = ?',
      args: [productId],
    });

    if (pResult.rows.length === 0) throw new Error('المنتج غير موجود');
    const product = pResult.rows[0] as unknown as Product;

    if (product.current_quantity < quantity) throw new Error('الكمية غير متوفرة');

    // 2. Perform Transaction using batch
    try {
      await db.batch([
        {
          sql: 'UPDATE products SET current_quantity = current_quantity - ? WHERE id = ?',
          args: [quantity, productId]
        },
        {
          sql: 'INSERT INTO logs (product_name, quantity, note, employee_name, username) VALUES (?, ?, ?, ?, ?)',
          args: [product.name, quantity, note, session?.full_name || 'غير معروف', session?.username || '']
        }
      ], "write");
    } catch (error) {
      console.error('Transaction failed:', error);
      throw new Error('فشلت عملية السحب، الرجاء المحاولة مرة أخرى');
    }

    return true;
  },

  getLogs: async (username?: string): Promise<Log[]> => {
    let sql = 'SELECT * FROM logs ORDER BY created_at DESC';
    let args: any[] = [];

    if (username) {
      sql = 'SELECT * FROM logs WHERE username = ? ORDER BY created_at DESC';
      args = [username];
    }

    const result = await db.execute({ sql, args });
    return result.rows as unknown as any[];
  },

  updateLog: async (id: number, updates: Partial<Log>) => {
    const sets: string[] = [];
    const args: any[] = [];

    if (updates.note !== undefined) { sets.push('note = ?'); args.push(updates.note); }
    if (updates.quantity !== undefined) { sets.push('quantity = ?'); args.push(updates.quantity); }

    if (sets.length === 0) return;

    args.push(id);
    await db.execute({
      sql: `UPDATE logs SET ${sets.join(', ')} WHERE id = ?`,
      args,
    });
  },

  deleteLog: async (id: number) => {
    const logResult = await db.execute({
      sql: 'SELECT id, product_name, quantity FROM logs WHERE id = ?',
      args: [id],
    });

    if (logResult.rows.length === 0) {
      throw new Error('عملية السحب غير موجودة');
    }

    const log = logResult.rows[0] as unknown as { product_name: string; quantity: number };
    const quantity = Number(log.quantity || 0);

    // Keep inventory consistent: restore withdrawn quantity before deleting the log.
    await db.batch(
      [
        {
          sql: 'UPDATE products SET current_quantity = current_quantity + ? WHERE name = ?',
          args: [quantity, log.product_name],
        },
        {
          sql: 'DELETE FROM logs WHERE id = ?',
          args: [id],
        },
      ],
      'write'
    );
  },

  // Users
  getUsers: async (): Promise<User[]> => {
    try {
      const result = await db.execute('SELECT id, username, full_name, role, created_at FROM users ORDER BY id DESC');
      return result.rows as unknown as any[];
    } catch (error) {
      // Fallback if created_at doesn't exist yet
      const result = await db.execute('SELECT id, username, full_name, role FROM users ORDER BY id DESC');
      return result.rows as unknown as any[];
    }
  },

  addUser: async (user: Partial<User>) => {
    // Avoid RETURNING for maximum compatibility
    const timestamp = new Date().toISOString();
    const result = await db.execute({
      sql: 'INSERT INTO users (username, full_name, role, password, security_answer, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [
        user.username || '',
        user.full_name || '',
        user.role || 'employee',
        user.password || '123',
        user.security_answer || '',
        timestamp
      ],
    });
    
    return {
      id: Number(result.lastInsertRowid),
      username: user.username,
      full_name: user.full_name,
      role: user.role || 'employee',
      created_at: timestamp
    };
  },

  changePassword: async (userId: number, newPass: string) => {
    await db.execute({
      sql: 'UPDATE users SET password = ? WHERE id = ?',
      args: [newPass, userId],
    });
  },

  updateUser: async (id: number, updates: Partial<User>) => {
    const sets: string[] = [];
    const args: any[] = [];

    if (updates.full_name !== undefined) { sets.push('full_name = ?'); args.push(updates.full_name); }
    if (updates.username !== undefined) { sets.push('username = ?'); args.push(updates.username); }
    if (updates.role !== undefined) { sets.push('role = ?'); args.push(updates.role); }
    if (updates.security_answer !== undefined) { sets.push('security_answer = ?'); args.push(updates.security_answer); }
    if (updates.password !== undefined) { sets.push('password = ?'); args.push(updates.password); }

    if (sets.length === 0) return;

    args.push(id);
    await db.execute({
      sql: `UPDATE users SET ${sets.join(', ')} WHERE id = ?`,
      args,
    });

    // Update local session if editing self
    const session = await StorageService.getSession();
    if (session && session.id === id) {
      const updatedSession = { ...session, ...updates };
      // Security: never store password in session
      // @ts-ignore
      delete updatedSession.password;
      await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(updatedSession));
    }
  },

  deleteUser: async (id: number) => {
    await db.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [id],
    });
  },

  verifyRecovery: async (username: string, answer: string): Promise<User> => {
    const result = await db.execute({
      sql: 'SELECT id, username, full_name, role FROM users WHERE username = ? AND security_answer = ?',
      args: [username, answer],
    });

    if (result.rows.length > 0) {
      const user = result.rows[0] as unknown as User;
      await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(user));
      return user;
    }
    throw new Error('اسم المستخدم أو إجابة سؤال الأمان غير صحيحة');
  },

  // Stats
  getStats: async () => {
    try {
      const pResult = await db.execute('SELECT COUNT(*) as total, SUM(CASE WHEN current_quantity = 0 THEN 1 ELSE 0 END) as out_of_stock FROM products');
      const logsResult = await db.execute('SELECT product_name, SUM(quantity) as withdrawals FROM logs GROUP BY product_name ORDER BY withdrawals DESC LIMIT 5');

      const total = pResult.rows[0] ? Number(pResult.rows[0].total) : 0;
      const outOfStock = pResult.rows[0] ? Number(pResult.rows[0].out_of_stock) : 0;
      const health = total > 0 ? Math.round(((total - outOfStock) / total) * 100) : 100;

      return {
        total_products: total,
        out_of_stock: outOfStock,
        inventory_health: health,
        top_products: logsResult.rows.map(r => ({
          name: String(r.product_name || 'غير معروف'),
          withdrawals: Number(r.withdrawals || 0)
        }))
      };
    } catch (error) {
      console.error('Stats fetch error:', error);
      return { total_products: 0, out_of_stock: 0, inventory_health: 100, top_products: [] };
    }
  }
};
