// Update with your config settings.
require("dotenv").config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  client: "pg",
  connection: {
    user: process.env.DB_USER, // DB user
    password: process.env.DB_PASS, // DB password
    database: process.env.DB_NAME, // Database name
    host:
      process.env.NODE_ENV == "production"
        ? `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`
        : "127.0.0.1", // For UNIX socket connection
    port: 5432, // Default PostgreSQL port
    ssl: false,
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: "./migrations",
  },
};
