import MiniSearch from "minisearch";

type InitMessage = {
  type: "init";
  payload: {
    index: unknown;
  };
};

type QueryMessage = {
  type: "query";
  payload: {
    query: string;
  };
};

type MessageIn = InitMessage | QueryMessage;

let miniSearch: MiniSearch<{
  id: string;
  title?: string;
  description?: string;
  promptText?: string;
  category?: string;
  tool?: string;
  language?: string;
}> | null = null;

self.onmessage = (event: MessageEvent<MessageIn>) => {
  const message = event.data;
  if (message.type === "init") {
    miniSearch = MiniSearch.loadJS(
      message.payload.index as Parameters<typeof MiniSearch.loadJS>[0],
      {
      fields: ["title", "description", "promptText", "category", "tool", "language"],
      storeFields: ["id"],
      idField: "id",
      searchOptions: {
        boost: {
          title: 5,
          category: 3
        },
        fuzzy: 0.15,
        prefix: true
      }
      }
    );
    return;
  }

  if (!miniSearch) {
    postMessage({ type: "results", payload: { ids: [] as string[] } });
    return;
  }

  const query = message.payload.query.trim();
  if (!query) {
    postMessage({ type: "results", payload: { ids: [] as string[] } });
    return;
  }

  const hits = miniSearch.search(query, { prefix: true, fuzzy: 0.15 });
  const ids = hits.map((hit) => String(hit.id));
  postMessage({ type: "results", payload: { ids } });
};
