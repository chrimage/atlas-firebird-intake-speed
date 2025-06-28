import { defineConfig } from 'vitest/config';
import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config';

// Use regular vitest for simple unit tests, workers config for integration tests
export default defineConfig({
	test: {
		include: ['test/**/*.spec.ts'],
		environment: 'node',
		// Only use workers pool for tests that specifically need it
		poolMatchGlobs: [
			['test/**/*.worker.spec.ts', '@cloudflare/vitest-pool-workers'],
		],
		poolOptions: {
			workers: {
				wrangler: { configPath: './wrangler.jsonc' },
			},
		},
	},
});
