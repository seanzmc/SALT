import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessageRecord, MessageThreadData, MessageThreadListResponse } from "@salt/types";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import {
  createMessage,
  getMessageThread,
  getMessageThreadList
} from "../api/messages-client";
import { ThreadListPanel } from "../components/thread-list-panel";
import { ThreadShelf } from "../components/thread-shelf";
import { messageQueryKeys } from "../lib/query-keys";
import {
  buildMessageSearchParams,
  getMessagesSearchState,
  toMessageListFilters,
  updateMessagesSearchState
} from "../lib/url-state";

function appendOptimisticMessage(
  current: MessageThreadData | undefined,
  message: MessageRecord
) {
  if (!current?.thread) {
    return current;
  }

  return {
    ...current,
    thread: {
      ...current.thread,
      updatedAt: new Date().toISOString(),
      latestMessage: {
        id: message.id,
        content: message.content,
        createdAt: message.createdAt,
        author: message.author
      },
      messageCount: current.thread.messageCount + 1,
      messages: [...current.thread.messages, message]
    }
  };
}

export function MessagesWorkspacePage() {
  const params = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [messageError, setMessageError] = useState<string>();

  const selectedThreadId = params.threadId;
  const searchState = getMessagesSearchState(searchParams);
  const deferredSearch = useDeferredValue(searchState.q);
  const filters = useMemo(
    () => toMessageListFilters(searchState, { q: deferredSearch }),
    [deferredSearch, searchState]
  );
  const listKey = messageQueryKeys.list(filters);

  const threadsQuery = useQuery({
    queryKey: listKey,
    queryFn: () => getMessageThreadList(filters),
    placeholderData: (previous) => previous
  });

  const threadQuery = useQuery({
    queryKey: selectedThreadId ? messageQueryKeys.detail(selectedThreadId) : ["messages", "detail", "none"],
    queryFn: () => getMessageThread(selectedThreadId!),
    enabled: Boolean(selectedThreadId)
  });

  const createMessageMutation = useMutation({
    mutationFn: createMessage,
    onMutate: async (payload) => {
      setMessageError(undefined);

      if (!selectedThreadId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: messageQueryKeys.detail(selectedThreadId) });
      const previousDetail = queryClient.getQueryData<MessageThreadData>(
        messageQueryKeys.detail(selectedThreadId)
      );
      const optimisticMessage: MessageRecord = {
        id: `optimistic-message-${Date.now()}`,
        content: payload.content,
        createdAt: new Date().toISOString(),
        author: {
          id: "me",
          name: "You"
        },
        linkedTaskId: threadQuery.data?.thread?.task?.id ?? null,
        attachmentDocument: null
      };

      queryClient.setQueryData<MessageThreadData>(
        messageQueryKeys.detail(selectedThreadId),
        (current) => appendOptimisticMessage(current, optimisticMessage)
      );

      return { previousDetail };
    },
    onError: (error, _payload, context) => {
      setMessageError(
        error instanceof ApiClientError ? error.message : "Unable to post message."
      );
      if (selectedThreadId && context?.previousDetail) {
        queryClient.setQueryData(messageQueryKeys.detail(selectedThreadId), context.previousDetail);
      }
    },
    onSuccess: async (data) => {
      setMessageError(undefined);
      if (!data.thread) {
        return;
      }

      queryClient.setQueryData(messageQueryKeys.detail(data.thread.id), data);
      await queryClient.invalidateQueries({ queryKey: messageQueryKeys.lists() });
    }
  });

  const search = buildMessageSearchParams(searchState).toString();
  const threads = threadsQuery.data?.threads ?? [];

  function prefetchThread(threadId: string) {
    void queryClient.prefetchQuery({
      queryKey: messageQueryKeys.detail(threadId),
      queryFn: () => getMessageThread(threadId)
    });
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.4)] backdrop-blur">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Messages v2</p>
        <h2 className="mt-2 text-3xl font-semibold">In-app communication flow</h2>
        <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
          Query-driven thread navigation, focused message view, optimistic posting, and direct task
          context from the new SPA/API stack.
        </p>
      </section>

      <section className="rounded-[1.75rem] border border-border bg-white/85 p-5 shadow-sm backdrop-blur">
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Search
            </span>
            <input
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              onChange={(event) =>
                setSearchParams(updateMessagesSearchState(searchParams, { q: event.target.value }), {
                  replace: true
                })
              }
              placeholder="Search threads or messages"
              type="search"
              value={searchState.q}
            />
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Scope
            </span>
            <select
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              onChange={(event) =>
                setSearchParams(
                  updateMessagesSearchState(searchParams, {
                    scope: event.target.value as any
                  })
                )
              }
              value={searchState.scope}
            >
              <option value="ALL">All scopes</option>
              <option value="GENERAL">General</option>
              <option value="TASK">Task</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Category
            </span>
            <select
              className="w-full rounded-2xl border border-border bg-card px-4 py-3"
              onChange={(event) =>
                setSearchParams(
                  updateMessagesSearchState(searchParams, {
                    category: event.target.value as any
                  })
                )
              }
              value={searchState.category}
            >
              <option value="ALL">All categories</option>
              <option value="GENERAL">General</option>
              <option value="OPERATIONS">Operations</option>
              <option value="PROCUREMENT">Procurement</option>
              <option value="COMPLIANCE">Compliance</option>
              <option value="MARKETING">Marketing</option>
              <option value="LAUNCH">Launch</option>
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-4">
          {threadsQuery.error instanceof ApiClientError ? (
            <div className="rounded-[1.75rem] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
              {threadsQuery.error.message}
            </div>
          ) : null}

          <ThreadListPanel
            activeThreadId={selectedThreadId}
            onPrefetchThread={prefetchThread}
            search={search ? `?${search}` : ""}
            threads={threads}
          />
        </div>

        <div className="min-w-0">
          {selectedThreadId ? (
            threadQuery.isLoading ? (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm xl:sticky xl:top-6">
                Loading thread…
              </section>
            ) : threadQuery.data ? (
              <ThreadShelf
                data={threadQuery.data}
                error={messageError}
                isPosting={createMessageMutation.isPending}
                onClose={() =>
                  navigate({
                    pathname: "/messages",
                    search
                  })
                }
                onSubmitMessage={async (payload) => {
                  await createMessageMutation.mutateAsync(payload);
                }}
              />
            ) : (
              <section className="rounded-[1.75rem] border border-border bg-card/90 p-5 text-sm text-muted-foreground shadow-sm">
                Thread unavailable.
              </section>
            )
          ) : (
            <section className="flex min-h-[24rem] items-center justify-center rounded-[1.75rem] border border-dashed border-border bg-card/80 p-8 text-center shadow-sm xl:sticky xl:top-6">
              <div>
                <p className="font-medium">Select a thread to keep discussion in context.</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  The left list stays stable while the right shelf handles message history and
                  posting.
                </p>
                {threads[0] ? (
                  <Link
                    className="mt-4 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                    to={{
                      pathname: `/messages/${threads[0].id}`,
                      search
                    }}
                  >
                    Open first visible thread
                  </Link>
                ) : null}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
