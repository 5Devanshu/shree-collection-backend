import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Railway uses self-signed certs
    },
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected');
    // Sync all models — use { alter: true } in dev, migrations in prod
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Tables synced');
  } catch (error) {
    console.error('DB Connection Error:', error.message);
    process.exit(1);
  }
};

export default sequelize;