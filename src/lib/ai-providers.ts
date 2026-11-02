/** The AI services the assistant and the admin writing tools can use. Safe to import anywhere: it holds no keys. */
export type ProviderKind = "gemini" | "openai" | "anthropic";

export type ProviderDef = {
  id: string;
  name: string;
  kind: ProviderKind;
  /** Where requests go. Anything that speaks the OpenAI chat format works. */
  baseUrl: string;
  /** Names of environment variables that switch this service on by themselves when set. */
  env: string[];
  /** Used when the Models box in Admin is empty. The first one is tried first. */
  models: string[];
  /** Where to get a key. */
  keyUrl: string;
  note: string;
};

// The order here is the default order of use. Free allowances and model names change often,
// so every list can be edited in Admin, AI services, and Test shows the names a key can really use.
export const PROVIDERS: ProviderDef[] = [
  { id: "gemini", name: "Google Gemini", kind: "gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", env: ["GEMINI_API_KEY", "GOOGLE_API_KEY"], models: ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-2.5-flash"], keyUrl: "https://aistudio.google.com/apikey", note: "Free key. Each model has its own small daily allowance, so several are listed." },
  { id: "openrouter", name: "OpenRouter", kind: "openai", baseUrl: "https://openrouter.ai/api/v1", env: ["OPENROUTER_API_KEY"], models: ["openrouter/free", "google/gemma-4-31b-it:free"], keyUrl: "https://openrouter.ai/keys", note: "One key, many models. Names ending in :free cost nothing. openrouter/free picks a free model for you." },
  { id: "groq", name: "Groq", kind: "openai", baseUrl: "https://api.groq.com/openai/v1", env: ["GROQ_API_KEY"], models: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"], keyUrl: "https://console.groq.com/keys", note: "Free plan with daily limits. Very fast." },
  { id: "cerebras", name: "Cerebras", kind: "openai", baseUrl: "https://api.cerebras.ai/v1", env: ["CEREBRAS_API_KEY"], models: ["gpt-oss-120b", "llama3.1-8b"], keyUrl: "https://cloud.cerebras.ai", note: "Free plan with daily limits." },
  { id: "mistral", name: "Mistral", kind: "openai", baseUrl: "https://api.mistral.ai/v1", env: ["MISTRAL_API_KEY"], models: ["mistral-small-latest", "open-mistral-nemo"], keyUrl: "https://console.mistral.ai/api-keys", note: "Free experiment plan with monthly limits." },
  { id: "sambanova", name: "SambaNova", kind: "openai", baseUrl: "https://api.sambanova.ai/v1", env: ["SAMBANOVA_API_KEY"], models: ["Meta-Llama-3.3-70B-Instruct"], keyUrl: "https://cloud.sambanova.ai/apis", note: "Free plan with limits." },
  { id: "nvidia", name: "NVIDIA", kind: "openai", baseUrl: "https://integrate.api.nvidia.com/v1", env: ["NVIDIA_API_KEY"], models: ["meta/llama-3.3-70b-instruct"], keyUrl: "https://build.nvidia.com", note: "Free starter credits." },
  { id: "qwen", name: "Qwen (Alibaba)", kind: "openai", baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1", env: ["QWEN_API_KEY", "DASHSCOPE_API_KEY"], models: ["qwen-flash", "qwen-plus"], keyUrl: "https://bailian.console.alibabacloud.com", note: "New accounts get a free allowance." },
  { id: "kimi", name: "Kimi (Moonshot)", kind: "openai", baseUrl: "https://api.moonshot.ai/v1", env: ["KIMI_API_KEY", "MOONSHOT_API_KEY"], models: ["kimi-k2-turbo-preview", "kimi-k2-0905-preview"], keyUrl: "https://platform.moonshot.ai", note: "Pay as you go. Sometimes comes with free credit." },
  { id: "deepseek", name: "DeepSeek", kind: "openai", baseUrl: "https://api.deepseek.com/v1", env: ["DEEPSEEK_API_KEY"], models: ["deepseek-chat"], keyUrl: "https://platform.deepseek.com/api_keys", note: "Pay as you go, very low price." },
  { id: "anthropic", name: "Claude (Anthropic)", kind: "anthropic", baseUrl: "https://api.anthropic.com/v1", env: ["ANTHROPIC_API_KEY"], models: ["claude-haiku-5-5", "claude-sonnet-5-5"], keyUrl: "https://console.anthropic.com/settings/keys", note: "Paid. Best last in the list, as the final fallback." },
];

export const providerDef = (id: string) => PROVIDERS.find((p) => p.id === id);

/** What the Admin page is told about one service. It never carries a key, only the last four characters. */
export type ProviderView = {
  id: string;
  name: string;
  custom: boolean;
  baseUrl: string;
  keyUrl: string;
  note: string;
  enabled: boolean;
  order: number;
  models: string[];
  defaultModels: string[];
  source: "backend" | "env" | "none";
  tail: string;
  envNames: string[];
};
