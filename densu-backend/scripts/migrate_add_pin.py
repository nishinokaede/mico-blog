#!/usr/bin/env python3
"""
迁移脚本：为 mblog_posts 表添加 is_pinned 和 pinned_at 字段
"""
import asyncio
import os
import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from tortoise import Tortoise
from src.core.dbConfig import TORTOISE_ORM


async def migrate():
    await Tortoise.init(config=TORTOISE_ORM)
    conn = Tortoise.get_connection("default")

    # 检查字段是否已存在
    result = await conn.execute_query(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='mblog_posts' AND column_name='is_pinned'"
    )
    if result[1]:  # 已有行返回
        print("字段 is_pinned 已存在，跳过迁移。")
    else:
        await conn.execute_script(
            'ALTER TABLE mblog_posts ADD COLUMN is_pinned BOOLEAN NOT NULL DEFAULT FALSE'
        )
        print("已添加字段 is_pinned。")

    result = await conn.execute_query(
        "SELECT column_name FROM information_schema.columns "
        "WHERE table_name='mblog_posts' AND column_name='pinned_at'"
    )
    if result[1]:
        print("字段 pinned_at 已存在，跳过迁移。")
    else:
        await conn.execute_script(
            'ALTER TABLE mblog_posts ADD COLUMN pinned_at TIMESTAMPTZ NULL'
        )
        print("已添加字段 pinned_at。")

    await Tortoise.close_connections()
    print("迁移完成。")

if __name__ == "__main__":
    os.environ.setdefault('DB_ENV_FILE', 'env/.env_db_prod')
    asyncio.run(migrate())
