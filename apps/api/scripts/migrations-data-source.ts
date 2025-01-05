import { DataSource } from "typeorm";

const AppDataSource = new DataSource({
	type: "postgres",
	host: "localhost",
	port: 5432,
	username: "admin",
	password: "admin",
	database: "test_db",
	entities: ["dist/**/*.entity.js"],
	migrations: ["dist/migrations/*.js"],
	migrationsTableName: "migrations",
});

export default AppDataSource;
