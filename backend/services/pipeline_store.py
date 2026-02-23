# services/pipeline_store.py — SQLite-backed async pipeline persistence
import json
import aiosqlite
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

DB_PATH = Path(__file__).parent.parent / "pipelines.db"


async def init_db():
    """Create the pipelines table if it does not exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("""
            CREATE TABLE IF NOT EXISTS pipelines (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL,
                data        TEXT NOT NULL
            )
        """)
        await db.commit()


async def save_pipeline(pipeline_id: str, name: str, nodes: list, edges: list) -> dict:
    """Upsert (insert or replace) a pipeline record."""
    now = datetime.now(timezone.utc).isoformat()
    data_json = json.dumps({"nodes": nodes, "edges": edges})
    async with aiosqlite.connect(DB_PATH) as db:
        # Check if exists so we preserve created_at
        async with db.execute("SELECT created_at FROM pipelines WHERE id = ?", (pipeline_id,)) as cur:
            row = await cur.fetchone()
        created_at = row[0] if row else now
        await db.execute("""
            INSERT INTO pipelines (id, name, created_at, updated_at, data)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                name = excluded.name,
                updated_at = excluded.updated_at,
                data = excluded.data
        """, (pipeline_id, name, created_at, now, data_json))
        await db.commit()
    return {"id": pipeline_id, "name": name, "created_at": created_at, "updated_at": now}


async def list_pipelines() -> List[dict]:
    """Return id, name, created_at, updated_at for all saved pipelines."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, name, created_at, updated_at FROM pipelines ORDER BY updated_at DESC"
        ) as cur:
            rows = await cur.fetchall()
    return [dict(r) for r in rows]


async def get_pipeline(pipeline_id: str) -> Optional[dict]:
    """Return the full pipeline (metadata + data). None if not found."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        async with db.execute(
            "SELECT id, name, created_at, updated_at, data FROM pipelines WHERE id = ?",
            (pipeline_id,)
        ) as cur:
            row = await cur.fetchone()
    if not row:
        return None
    r = dict(row)
    r["data"] = json.loads(r["data"])
    return r


async def delete_pipeline(pipeline_id: str) -> bool:
    """Delete a pipeline. Returns True if a row was deleted."""
    async with aiosqlite.connect(DB_PATH) as db:
        cur = await db.execute("DELETE FROM pipelines WHERE id = ?", (pipeline_id,))
        await db.commit()
        return cur.rowcount > 0
