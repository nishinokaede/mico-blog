#!/usr/bin/env python3
"""
生成永久Token脚本

这个脚本用于为指定用户生成永久有效的JWT token，
避免用户每次都需要重新登录。

使用方法:
    python scripts/generate_permanent_token.py --username <用户名>
    python scripts/generate_permanent_token.py --username densu
"""

import os
import sys
import asyncio
import argparse
from pathlib import Path

# 添加项目根目录到Python路径
sys.path.insert(0, str(Path(__file__).parent.parent))

from tortoise import Tortoise
from src.core.jwt import JWTTokenManager
from src.modules.user.models import User
from src.core.dbConfig import TORTOISE_ORM


async def generate_permanent_token(username: str):
    """
    为指定用户生成永久token
    
    Args:
        username (str): 用户名
    
    Returns:
        str: 永久token
    """
    print(f"正在为用户 '{username}' 生成永久token...")
    
    # 初始化数据库连接
    await Tortoise.init(config=TORTOISE_ORM)
    
    try:
        # 查找用户
        user = await User.get_or_none(username=username)
        if not user:
            print(f"错误: 用户 '{username}' 不存在！")
            return None
        
        # 创建JWT管理器
        token_manager = JWTTokenManager()
        
        # 生成永久token
        token_data = {
            "sub": user.username,
            "role": user.role,
            "group": user.group_id
        }
        
        permanent_token = token_manager.create_permanent_token(token_data)
        
        print("\n" + "="*60)
        print("永久Token生成成功！")
        print("="*60)
        print(f"用户名: {user.username}")
        print(f"角色: {user.role}")
        print(f"用户组: {user.group_id}")
        print(f"Token类型: 永久token (100年有效期)")
        print("\n永久Token:")
        print(permanent_token)
        print("\n" + "="*60)
        print("使用说明:")
        print("1. 将此token保存在安全的地方")
        print("2. 在API请求的Authorization头中使用: Bearer <token>")
        print("3. 此token在100年内有效，无需刷新")
        print("4. 如需撤销，请联系管理员重新生成SECRET_KEY")
        print("="*60)
        
        return permanent_token
        
    except Exception as e:
        print(f"生成永久token时发生错误: {e}")
        return None
    finally:
        # 关闭数据库连接
        await Tortoise.close_connections()


async def list_users():
    """
    列出所有用户
    """
    print("正在获取用户列表...")
    
    # 初始化数据库连接
    await Tortoise.init(config=TORTOISE_ORM)
    
    try:
        users = await User.all()
        if not users:
            print("没有找到任何用户。")
            return
        
        print("\n可用用户列表:")
        print("-" * 50)
        for user in users:
            print(f"用户名: {user.username:<15} 角色: {user.role:<10} 昵称: {user.nickname}")
        print("-" * 50)
        
    except Exception as e:
        print(f"获取用户列表时发生错误: {e}")
    finally:
        await Tortoise.close_connections()


def main():
    parser = argparse.ArgumentParser(description='生成永久JWT Token')
    parser.add_argument('--username', '-u', type=str, help='要生成token的用户名')
    parser.add_argument('--list-users', '-l', action='store_true', help='列出所有用户')
    
    args = parser.parse_args()
    
    if args.list_users:
        asyncio.run(list_users())
    elif args.username:
        asyncio.run(generate_permanent_token(args.username))
    else:
        print("使用方法:")
        print("  生成永久token: python scripts/generate_permanent_token.py --username <用户名>")
        print("  列出用户:     python scripts/generate_permanent_token.py --list-users")
        print("\n示例:")
        print("  python scripts/generate_permanent_token.py --username densu")
        print("  python scripts/generate_permanent_token.py -l")


if __name__ == "__main__":
    main()