import argparse
import sys

from database import SessionLocal
from retriever import retrieve


def main() -> int:
    parser = argparse.ArgumentParser(description="Retrieve saved ReelToReal records.")
    parser.add_argument("query")
    parser.add_argument("--top-k", type=int, default=5)
    args = parser.parse_args()
    if not SessionLocal:
        print("Database is not configured or reachable.", file=sys.stderr)
        return 2
    with SessionLocal() as db:
        result = retrieve(db, args.query, top_k=args.top_k)
    print(f"Rewritten query: {result.rewritten_query}")
    print(f"Filters: {result.filters_applied}")
    print(f"Filters relaxed: {result.filters_relaxed}")
    print(f"Sub-queries: {result.sub_queries}")
    if not result.results:
        print(f"Reason: {result.reason}")
        return 0
    for rank, item in enumerate(result.results, 1):
        print(f"{rank}. {item.reel_id} | {item.title} | similarity={item.similarity:.3f} | {item.retrieval_method} | {item.category} | {item.city} | {item.price}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
