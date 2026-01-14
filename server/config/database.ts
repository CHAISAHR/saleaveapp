
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

const baseConfig = process.env.DATABASE_URL || process.env.MYSQL_URL
  ? parseDatabaseUrl(process.env.DATABASE_URL || process.env.MYSQL_URL!)
  : {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'leave_management',
      port: parseInt(process.env.DB_PORT || '3306'),
    };

const dbConfig = {
  ...baseConfig,
  // Remove any row limits - allow unlimited results
  rowsAsArray: false,
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
    // Use query() instead of execute() for unlimited result sets
    // execute() uses prepared statements which can have implicit limits
    const [results] = await connection.query(query, params);
    return results;
  } catch (error) {
    console.error('Query execution failed:', error);
    // Try to reconnect if connection was lost or is in closed state
    if (error instanceof Error && (
      error.message.includes('Connection lost') || 
      error.message.includes('closed state') ||
      error.message.includes('PROTOCOL_CONNECTION_LOST')
    )) {
      console.log('Connection lost or closed, attempting to reconnect...');
      try {
        await connectDatabase();
        const [results] = await connection.query(query, params);
        return results;
      } catch (reconnectError) {
        console.error('Reconnection failed:', reconnectError);
        throw reconnectError;
      }
    }
    throw error;
  }
};
