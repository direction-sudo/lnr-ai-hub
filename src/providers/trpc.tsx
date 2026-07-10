import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import superjson from "superjson";
import { useState, type ReactNode } from "react";
import type { AppRouter } from "../../api/router";
import {
  MOCK_AGENTS,
  MOCK_MESSAGES,
  MOCK_ANALYTICS,
  MOCK_CALLS,
  MOCK_KNOWLEDGE,
} from "./mockData";

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

// ─── Offline mock store for mutations ───
let mockAgents = [...MOCK_AGENTS];
let mockMessages: Record<number, Array<{ id: number; agentId: number; role: "user" | "agent"; content: string; createdAt: Date }>> = {
  1: [{ id: 1, agentId: 1, role: "agent" as const, content: "Bonjour ! Je suis Nora, votre agent de communication. Comment puis-je vous aider aujourd'hui ?", createdAt: new Date() }],
  2: [{ id: 2, agentId: 2, role: "agent" as const, content: "Bonjour ! Je suis Leo, votre agent RH. Prêt à optimiser vos processus recrutement ?", createdAt: new Date() }],
};
let mockKnowledge = [...MOCK_KNOWLEDGE];
let mockCalls = [...MOCK_CALLS];
let nextId = 100;

// ─── Mock response generator ───
function getMockResponse(reqBody: unknown): Response {
  const body = JSON.stringify({
    result: {
      data: {
        json: null,
      },
    },
  });
  return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
}

export function TRPCProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error: unknown) => {
              if (error && typeof error === "object") {
                const err = error as { data?: { code?: string } };
                if (err.data?.code === "UNAUTHORIZED" || err.data?.code === "FORBIDDEN") {
                  return false;
                }
              }
              return failureCount < 2;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          headers() {
            return {
              "x-trpc-source": "react",
            };
          },
          async fetch(url, options) {
            try {
              const res = await fetch(url, {
                ...options,
                credentials: "include",
              });
              return res;
            } catch {
              // ─── Backend unreachable → return mock data ───
              const bodyStr = options?.body?.toString() ?? "";
              const requests = JSON.parse(bodyStr || "[]");
              const results = requests.map((req: { path: string; input: { json: Record<string, unknown> } }) => {
                const { path, input } = req;
                const json = input?.json ?? {};
                let data: unknown = null;

                // ─── Auth ───
                if (path === "auth.me") {
                  data = null; // Not authenticated in static mode
                } else if (path === "auth.logout") {
                  data = { success: true };
                }
                // ─── Chat ───
                else if (path === "chat.listAgents") {
                  data = mockAgents;
                } else if (path === "chat.getHistory") {
                  const agentId = Number(json.agentId);
                  data = mockMessages[agentId] ?? [];
                } else if (path === "chat.sendMessage") {
                  const agentId = Number(json.agentId);
                  const content = String(json.content ?? "");
                  const userMsg = {
                    id: ++nextId,
                    agentId,
                    role: "user" as const,
                    content,
                    createdAt: new Date(),
                  };
                  mockMessages[agentId] = [...(mockMessages[agentId] ?? []), userMsg];

                  const agent = mockAgents.find((a) => a.id === agentId);
                  const responses: Record<number, string> = {
                    1: `Je vais vous aider avec votre communication. ${content.length > 20 ? "Excellente stratégie !" : "Pouvez-vous m'en dire plus ?"}`,
                    2: `Pour le volet RH, ${content.length > 20 ? "je vais analyser cela pour vous." : "précisez votre besoin."}`,
                  };
                  const agentMsg = {
                    id: ++nextId,
                    agentId,
                    role: "agent" as const,
                    content: responses[agentId] ?? `En tant qu'agent ${agent?.name ?? ""}, je traite votre demande : "${content}"`,
                    createdAt: new Date(),
                  };
                  setTimeout(() => {
                    mockMessages[agentId] = [...(mockMessages[agentId] ?? []), agentMsg];
                  }, 100);
                  data = agentMsg;
                } else if (path === "chat.createAgent") {
                  const newAgent = {
                    ...json,
                    id: ++nextId,
                    status: "active",
                    createdAt: new Date(),
                  };
                  mockAgents.push(newAgent as typeof mockAgents[0]);
                  data = newAgent;
                } else if (path === "chat.deleteAgent") {
                  const id = Number(json.id);
                  mockAgents = mockAgents.filter((a) => a.id !== id);
                  data = { success: true };
                }
                // ─── Agent detail ───
                else if (path === "agent.getById") {
                  data = mockAgents.find((a) => a.id === Number(json.id)) ?? null;
                } else if (path === "agent.update") {
                  const id = Number(json.id);
                  mockAgents = mockAgents.map((a) =>
                    a.id === id ? { ...a, ...(json.data as object) } : a
                  );
                  data = mockAgents.find((a) => a.id === id);
                } else if (path === "agent.getAnalytics") {
                  data = MOCK_ANALYTICS;
                } else if (path === "agent.listCalls") {
                  data = mockCalls.filter((c) => c.agentId === Number(json.agentId));
                } else if (path === "agent.createCall") {
                  const newCall = {
                    id: ++nextId,
                    ...json,
                    status: "scheduled",
                  };
                  mockCalls.push(newCall as typeof mockCalls[0]);
                  data = newCall;
                } else if (path === "agent.listKnowledge") {
                  data = mockKnowledge.filter((k) => k.agentId === Number(json.agentId));
                } else if (path === "agent.addKnowledge") {
                  const newK = {
                    id: ++nextId,
                    ...json,
                    type: json.type ?? "document",
                    createdAt: new Date(),
                  };
                  mockKnowledge.push(newK as typeof mockKnowledge[0]);
                  data = newK;
                } else if (path === "agent.deleteKnowledge") {
                  mockKnowledge = mockKnowledge.filter((k) => k.id !== Number(json.id));
                  data = { success: true };
                }

                return { result: { data: { json: data } } };
              });

              return new Response(JSON.stringify(results), {
                status: 200,
                headers: { "Content-Type": "application/json" },
              });
            }
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
