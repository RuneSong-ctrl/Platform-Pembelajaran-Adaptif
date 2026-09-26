"""In-process push to open browser tabs (Server-Sent Events).

Events only carry ids ("thread X changed"); the page then refetches through the normal, access-checked endpoints,
so nothing private travels over this channel.
ponytail: subscribers live in this process only; with several uvicorn workers, move this to Redis pub/sub.
"""
import asyncio
from collections import defaultdict

_subs: dict[str, set[tuple[asyncio.AbstractEventLoop, asyncio.Queue]]] = defaultdict(set)


def subscribe(user_id: str):
    sub = (asyncio.get_running_loop(), asyncio.Queue(maxsize=100))
    _subs[user_id].add(sub)
    return sub


def unsubscribe(user_id: str, sub) -> None:
    _subs[user_id].discard(sub)
    if not _subs[user_id]:
        del _subs[user_id]


def _put(queue: asyncio.Queue, event: dict) -> None:
    if not queue.full():  # a stuck tab just misses events; it refetches on reconnect anyway
        queue.put_nowait(event)


def notify(user_ids, event: dict) -> None:
    """Safe to call from sync endpoints (thread pool): hands the event to each subscriber's own loop."""
    for uid in set(user_ids):
        for loop, queue in list(_subs.get(uid, ())):
            loop.call_soon_threadsafe(_put, queue, event)
