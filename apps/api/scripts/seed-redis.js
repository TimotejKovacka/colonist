import { Redis } from "ioredis";

const INITIAL_MAP = {
	name: "classic-4p",
	hexDimensions: { width: 224, height: 256 },
	hexTypes: {
		wood: 4,
		brick: 3,
		wheat: 4,
		sheep: 4,
		stone: 3,
		desert: 1,
	},
};

async function seed() {
	const redis = new Redis({
		host: process.env.REDIS_HOST || "localhost",
		port: Number.parseInt(process.env.REDIS_PORT || "6379"),
	});

	try {
		console.log("Starting Redis seed...");

		// Clear existing data (optional)
		// await redis.flushall();

		// Set initial map data
		await redis.set(
			"state:map:593e22e3-8029-434b-9453-f04d6bc4b809",
			JSON.stringify(INITIAL_MAP),
		);

		console.log("Seed completed successfully");
	} catch (error) {
		console.error("Error seeding Redis:", error);
		process.exit(1);
	} finally {
		await redis.quit();
	}
}

// Run the seed function
seed();
