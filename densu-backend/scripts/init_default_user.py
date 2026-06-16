"""
数据库初始化脚本：生成表结构并创建默认管理员用户。

通过 Docker Compose 的 init-db 服务运行，
等待 PostgreSQL 就绪后执行。
"""
import asyncio
import os
import sys
import time

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
    """等待数据库就绪。"""
    db_config = TORTOISE_ORM["connections"]["default"]["credentials"]
    for i in range(max_retries):
        try:
            conn = await Tortoise.get_connection("default")
            await conn.execute_query("SELECT 1")
            print(f"[init] 数据库连接成功")
            return
        except Exception:
            print(f"[init] 等待数据库就绪... ({i + 1}/{max_retries})")
            time.sleep(interval)
    raise RuntimeError("数据库连接超时")


async def init_database():
    """初始化数据库：创建表并插入默认用户。"""
    print("[init] 初始化数据库...")

    await Tortoise.init(config=TORTOISE_ORM)
    await wait_for_db()

    # 生成数据库表
    await Tortoise.generate_schemas(safe=True)
    print("[init] 数据库表创建完成")

    # 检查默认用户是否已存在
    from src.modules.user.models import User
    existing = await User.get_or_none(username=DEFAULT_USERNAME)
    if existing:
        print(f"[init] 默认用户 '{DEFAULT_USERNAME}' 已存在，跳过创建")
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
        print(f"[init] 默认用户 '{DEFAULT_USERNAME}' 创建成功")

    await Tortoise.close_connections()
    print("[init] 初始化完成")


if __name__ == "__main__":
    asyncio.run(init_database())
