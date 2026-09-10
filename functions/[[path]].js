import worker from "../worker.js";

export async function onRequest(context) {
  if (new URL(context.request.url).pathname.startsWith('/assets/')) return context.next();
  const { request, env, waitUntil } = context;
  return await worker.fetch(request, env, { waitUntil: waitUntil.bind(context) });
}
