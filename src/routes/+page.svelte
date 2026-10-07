<script lang="ts">
	let text = $state('I was charged twice and nobody is answering my emails.');
	let result = $state<any>(null);
	let error = $state('');
	let loading = $state(false);

	async function analyze() {
		loading = true;
		error = '';
		result = null;

		const res = await fetch('/api/analyze', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ text })
		});
		const data = await res.json();

		if (!res.ok) error = data.error;
		else result = data.answers;
		loading = false;
	}
</script>

<main>
	<h1>Jev Starter</h1>

	<textarea bind:value={text} rows="4"></textarea>
	<button onclick={analyze} disabled={loading}>
		{loading ? 'Analyzing…' : 'Analyze'}
	</button>

	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if result}
		<ul>
			<li>
				Billing related: {(result.is_billing.noul * 100).toFixed(0)}% likely
			</li>
			<li>
				Tone: <strong>{result.tone.choice}</strong>
				(confidence {(result.tone.confidence * 100).toFixed(0)}%)
			</li>
		</ul>
	{/if}
</main>

<style>
	main { max-width: 36rem; margin: 3rem auto; font-family: system-ui, sans-serif; }
	textarea { width: 100%; padding: 0.5rem; box-sizing: border-box; }
	button { margin-top: 0.5rem; padding: 0.5rem 1rem; }
	.error { color: #c00; }
</style>