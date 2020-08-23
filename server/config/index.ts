export const config = {
  database: {
    database: process.env.DATABASE_DB || 'masivian',
    host: process.env.HOST_DB || 'pachoserver.ceatpj7d9qze.us-east-1.rds.amazonaws.com',
    password: process.env.PASSWORD_DB || 'N7"zH`j6z.?w9U\\@',
    user: process.env.USER_DB || 'masivian'
  },
  token: {
    seed: process.env.TOKEN_SEED || 'seed-de-desarrollo',
    expire: process.env.TOKEN_EXPIRE || '24h',
  }
};
