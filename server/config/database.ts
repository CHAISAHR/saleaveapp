
import mysql from 'mysql2/promise';

export interface DatabaseConfig {
  host: string;
  user: string;
  password: string;
  database: string;
  port: number;
}

// Parse DATABASE_URL or MYSQL_URL if provided by Railway
const parseDatabaseUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    user: parsed.username,
    password: parsed.password,
    database: parsed.pathname.replace('/', ''),
    port: parseInt(parsed.port) || 3306,
  };
};

const dbConfig: DatabaseConfig = process.env.DATABASE_URL || process.env.MYSQL_URL
  ? parseDatabaseUrl(process.env.DATABASE_URL || process.env.MYSQL_URL!)
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'leave_management',
      port: parseInt(process.env.DB_PORT || '3306'),
    };

let connection: mysql.Connection;

export const connectDatabase = async (): Promise<mysql.Connection> => {
  try {
    console.log('Attempting to connect to database...');
    console.log('Database config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL database successfully');
    return connection;
  } catch (error) {
    console.error('Database connection failed:', error);
    console.error('Database config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    throw error;
  }
};

export const getConnection = (): mysql.Connection => {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return connection;
};

export const executeQuery = async (query: string, params?: any[]): Promise<any> => {
  try {
    if (!connection) {
      console.log('No connection found, attempting to reconnect...');
      await connectDatabase();
    }
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Query execution failed:', error);
    // Try to reconnect once if connection was lost
    if (error instanceof Error && error.message.includes('Connection lost')) {
      console.log('Connection lost, attempting to reconnect...');
      await connectDatabase();
      const [results] = await connection.execute(query, params);
      return results;
    }
    throw error;
  }
};
