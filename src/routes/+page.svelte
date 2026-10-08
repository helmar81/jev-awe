<script lang="ts">
  const MAX_LENGTH = 2000;

  let text = $state('Our API integration started returning 500 errors on every request about 20 minutes ago, and we can\'t process any customer orders until this is fixed.');
  let result = $state<any>(null);
  let error = $state('');
  let loading = $state(false);
  let textareaEl: HTMLTextAreaElement | undefined = $state();

  function clearText() {
    text = '';
    result = null;
    error = '';
    textareaEl?.focus();
  }

  async function handleAnalyze(e?: Event) {
    if (e) e.preventDefault();

    loading = true;
    error = '';
    result = null;

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });

      // Read as text first, so a non-JSON error page doesn't crash the parser
      const raw = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(raw);
      } catch {
        // leave data as null
      }

      if (!res.ok) {
        error = data?.error || `Request failed (${res.status}). Please try again.`;
      } else if (!data) {
        error = 'The server returned an unexpected response.';
      } else {
        // Fallback to data directly if data.answers is undefined
        result = data.answers || data;
      }
    } catch (err: any) {
      error = err.message || 'Network error or unable to reach the endpoint.';
    } finally {
      loading = false;
    }
  }
</script>

<main>
  <h1>Jev Starter</h1>

  <form onsubmit={handleAnalyze}>
    <div class="field">
      <textarea bind:this={textareaEl} bind:value={text} rows="5" maxlength={MAX_LENGTH}></textarea>
      {#if text}
        <button
          type="button"
          class="clear-btn"
          onclick={clearText}
          aria-label="Clear text"
          title="Clear"
        >×</button>
      {/if}
    </div>
    <div class="counter" class:near-limit={text.length > MAX_LENGTH * 0.9}>
      {text.length} / {MAX_LENGTH}
    </div>
    <button type="submit" disabled={loading || !text.trim()}>
      {loading ? 'Analyzing…' : 'Analyze'}
    </button>
  </form>

  {#if error}
    <p class="error">{error}</p>
  {/if}

  {#if result}
    <div class="response-card">
      <h3>Response</h3>

      <!-- Jev Answers Format -->
      {#if result.department || result.is_urgent || result.frustration}
        {#if result.department}
          <div class="question-block">
            <span class="q-title">department</span>
            <span class="q-sub">Which team should handle this</span>
            <div class="choices">
              {#if result.department.options}
                {#each result.department.options as opt}
                  <div class="choice-row">
                    <span class="opt-name">{opt.name}</span>
                    <span class="opt-prob">{(opt.probability * 100).toFixed(0)}%</span>
                  </div>
                {/each}
              {:else}
                <div class="choice-row">
                  <span class="opt-name">{result.department.choice}</span>
                  <span class="opt-prob">{(result.department.confidence * 100).toFixed(0)}%</span>
                </div>
              {/if}
              <div class="meta">Confidence: {(result.department.confidence * 100).toFixed(0)}%</div>
            </div>
          </div>
        {/if}

        {#if result.is_urgent}
          <div class="question-block">
            <span class="q-title">is_urgent</span>
            <span class="q-sub">The message conveys urgency or time-sensitivity</span>
            <div><strong>{(result.is_urgent.noul * 100).toFixed(0)}% true</strong></div>
          </div>
        {/if}

        {#if result.frustration}
          <div class="question-block">
            <span class="q-title">frustration</span>
            <span class="q-sub">How frustrated the customer appears</span>
            <div>
              <strong>{Number(result.frustration.score).toFixed(2)} of {result.frustration.max_score ?? 2}</strong>
              {#if result.frustration.confidence}
                <div class="meta">Confidence: {(result.frustration.confidence * 100).toFixed(0)}%</div>
              {/if}
            </div>
          </div>
        {/if}
      <!-- Simple Response Fallback -->
      {:else}
        <p class="msg">{result.message || JSON.stringify(result)}</p>
      {/if}
    </div>
  {/if}
</main>

<style>
  main { max-width: 38rem; margin: 3rem auto; font-family: system-ui, sans-serif; }
  .field { position: relative; }
  textarea { width: 100%; padding: 0.75rem; box-sizing: border-box; }
  .field textarea { padding-right: 2.5rem; }
  .clear-btn {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    margin-top: 0;
    padding: 0;
    width: 1.6rem;
    height: 1.6rem;
    border: none;
    border-radius: 50%;
    background: #e4e4e7;
    color: #555;
    font-size: 1.1rem;
    line-height: 1;
  }
  .clear-btn:hover { background: #d4d4d8; color: #000; }
  .counter { font-size: 0.8rem; color: #888; text-align: right; margin-top: 0.25rem; }
  .counter.near-limit { color: #c00; }
  button { margin-top: 0.75rem; padding: 0.5rem 1.25rem; cursor: pointer; }
  button:disabled { cursor: not-allowed; opacity: 0.6; }
  .error { color: #c00; }
  .response-card { margin-top: 2rem; border: 1px solid #e4e4e7; padding: 1.25rem; border-radius: 6px; background: #fafafa; }
  .question-block { margin-bottom: 1.25rem; }
  .q-title { font-weight: 600; font-family: monospace; display: block; }
  .q-sub { font-size: 0.85rem; color: #666; display: block; margin-bottom: 0.4rem; }
  .choice-row { display: flex; justify-content: space-between; font-size: 0.9rem; }
  .opt-name { font-family: monospace; }
  .meta { font-size: 0.8rem; color: #888; margin-top: 0.25rem; }
  .msg { color: #2e7d32; background: #e8f5e9; padding: 0.75rem; border-radius: 4px; }
</style>