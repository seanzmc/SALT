import type {
  MessageListFilters,
  MessageThreadCategory,
  MessageThreadScope
} from "@salt/types";

export type MessagesSearchState = {
  q: string;
  scope: MessageThreadScope | "ALL";
  category: MessageThreadCategory | "ALL";
};

const DEFAULT_STATE: MessagesSearchState = {
  q: "",
  scope: "ALL",
  category: "ALL"
};

export function getMessagesSearchState(searchParams: URLSearchParams): MessagesSearchState {
  return {
    q: searchParams.get("q") ?? DEFAULT_STATE.q,
    scope:
      (searchParams.get("scope") as MessageThreadScope | "ALL" | null) ?? DEFAULT_STATE.scope,
    category:
      (searchParams.get("category") as MessageThreadCategory | "ALL" | null) ??
      DEFAULT_STATE.category
  };
}

export function toMessageListFilters(
  state: MessagesSearchState,
  overrides: Partial<MessagesSearchState> = {}
): MessageListFilters {
  const next = { ...state, ...overrides };

  return {
    q: next.q || undefined,
    scope: next.scope,
    category: next.category
  };
}

export function buildMessageSearchParams(state: MessagesSearchState) {
  const searchParams = new URLSearchParams();

  if (state.q) {
    searchParams.set("q", state.q);
  }

  if (state.scope !== DEFAULT_STATE.scope) {
    searchParams.set("scope", state.scope);
  }

  if (state.category !== DEFAULT_STATE.category) {
    searchParams.set("category", state.category);
  }

  return searchParams;
}

export function updateMessagesSearchState(
  current: URLSearchParams,
  patch: Partial<MessagesSearchState>
) {
  const currentState = getMessagesSearchState(current);
  return buildMessageSearchParams({
    ...currentState,
    ...patch
  });
}
