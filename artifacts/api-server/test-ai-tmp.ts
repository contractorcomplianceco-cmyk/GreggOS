import { openai } from "@workspace/integrations-openai-ai-server";
async function run(model: string) {
  const t = Date.now();
  try {
    const c = await openai.chat.completions.create(
      { model, max_completion_tokens: 1024,
        messages: [{ role: "user", content: "Say hello in one sentence." }] },
      { timeout: 22000, maxRetries: 0 },
    );
    process.stdout.write(`${model} OK ${Date.now()-t}ms finish=${c.choices[0]?.finish_reason} content=${JSON.stringify(c.choices[0]?.message?.content)}\n`);
  } catch (e: any) {
    process.stdout.write(`${model} ERR ${Date.now()-t}ms status=${e?.status} msg=${e?.message}\n`);
  }
}
await run("gpt-5-mini");
