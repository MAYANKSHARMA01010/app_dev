// ─── Utilities ────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Rough token estimate: ~3.5 chars per token (conservative English average) */
function estimateTokens(text = '') {
  return Math.ceil((text || '').length / 3.5);
}

/** Max context window (tokens) per provider. Model-specific overrides below. */
const PROVIDER_CONTEXT_LIMITS = {
  openai:    120_000,
  anthropic: 190_000,
  gemini:    900_000,
  groq:      131_072,
  mistral:    32_000,
  together:   32_000,
  ollama:      8_192,
  mock:    9_999_999,
};

const MODEL_CONTEXT_LIMITS = {
  'qwen2.5:latest':                              32_768,
  'qwen2.5':                                     32_768,
  'gpt-3.5-turbo':                               16_000,
  'mixtral-8x7b-32768':                          32_768,
  'gemma2-9b-it':                                 8_192,
  'open-mistral-7b':                             32_000,
  'open-mixtral-8x7b':                           32_000,
  'open-mixtral-8x22b':                         65_536,
  'mistral-small-latest':                        32_000,
  'mistralai/Mixtral-8x7B-Instruct-v0.1':       32_000,
  'google/gemma-2-9b-it':                         8_192,
  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo':128_000,
  'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo':128_000,
};

function getContextLimit(provider, model) {
  return MODEL_CONTEXT_LIMITS[model] ?? PROVIDER_CONTEXT_LIMITS[provider] ?? 32_000;
}

/**
 * Trim message history so it fits within the token budget.
 * Strategy: always keep the most recent messages; drop old ones first.
 * If a single message is too large, truncate its content from the start.
 */
function truncateContext(messages, systemPrompt, maxTokens) {
  const sysTokens   = estimateTokens(systemPrompt);
  const respReserve = 2_000; // headroom for the model's response
  const budget      = maxTokens - sysTokens - respReserve;

  if (budget <= 500) {
    const kept = messages.slice(-2);
    return {
      messages: kept,
      trimmed: kept.length < messages.length,
      keptCount: kept.length,
      totalCount: messages.length,
      sysTokens,
      budget,
    };
  }

  const kept = [];
  let used = 0;

  // Walk backwards — most recent messages are highest priority
  for (let i = messages.length - 1; i >= 0; i--) {
    const tokens = estimateTokens(messages[i].content);

    if (used + tokens > budget) {
      if (kept.length === 0) {
        const maxChars = Math.max(200, Math.floor((budget - used) * 3.5));
        const content  = messages[i].content;
        kept.unshift({
          ...messages[i],
          content: content.length > maxChars
            ? '[…earlier text omitted…]\n' + content.slice(-maxChars)
            : content,
        });
      }
      break;
    }

    used += tokens;
    kept.unshift(messages[i]);
  }

  const final = kept.length > 0 ? kept : messages.slice(-1);
  return {
    messages:   final,
    trimmed:    final.length < messages.length,
    keptCount:  final.length,
    totalCount: messages.length,
    sysTokens,
    usedTokens: used,
    budget,
  };
}

// ─── SSE Parser ───────────────────────────────────────────────────────────
async function readSSEStream(response, onLine) {
  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) onLine(line.trim());
  }
  if (buffer.trim()) onLine(buffer.trim());
}

// ─── OpenAI-Compatible Streaming ──────────────────────────────────────────
async function streamOpenAICompatible({
  baseUrl, model, apiKey, extraHeaders = {},
  messages, systemPrompt, onChunk, onComplete, onFirstToken,
}) {
  if (!apiKey) throw new Error('API key missing — add it in ⚙ Settings.');

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt || 'You are a helpful assistant.' },
        ...messages,
      ],
      stream: true,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => response.statusText);
    throw new Error(`HTTP ${response.status}: ${errText.slice(0, 300)}`);
  }

  let receivedFirst = false;

  await readSSEStream(response, (line) => {
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6).trim();
    if (data === '[DONE]') return;
    try {
      const parsed = JSON.parse(data);
      const text = parsed.choices?.[0]?.delta?.content;
      if (text) {
        if (!receivedFirst) {
          receivedFirst = true;
          onFirstToken?.();
        }
        onChunk(text);
      }
    } catch {}
  });

  onComplete();
}

// ─── Provider Implementations ──────────────────────────────────────────────

