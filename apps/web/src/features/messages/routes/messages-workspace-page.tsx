import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { MessageRecord, MessageThreadData, MessageThreadListResponse } from "@salt/types";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import { ApiClientError } from "../../../lib/api-client";
import { SlideOverPanel } from "../../../app/components/slide-over-panel";
import {
  WorkspacePageHeader,
  WorkspaceSurface
} from "../../../app/components/workspace-page";
import { useToast } from "../../../app/providers/toast-provider";
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
  const [threadShelfExpanded, setThreadShelfExpanded] = useState(false);
  const toast = useToast();

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
      const message =
        error instanceof ApiClientError ? error.message : "Unable to post message.";
      setMessageError(message);
      toast.error("Message failed", message);
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
      toast.success("Message posted");
    }
  });

  const search = buildMessageSearchParams(searchState).toString();
  const threads = threadsQuery.data?.threads ?? [];

  useEffect(() => {
    if (!selectedThreadId) {
      setThreadShelfExpanded(false);
    }
  }, [selectedThreadId]);

  function prefetchThread(threadId: string) {
    void queryClient.prefetchQuery({
      queryKey: messageQueryKeys.detail(threadId),
      queryFn: () => getMessageThread(threadId)
    });
  }

  return (
    <div className="space-y-6">
      <WorkspacePageHeader
        description="Keep conversation browsing and reply work on one screen. Filters stay attached to the thread list, and opening a thread slides the same message shelf over the workspace."
        eyebrow="Messages"
        title="Message workspace"
      />

      <WorkspaceSurface
        actions={
          <span className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            {threads.length} visible
          </span>
        }
        bodyClassName="space-y-4"
        description="Thread filters control the list directly. Replies, task context, and linked documents all stay inside the shared shelf."
        title="Thread list"
        toolbar={
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_12rem_14rem]">
            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Search
              </span>
              <input
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
                onChange={(event) =>
                  setSearchParams(
                    updateMessagesSearchState(searchParams, { q: event.target.value }),
                    {
                      replace: true
                    }
                  )
                }
                placeholder="Search threads or messages"
                type="search"
                value={searchState.q}
              />
            </label>

            <label className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Scope
              </span>
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
              <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Category
              </span>
              <select
                className="w-full rounded-[1rem] border border-border bg-white px-4 py-3"
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
        }
      >
        {threadsQuery.isLoading ? (
          <div className="rounded-[1.25rem] border border-border bg-muted/20 px-4 py-8 text-sm text-muted-foreground">
            Loading message threads...
          </div>
        ) : threadsQuery.error instanceof ApiClientError ? (
          <div className="rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
            {threadsQuery.error.message}
          </div>
        ) : (
          <ThreadListPanel
            activeThreadId={selectedThreadId}
            onPrefetchThread={prefetchThread}
            search={search ? `?${search}` : ""}
            threads={threads}
          />
        )}
      </WorkspaceSurface>

      <SlideOverPanel
        expanded={threadShelfExpanded}
        onClose={() =>
          navigate({
            pathname: "/messages",
            search
          })
        }
        open={Boolean(selectedThreadId)}
      >
        {selectedThreadId ? (
          threadQuery.isLoading ? (
            <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
              Loading thread...
            </div>
          ) : threadQuery.data ? (
            <ThreadShelf
              data={threadQuery.data}
              error={messageError}
              isExpanded={threadShelfExpanded}
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
              onToggleExpanded={() => setThreadShelfExpanded((current) => !current)}
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 py-8 text-sm text-muted-foreground">
              Thread unavailable.
            </div>
          )
        ) : null}
      </SlideOverPanel>
    </div>
  );
}
