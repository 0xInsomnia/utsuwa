// Cloudflare deploy entry: API rate limit (src/lib/config/api-rate-limit.ts),
// subdomain routing (src/lib/config/host-routing.ts), then SvelteKit's worker.
// Build with WORKERS_CI=1 so the Cloudflare adapter runs.
import kit from './.svelte-kit/cloudflare/_worker.js';
import { apiRateLimited } from './src/lib/config/api-rate-limit.ts';
import { routeByHost } from './src/lib/config/host-routing.ts';

export default {
	async fetch(request, env, ctx) {
		const url = new URL(request.url);
		if (url.pathname === '/' && (request.method === 'GET' || request.method === 'HEAD')) {
			url.pathname = '/app';
			return Response.redirect(url.toString(), 302);
		}
		const limited = await apiRateLimited(request, env.API_RATE_LIMIT);
		if (limited) return limited;
		const rewrite = routeByHost(new URL(request.url));
		return kit.fetch(rewrite ? new Request(rewrite, request) : request, env, ctx);
	}
};