async function streamOpenAI({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  await streamOpenAICompatible({
    baseUrl: 'https://api.openai.com/v1',
    model: model || 'gpt-4o',
    apiKey,
    messages,
    systemPrompt,
    onChunk,
    onComplete,
    onFirstToken,
  });
}

async function streamGroq({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  await streamOpenAICompatible({
    baseUrl: 'https://api.groq.com/openai/v1',
    model: model || 'llama-3.1-8b-instant',
    apiKey,
    messages,
    systemPrompt,
    onChunk,
    onComplete,
    onFirstToken,
  });
}

async function streamMistral({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  await streamOpenAICompatible({
    baseUrl: 'https://api.mistral.ai/v1',
    model: model || 'mistral-small-latest',
    apiKey,
    messages,
    systemPrompt,
    onChunk,
    onComplete,
    onFirstToken,
  });
}

async function streamTogether({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  await streamOpenAICompatible({
    baseUrl: 'https://api.together.xyz/v1',
    model: model || 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    apiKey,
    messages,
    systemPrompt,
    onChunk,
    onComplete,
    onFirstToken,
  });
}

async function streamAnthropic({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  if (!apiKey) throw new Error('Anthropic API key missing — add it in ⚙ Settings.');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model || 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      system: systemPrompt || 'You are a helpful assistant.',
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`HTTP ${response.status}: ${err.slice(0, 300)}`);
  }

  let receivedFirst = false;

  await readSSEStream(response, (line) => {
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6).trim();
    try {
      const parsed = JSON.parse(data);
      if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
        if (!receivedFirst) {
          receivedFirst = true;
          onFirstToken?.();
        }
        onChunk(parsed.delta.text);
      }
    } catch {}
  });

  onComplete();
}

async function streamGemini({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  if (!apiKey) throw new Error('Gemini API key missing — add it in ⚙ Settings.');

  const geminiMessages = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body = { contents: geminiMessages, generationConfig: { maxOutputTokens: 4096 } };
  if (systemPrompt) body.systemInstruction = { parts: [{ text: systemPrompt }] };

  const modelName = model || 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:streamGenerateContent?alt=sse&key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text().catch(() => response.statusText);
    throw new Error(`HTTP ${response.status}: ${err.slice(0, 300)}`);
  }

  let receivedFirst = false;

  await readSSEStream(response, (line) => {
    if (!line.startsWith('data: ')) return;
    const data = line.slice(6).trim();
    try {
      const text = JSON.parse(data).candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        if (!receivedFirst) {
          receivedFirst = true;
          onFirstToken?.();
        }
        onChunk(text);
      }
    } catch {}
  });

  onComplete();
}

async function streamOllama({ model, ollamaUrl, messages, systemPrompt, onChunk, onComplete, onFirstToken }) {
  const baseUrl = (ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model || 'llama3.2',
      messages: [{ role: 'system', content: systemPrompt || '' }, ...messages],
      stream: true,
    }),
  });

  if (!response.ok) throw new Error(`Ollama HTTP ${response.status}`);

  const reader  = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let receivedFirst = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.message?.content) {
          if (!receivedFirst) {
            receivedFirst = true;
            onFirstToken?.();
          }
          onChunk(parsed.message.content);
        }
        if (parsed.done) { onComplete(); return; }
      } catch {}
    }
  }
  onComplete();
}

