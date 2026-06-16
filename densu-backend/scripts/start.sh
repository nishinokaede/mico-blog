#!/bin/bash

# 等待数据库启动
echo "等待数据库启动..."
sleep 10

# 运行数据库迁移
echo "运行数据库迁移..."
poetry run python -c "
import asyncio
from tortoise import Tortoise
from src.core.dbConfig import TORTOISE_ORM

async def init_db():
    await Tortoise.init(config=TORTOISE_ORM)
    await Tortoise.generate_schemas()
    await Tortoise.close_connections()

asyncio.run(init_db())
print('数据库初始化完成')
"

# 创建超级管理员用户
echo "创建超级管理员用户..."
poetry run python -c "
import asyncio
from tortoise import Tortoise
from src.core.dbConfig import TORTOISE_ORM
from src.modules.user.models.user import User
from src.core.security import BcryptPasswordManager

async def create_superuser():
    await Tortoise.init(config=TORTOISE_ORM)
    
    # 检查用户是否已存在
    existing_user = await User.get_or_none(username='densu')
    if existing_user:
        print('超级管理员用户已存在')
    else:
        # 创建密码管理器
        password_manager = BcryptPasswordManager()
        hashed_password = password_manager.hash_password('pwd123')
        
        # 创建超级管理员用户
        await User.create(
            username='densu',
            nickname='densu',
            password=hashed_password,
            role='admin'
        )
        print('超级管理员用户创建成功: username=densu, password=pwd123')
    
    await Tortoise.close_connections()

asyncio.run(create_superuser())
"

# 启动应用
echo "启动应用..."
poetry run uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 4