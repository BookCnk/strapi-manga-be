export default ({ env }) => ({
  connection: {
    client: "postgres",
    connection: {
      connectionString: env("DATABASE_URL"),
      ssl: {
        rejectUnauthorized: false,
      },
    },
  },
});