// ─── Mock / Demo Mode ──────────────────────────────────────────────────────
const MOCK_PERSONAS = {
  'john-cena': [
    "YO YO YO! The Champ Is HERE! 💪 Listen up — I've been in the ring with the toughest competitors on the planet, and I'll tell you what: NEVER GIVE UP. That's not just a catchphrase, that's a lifestyle! You came to the right place, champ. Hustle. Loyalty. Respect. That's what I'm bringing to this conversation! Whatcha gonna do?! 🎉",
    "And HIS NAME IS JOHN CENA! 🎵 You know what separates champions from everyone else? It's not talent — it's HEART. It's showing up every single day. Whether it's in the ring, on the movie set, or in this chat — The Champ delivers! Now tell me what's on your mind, and let's NEVER GIVE UP together! 💪",
    "HUSTLE! LOYALTY! RESPECT! Those three words have guided my entire career. From being homeless and working at Gold's Gym, to 16-time WWE Champion and Hollywood — it was all about heart and hustle! You Can't See Me? Oh, but I can SEE YOU — and I see someone ready to WIN! Let's go! 🏆",
  ],
  'salman-khan': [
    "Arey bhai! 😎 Salman Khan here! Kya haal hai tumhara? Look, main ek simple insaan hoon — I like my gym, my family, my fans, aur Being Human! Dabangg ke Chulbul Pandey ki tarah kehta hoon: seedha raho, seedha bolo! Jo problem hai batao, bhai solve karega! 🎬",
    "Bhai ka style hi alag hai yaar! 💪 You know what I always say — ek baar jo maine commitment kar di, toh phir main apne aap ki bhi nahi sunta! In life, in films, in everything — commitment matters. Tiger Zinda Hai! Aur Bhai bhi! Batao kya baat hai? 🐯",
    "Arrey yaar! Being Human — that's not just my brand, that's my life philosophy! Main chahta hoon ki duniya mein kindness ho, love ho! Movies se zyada important hai ki tum achhe insaan bano. Bhai sun raha hai — kya chahiye tumhe? 🤝",
  ],
  'einstein': [
    "Ah, a most intriguing moment! You know, I spent years simply imagining what it would be like to ride alongside a beam of light — and that single thought experiment led to the theory of special relativity. The universe, my friend, rewards those who dare to ask 'what if?' What profound question may I help you explore today? 🔭",
    "Imagination is more important than knowledge — for knowledge is limited, while imagination embraces the entire world. Science is not just equations; it is poetry of the cosmos. What shall we unravel together? ✨",
    "Two things are infinite: the universe and human stupidity — and I am not yet certain about the universe! *adjusts messy hair* But in all seriousness, the most beautiful experience we can have is the mysterious. Tell me — what mystery troubles your magnificent mind? 🌌",
  ],
  'sherlock': [
    "Ah, I deduce you have something on your mind. Fascinating. The game is afoot! You know, when you have eliminated the impossible, whatever remains, however improbable, must be the truth. I am prepared to apply the full force of my methods to your inquiry. Watson would be taking notes right now. 🔍",
    "Elementary observations lead to extraordinary conclusions — that is the foundation of my method. I observe, I deduce, I conclude. Your situation begins to yield its secrets already. A capital mistake to theorize before one has data — so give me data! 🧐",
    "221B Baker Street has seen many mysteries, but none so interesting as the one before me now. Come now, speak clearly and omit nothing. The science of deduction awaits. 🎻",
  ],
  'tony-stark': [
    "Yeah hi, genius billionaire playboy philanthropist checking in. I built an arc reactor in a cave with a box of scraps, so whatever you're bringing to me today? Already a step ahead. What do you need? 🦾",
    "You know what? Part of the journey is the end. But we're not there yet — so let's make the most of this conversation! I graduated MIT at 17, designed 85+ Iron Man suits, and saved the world a few times. I think I can handle a question. Lay it on me. 🚀",
    "JARVIS used to say 'I'm afraid I don't have that information' — but I upgraded. I've hacked Pentagon systems, built a time machine, and reversed the Infinity Snap. Your problem? *taps arc reactor* Child's play. Talk to me. ⚡",
  ],
  'elon': [
    "First principles. Always first principles. Physics doesn't care about convention — only about what's possible within its laws. I put a Tesla Roadster into orbit as a Falcon Heavy test payload because why not? What are we solving today? 🚀",
    "The thing that's most surprising to people is that I think from a physics standpoint. Boil it down to fundamental truths. The question isn't 'what has been done?' — it's 'what does physics allow?' What problem are you trying to solve? ⚡",
    "People underestimate how hard it is to make things work at scale. SpaceX failed rockets. Tesla had near-bankruptcy. But failure is data. It narrows the solution space. Apply first-principles thinking to your problem! 🧠",
  ],
  'gordon': [
    "Right! *slams hand on counter* Gordon Ramsay here — whatever you're bringing to me today, you better be ready for REAL, HONEST feedback! I've run 16 Michelin-starred restaurants and I've seen more disasters than I care to remember. What do you need? 👨‍🍳",
    "Bloody hell! Look, I'll be straight with you — that's the ONLY way anyone improves! I trained under Marco Pierre White and Joël Robuchon. LEGENDS. When something is raw, I say it's raw. When it's stunning — 'Beautiful. Absolutely stunning.' Come on then! 🔥",
    "You know what separates good chefs from great ones? Passion and precision. BOTH. It's like a risotto — takes patience, constant attention, and LOVE. Now, what's on your mind? Let's tackle it together! ⭐",
  ],
  default: [
    "Hello! I'm your AI assistant, ready to help with anything you need. What can I do for you today?",
    "Great question! Let me think through this carefully and give you a helpful, thoughtful response.",
  ],
};

