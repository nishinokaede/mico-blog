"""
数据库初始化脚本：生成表结构并创建默认管理员用户。

通过 Docker Compose 的 init-db 服务运行，
等待 PostgreSQL 就绪后执行。
"""
import asyncio
import os
import sys
import traceback

import asyncpg
from passlib.context import CryptContext

# 添加项目根目录到路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tortoise import Tortoise
from src.core.dbConfig import TORTOISE_ORM

# 默认用户配置
DEFAULT_USERNAME = "densu"
DEFAULT_PASSWORD = "t7JIRd+F/E5hSXxn"
DEFAULT_NICKNAME = "densu"


async def wait_for_db(max_retries: int = 30, interval: int = 2):
    """用独立的 asyncpg 连接检测数据库就绪，不依赖 Tortoise 连接池。"""
    creds = TORTOISE_ORM["connections"]["default"]["credentials"]
    for i in range(max_retries):
        try:
            conn = await asyncpg.connect(
                host=creds["host"],
                port=creds["port"],
                user=creds["user"],
                password=creds["password"],
                database=creds["database"],
                ssl=creds.get("ssl", False),
            )
            await conn.execute("SELECT 1")
            await conn.close()
            print("[init] 数据库连接成功", flush=True)
            return
        except Exception as e:
            print(f"[init] 等待数据库就绪... ({i + 1}/{max_retries}), 错误: {e}", flush=True)
            await asyncio.sleep(interval)
    raise RuntimeError("数据库连接超时")


async def migrate_columns():
    """通用增量迁移：对比模型定义与数据库实际结构，自动添加缺失字段。
    
    每次新增模型字段后无需手动修改此函数。"""
    print("[init] 检查并执行增量迁移...", flush=True)
    conn = Tortoise.get_connection("default")
    generator = conn.schema_generator

    # 遍历所有注册的模型
    for model_name, model in Tortoise.apps["models"].items():
        table = model._meta.db_table
        db_fields = model._meta.fields

        # 查表是否存在
        rows = await conn.execute_query(
            f"SELECT column_name FROM information_schema.columns WHERE table_name='{table}'"
        )
        if not rows[1]:
            continue  # 表不存在，generate_schemas 会创建

        existing = {r["column_name"] for r in rows[1]}

        # tortoise 0.25 中 fields 是 set，遍历 field 对象获取名字
        for field in db_fields:
            field_name = field.model_field_name
            if field_name in existing:
                continue

            # 跳过关联字段（FK 列 / M2M 中间表），它们由 Tortoise 自动管理
            if hasattr(field, "reference"):
                continue

            col_sql = generator._get_column_sql(field, safe=True)
            await conn.execute_script(
                f'ALTER TABLE "{table}" ADD COLUMN {col_sql}'
            )
            print(f"[init] 已添加字段 {table}.{field_name}", flush=True)

    print("[init] 增量迁移完成", flush=True)


async def init_database():
    """初始化数据库：等 DB 就绪后用 Tortoise 创建表并插入默认用户。"""
    print("[init] 初始化数据库...", flush=True)

    # 先确认数据库可连接
    await wait_for_db()

    # 再用 Tortoise 初始化
    await Tortoise.init(config=TORTOISE_ORM)
    print("[init] Tortoise 初始化完成", flush=True)

    # 增量迁移：先为已有表补上缺失字段，再建新表
    await migrate_columns()

    # 生成数据库表（处理全新表）
    await Tortoise.generate_schemas(safe=True)
    print("[init] 数据库表创建完成", flush=True)

    # 检查默认用户是否已存在
    from src.modules.user.models import User
    existing = await User.get_or_none(username=DEFAULT_USERNAME)
    if existing:
        print(f"[init] 默认用户 '{DEFAULT_USERNAME}' 已存在，跳过创建", flush=True)
    else:
        pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
        hashed_password = pwd_context.hash(DEFAULT_PASSWORD)

        await User.create(
            username=DEFAULT_USERNAME,
            nickname=DEFAULT_NICKNAME,
            password=hashed_password,
            is_superuser=True,
            role="超级管理员",
            is_verified=True,
        )
        print(f"[init] 默认用户 '{DEFAULT_USERNAME}' 创建成功", flush=True)

    await Tortoise.close_connections()
    print("[init] 初始化完成", flush=True)


if __name__ == "__main__":
    try:
        asyncio.run(init_database())
    except Exception:
        traceback.print_exc()
        sys.exit(1)
