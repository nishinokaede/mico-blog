from fastapi import Depends, status
from tortoise.exceptions import IntegrityError
from pypinyin import lazy_pinyin
from tortoise.expressions import Q

from src.core.dbhelper import DbHelper
from src.core.security import PasswordManager, BcryptPasswordManager
from src.core.jwt import TokenManager, JWTTokenManager
from src.core.log_config import error_logger, system_logger
from src.core.interfaces.response import response
from src.modules.user.models import User
from src.modules.user.schemas.user import UserCreate, UserLogin, UserInDB, UserRoleEnum


class UserService:
  """
  用户服务类，处理用户相关的业务逻辑。

  这个类负责用户的创建、认证、获取用户信息以及刷新令牌等操作。
  它依赖于密码管理器和令牌管理器来处理密码加密和JWT令牌操作。
  """

  def __init__(
      self,
      password_manager: PasswordManager = Depends(BcryptPasswordManager),
      token_manager: TokenManager = Depends(JWTTokenManager)
  ):
    """
    初始化UserService实例。

    Args:
        password_manager (PasswordManager): 用于处理密码加密和验证的管理器。
        token_manager (TokenManager): 用于处理JWT令牌的创建和验证的管理器。
    """
    self.password_manager = password_manager
    self.token_manager = token_manager

  async def create_user(self, user: UserCreate):
    """
    创建新用户。

    Args:
        user (UserCreate): 包含用户创建信息的模型。

    Returns:
        dict: 包含创建结果的响应。如果成功，返回用户名和昵称；如果失败，返回错误信息。

    Raises:
        IntegrityError: 当尝试创建已存在的用户名时抛出。
    """
    # 检查用户名是否已存在
    existing_user = await User.get_or_none(username=user.username)
    if existing_user:
      error_logger.error(f"用户创建失败: {user.username},用户名已存在")
      return response(code=400, message="用户名已存在")

    hashed_password = self.password_manager.hash_password(user.password)
    try:
      new_user = await User.create(
        username=user.username,
        nickname=user.nickname or user.username,  # 如果没有提供昵称，使用用户名作为昵称
        password=hashed_password,
        username_pinyin=''.join(lazy_pinyin(user.username))
      )
      return response(message="用户创建成功", data={"username": new_user.username, "nickname": new_user.nickname})
    except IntegrityError as e:
      error_logger.error(f"用户创建失败: {user.username},数据库错误: {str(e)}")
      return response(code=500, message="创建用户时发生数据库错误")
    except Exception as e:
      error_logger.error(f"用户创建失败: {user.username},未知错误: {str(e)}")
      return response(code=500, message="创建用户时发生未知错误")

  async def authenticate_user(self, user: UserLogin):
    """
    验证用户登录。

    Args:
        user (UserLogin): 包含登录信息的模型。

    Returns:
        dict: 包含认证结果的响应。如果成功，返回访问令牌和刷新令牌；如果失败，返回错误信息。
    """
    db_user = await User.get_or_none(username=user.username)

    if db_user is None:
      return response(code=404, message="用户名不存在！")

    if self.password_manager.verify_password(user.password, db_user.password):
      access_token = self.token_manager.create_access_token(data={"sub": db_user.username, "group": db_user.group_id})
      refresh_token = self.token_manager.create_refresh_token(data={"sub": user.username, "group": db_user.group_id})
      # 确保令牌是字符串类型
      if isinstance(access_token, bytes):
        access_token = access_token.decode('utf-8')
      if isinstance(refresh_token, bytes):
        refresh_token = refresh_token.decode('utf-8')

      data = {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user_info": UserInDB.model_validate(db_user),
        "token_type": "bearer"
      }
      return response(message="登录成功", data=data)
    else:
      error_logger.error(f'用户登录失败: {user.username}')
      return response(code=404, message="密码错误！")

  async def get_current_user(self, token: str):
    """
    获取当前认证用户的信息。

    Args:
        token (str): JWT访问令牌。

    Returns:
        UserInDB: 当前用户的信息。

    Raises:
        HTTPException: 当令牌无效或用户不存在时抛出。
    """
    try:
      token_data = self.token_manager.verify_token(token)
      user = await User.get_or_none(username=token_data.username)
      if user is None:
        error_logger.error(f"获取用户认证信息时用户不存在: {token_data.username}")
        return response(code=status.HTTP_404_NOT_FOUND, message="未找到用户")
      return await UserInDB.model_validate(user)
    except Exception as e:
      error_logger.error(f"获取用户认证信息失败: {e}")
      return response(code=status.HTTP_401_UNAUTHORIZED, message=f"无法验证凭据, {e}")

  async def refresh_token(self, refresh_token: str):
    """
    刷新访问令牌。

    Args:
        refresh_token (str): 用于刷新的令牌。

    Returns:
        dict: 包含新的访问令牌和刷新令牌的响应。

    Raises:
        ValueError: 当刷新令牌无效时抛出。
    """
    try:
      new_access_token, new_refresh_token = self.token_manager.refresh_tokens(refresh_token)
      return response(
        data={
          "access_token": new_access_token,
          "refresh_token": new_refresh_token,
          "token_type": "bearer"
        },
        message="令牌刷新成功"
      )
    except ValueError:
      error_logger.error(f"刷新令牌失败: {refresh_token}")
      return response(code=status.HTTP_401_UNAUTHORIZED, message="无效的刷新令牌")

  async def generate_permanent_token(self, username: str):
    """
    为指定用户生成永久token。

    Args:
        username (str): 用户名。

    Returns:
        dict: 包含永久token的响应。
    """
    try:
      user = await User.get_or_none(username=username)
      if user is None:
        return response(code=status.HTTP_404_NOT_FOUND, message="用户不存在")
      
      # 生成永久token
      token_data = {
        "sub": user.username,
        "role": user.role,
        "group": user.group_id
      }
      
      permanent_token = self.token_manager.create_permanent_token(token_data)
      
      # 确保令牌是字符串类型
      if isinstance(permanent_token, bytes):
        permanent_token = permanent_token.decode('utf-8')
      
      data = {
        "permanent_token": permanent_token,
        "token_type": "bearer",
        "expires_in": "100 years",
        "user_info": UserInDB.model_validate(user)
      }
      
      system_logger.info(f"为用户 {username} 生成永久token成功")
      return response(message="永久token生成成功", data=data)
      
    except Exception as e:
      error_logger.error(f"生成永久token失败: {e}")
      return response(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message=f"生成永久token失败: {str(e)}")

  @staticmethod
  async def search_member(keyword, user_type: str = UserRoleEnum.MEMBER):
    query = Q(is_active=True)

    if user_type:
      query &= Q(role=user_type)

    if keyword:
      keyword_pinyin = ''.join(lazy_pinyin(keyword))
      query &= Q(nickname__icontains=keyword) | Q(username_pinyin__icontains=keyword_pinyin)

    db = DbHelper(User)
    result = await db.q_selects(query=query, offset=0, limit=100)
    users = result["items"]

    if not users:
      return response(code=404, message="未找到相关用户")

    user_list = [UserInDB.model_validate(user) for user in users]
    return response(data=user_list, message="搜索成功")
