"""Index or refresh saved ReelToReal documents in the existing pgvector column."""
import argparse
import sys

from database import SessionLocal
from embeddings import build_search_document, generate_embedding
from models import ReelModel


def main() -> int:
    parser = argparse.ArgumentParser(description="Index ReelToReal embeddings.")
    parser.add_argument("--force", action="store_true", help="Regenerate every embedding.")
    parser.add_argument("--limit", type=int, default=None)
    args = parser.parse_args()
    if not SessionLocal:
        print("Database is not configured or reachable.", file=sys.stderr)
        return 2

    embedded = skipped = failed = 0
    with SessionLocal() as db:
        query = db.query(ReelModel).filter(ReelModel.status == "success").order_by(ReelModel.video_id)
        if args.limit:
            query = query.limit(args.limit)
        rows = query.all()
        for index, reel in enumerate(rows, 1):
            if reel.embedding is not None and not args.force:
                skipped += 1
                print(f"[{index}/{len(rows)}] Reel {reel.video_id}: unchanged, skipped")
                continue
            try:
                document = build_search_document({
                    "place": reel.place, "city": reel.city, "country": reel.country,
                    "category": reel.category, "cuisine": reel.cuisine,
                    "foods": reel.foods, "activity_name": reel.activity_name,
                    "product_name": reel.product_name, "tip_summary": reel.tip_summary,
                    "summary": reel.summary, "tags": reel.tags, "ocr_text": reel.ocr_text,
                })
                reel.embedding = generate_embedding(document)
                db.commit()
                embedded += 1
                print(f"[{index}/{len(rows)}] Reel {reel.video_id}: generating embedding... done")
            except Exception as exc:
                db.rollback()
                failed += 1
                print(f"[{index}/{len(rows)}] Reel {reel.video_id}: failed: {exc}", file=sys.stderr)
    print(f"Summary: embedded {embedded}, skipped {skipped}, failed {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