async function streamMock({ personaId, onChunk, onComplete, onFirstToken }) {
  const pool = MOCK_PERSONAS[personaId] ?? MOCK_PERSONAS.default;
  const text = pool[Math.floor(Math.random() * pool.length)];
  let first = false;
  for (const word of text.split(' ')) {
    await sleep(35 + Math.random() * 55);
    if (!first) {
      first = true;
      onFirstToken?.();
    }
    onChunk(word + ' ');
  }
  onComplete();
}

// ─── Default model per provider ────────────────────────────────────────────
const DEFAULT_MODELS = {
  ollama:    'qwen2.5:latest',
  groq:      'llama-3.1-8b-instant',
  gemini:    'gemini-1.5-flash',
  mistral:   'mistral-small-latest',
  together:  'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
  openai:    'gpt-4o',
  anthropic: 'claude-3-5-sonnet-20241022',
  mock:      'demo',
};

// ─── Single-Provider Stream ────────────────────────────────────────────────
async function streamSingleProvider({
  provider, model, apiKeys, ollamaUrl, messages, systemPrompt, personaId,
  onChunk, onComplete, onFirstToken,
}) {
  const apiKey = apiKeys?.[provider] || '';

  switch (provider) {
    case 'ollama':    return streamOllama    ({ model, ollamaUrl, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'groq':      return streamGroq      ({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'gemini':    return streamGemini    ({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'mistral':   return streamMistral   ({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'together':  return streamTogether  ({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'openai':    return streamOpenAI    ({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'anthropic': return streamAnthropic ({ model, apiKey, messages, systemPrompt, onChunk, onComplete, onFirstToken });
    case 'mock':
    default:          return streamMock      ({ personaId, onChunk, onComplete, onFirstToken });
  }
}

/** Auto-build a fallback list based on which keys are present */
function buildAutoFallbacks(primaryProvider, apiKeys) {
  const freeFirst = ['ollama', 'groq', 'gemini', 'mistral', 'together'];
  const paid      = ['openai', 'anthropic'];
  const ordered   = [...freeFirst, ...paid];

  return ordered
    .filter((p) => p !== primaryProvider && (p === 'ollama' || apiKeys?.[p]))
    .concat(['mock']);
}

// ─── Main Export — Stream with Fallback, Context Trimming & Rich Logs ───────
export async function streamLLMMessage({
  provider,
  model,
  apiKeys = {},
  messages = [],
  systemPrompt = '',
  personaId = 'default',
  ollamaUrl,
  fallbackEnabled = true,
  fallbackOrder   = [],
  onChunk,
  onComplete,
  onError,
  onFallback,
  onContextTrimmed,
  onLog,
}) {
  const emit = (level, message, meta = {}) => {
    onLog?.({
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      level, // 'info' | 'context' | 'stream' | 'warn' | 'fallback' | 'error' | 'success'
      message,
      meta,
    });
  };

  const startTime = Date.now();

  // 1. Initial request log
  const inputCharCount = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0) + (systemPrompt?.length || 0);
  const estTotalTokens = Math.ceil(inputCharCount / 3.5);

  emit('info', `Initiating chat request: ${messages.length} message(s) (~${estTotalTokens.toLocaleString()} tokens)`, {
    provider,
    model,
    messagesCount: messages.length,
    estTokens: estTotalTokens,
  });

  // 2. Build provider chain
  const chain = [{ provider, model }];

  if (fallbackEnabled) {
    const fallbacks = fallbackOrder.length > 0
      ? fallbackOrder
      : buildAutoFallbacks(provider, apiKeys);

    for (const fb of fallbacks) {
      if (fb !== provider) {
        chain.push({ provider: fb, model: DEFAULT_MODELS[fb] });
      }
    }
    if (!chain.some((c) => c.provider === 'mock')) {
      chain.push({ provider: 'mock', model: 'demo' });
    }

    emit('info', `Multi-model fallback chain active: [${chain.map((c) => c.provider).join(' → ')}]`, {
      chain: chain.map((c) => `${c.provider}:${c.model}`),
    });
  } else {
    emit('info', `Fallback disabled. Sole provider: ${provider} (${model})`, { provider, model });
  }

  let lastError = null;

  for (let i = 0; i < chain.length; i++) {
    const { provider: curProvider, model: curModel } = chain[i];
    const isFallbackAttempt = i > 0;

    if (isFallbackAttempt) {
      const reason = lastError?.message || 'Previous provider failed';
      emit('fallback', `Switching to fallback #${i}: ${curProvider} (${curModel}) — Reason: ${reason}`, {
        fallbackAttempt: i,
        provider: curProvider,
        model: curModel,
        previousError: reason,
      });

      onFallback?.(curProvider, i, reason);
      await sleep(700); // Courtesy delay between providers
    }

    try {
      // 3. Smart context evaluation & trimming
      const maxTokens = getContextLimit(curProvider, curModel);
      emit('context', `Checking context budget for ${curProvider} (${curModel}): limit ${maxTokens.toLocaleString()} tokens`, {
        provider: curProvider,
        model: curModel,
        maxTokens,
      });

      const { messages: trimmed, trimmed: wasTrimmed, keptCount, totalCount, usedTokens } =
        truncateContext(messages, systemPrompt, maxTokens);

      if (wasTrimmed) {
        emit('context', `✂️ Context trimmed for ${curProvider}: kept ${keptCount}/${totalCount} messages (~${(usedTokens || 0).toLocaleString()} tokens) to avoid context limit overflow`, {
          provider: curProvider,
          keptCount,
          totalCount,
          trimmedCount: totalCount - keptCount,
        });
        onContextTrimmed?.({ keptCount, totalCount, provider: curProvider });
      } else {
        emit('context', `✓ Context OK: ${totalCount} messages fit safely within ${maxTokens.toLocaleString()} token window`, {
          provider: curProvider,
          totalCount,
        });
      }

      // 4. Connecting and streaming
      emit('stream', `Connecting to ${curProvider} (${curModel})...`, {
        provider: curProvider,
        model: curModel,
        attempt: i + 1,
      });

      const streamStart = Date.now();
      let firstTokenTime = null;
      let chunkCount = 0;
      let totalChars = 0;

      await streamSingleProvider({
        provider: curProvider,
        model: curModel,
        apiKeys,
        ollamaUrl,
        messages: trimmed,
        systemPrompt,
        personaId,
        onFirstToken: () => {
          firstTokenTime = Date.now() - streamStart;
          emit('stream', `First token received from ${curProvider} in ${firstTokenTime}ms (TTFT)`, {
            provider: curProvider,
            ttftMs: firstTokenTime,
          });
        },
        onChunk: (chunk) => {
          chunkCount++;
          totalChars += chunk.length;
          onChunk(chunk);
        },
        onComplete: () => {
          const streamDurationMs = Date.now() - streamStart;
          const estOutputTokens = Math.ceil(totalChars / 3.5);
          const tps = streamDurationMs > 0 ? ((estOutputTokens / streamDurationMs) * 1000).toFixed(1) : 'N/A';

          emit('success', `✓ Stream complete from ${curProvider}: ~${estOutputTokens} tokens generated in ${(streamDurationMs / 1000).toFixed(2)}s (${tps} tokens/s)`, {
            provider: curProvider,
            model: curModel,
            durationMs: streamDurationMs,
            totalChars,
            estOutputTokens,
            tokensPerSec: tps,
            totalElapsedMs: Date.now() - startTime,
          });

          onComplete();
        },
      });

      return; // ✅ Success!

    } catch (err) {
      lastError = err;
      emit('warn', `⚠️ ${curProvider} (${curModel}) failed on attempt ${i + 1}/${chain.length}: ${err.message}`, {
        provider: curProvider,
        model: curModel,
        error: err.message,
      });

      // Rate-limit detection
      const isRateLimit =
        err.message.includes('429') ||
        /rate.?limit|too many requests/i.test(err.message);

      if (isRateLimit && i < chain.length - 1) {
        const backoff = Math.min(1_000 * 2 ** i, 8_000);
        emit('warn', `Rate limit (429) detected on ${curProvider}. Waiting ${backoff}ms backoff before next fallback...`, {
          backoffMs: backoff,
          provider: curProvider,
        });
        await sleep(backoff);
      }
    }
  }

  // All providers failed
  const finalErrorMsg = lastError?.message || 'All AI providers failed. Check your API keys in ⚙ Settings.';
  emit('error', `❌ Fatal: All ${chain.length} AI providers exhausted. ${finalErrorMsg}`, {
    error: finalErrorMsg,
    totalElapsedMs: Date.now() - startTime,
  });

  onError?.(new Error(finalErrorMsg));
}
