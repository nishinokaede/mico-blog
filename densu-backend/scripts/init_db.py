#!/usr/bin/env python3
"""
数据库初始化脚本
用于创建数据库表和初始数据
"""

import asyncio
import os
import sys
from pathlib import Path


# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from tortoise import Tortoise
from src.core.dbConfig import TORTOISE_ORM
from src.modules.user.models.user import User
from src.core.security import BcryptPasswordManager


async def init_database():
    """初始化数据库"""
    print("正在连接数据库...")
    await Tortoise.init(config=TORTOISE_ORM)
    
    print("正在创建数据库表...")
    await Tortoise.generate_schemas()
    
    print("数据库表创建完成!")


async def create_superuser():
    """创建超级管理员用户"""
    print("正在创建超级管理员用户...")
    
    # 检查用户是否已存在
    existing_user = await User.get_or_none(username='densu')
    if existing_user:
        print("超级管理员用户已存在: densu")
        return
    
    # 创建密码管理器
    password_manager = BcryptPasswordManager()
    hashed_password = password_manager.hash_password('pwd123')
    
    # 创建超级管理员用户
    user = await User.create(
        username='densu',
        nickname='densu',
        password=hashed_password,
        role='admin'
    )
    
    print(f"超级管理员用户创建成功!")
    print(f"用户名: {user.username}")
    print(f"昵称: {user.nickname}")
    print(f"角色: {user.role}")
    print("密码: pwd123")

async def main():
    """主函数"""
    try:
        # 初始化数据库
        await init_database()
        
        # 创建超级管理员用户
        await create_superuser()
        
        print("\n数据库初始化完成!")
        
    except Exception as e:
        print(f"初始化失败: {e}")
        sys.exit(1)
    finally:
        await Tortoise.close_connections()


if __name__ == "__main__":
    # 设置环境变量
    os.environ.setdefault('DB_ENV_FILE', 'env/.env_db_prod')
    
    # 运行初始化
    asyncio.run(main())