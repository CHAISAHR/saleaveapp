
import pkg from 'pg';
const { Pool } = pkg;

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
  ssl?: boolean;
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'leave_management',
  port: parseInt(process.env.DB_PORT || '5432'),
  ssl: process.env.NODE_ENV === 'production' ? true : false,
};

let pool: pkg.Pool;

export const connectDatabase = async (): Promise<pkg.Pool> => {
  try {
    pool = new Pool({
      ...dbConfig,
      ssl: dbConfig.ssl ? { rejectUnauthorized: false } : false,
    });
    
    // Test the connection
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
    
    return pool;
  } catch (error) {
    console.error('Database connection failed:', error);
    throw error;
  }
};

export const getConnection = (): pkg.Pool => {
  if (!pool) {
    throw new Error('Database not connected');
  }
  return pool;
};

export const executeQuery = async (query: string, params?: any[]): Promise<any> => {
  try {
    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  }
};
