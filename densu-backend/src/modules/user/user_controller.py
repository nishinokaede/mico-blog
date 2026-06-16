from fastapi import APIRouter, Depends
from src.modules.user.schemas.user import UserRoleEnum, UserSearch
from src.core.auth import get_current_user, get_refresh_token
from src.core.interfaces.response import response, token_response
from src.modules.queue.models import QueueRecord
from src.modules.queue.schemas.queue import QueueStatusEnum
from src.modules.user.schemas.user import UserCreate, UserLogin
from src.modules.user.user_service import UserService


class UserController:
  def __init__(self):
    self.router = APIRouter(prefix="/user", tags=["用户模块"])

    @self.router.post("/register", summary="注册")
    async def register_user(user: UserCreate, user_service: UserService = Depends(UserService)):
      return await user_service.create_user(user)

    @self.router.post("/login", summary="登录")
    # @log_api_call
    async def login_user(
        user: UserLogin = Depends(UserLogin.as_form),
        user_service: UserService = Depends(UserService)
    ):
      return await user_service.authenticate_user(user)

    @self.router.post("/token", summary="获取token")
    # @log_api_call
    async def get_token(
        user: UserLogin = Depends(UserLogin.as_form),
        user_service: UserService = Depends(UserService)
    ):
      data = await user_service.authenticate_user(user)
      return token_response(access_token=data['access_token'], token_type=data['token_type'])

    @self.router.post("/refresh", summary="刷新访问令牌")
    async def refresh_token_route(
        refresh_token: str = Depends(get_refresh_token),
        user_service: UserService = Depends(UserService)
    ):
      return await user_service.refresh_token(refresh_token)

    @self.router.get("/userInfo", summary="获取当前用户信息")
    async def get_current_user_info(current_user=Depends(get_current_user)):
      # 查询用户排队次数
      queue_count = await QueueRecord.filter(
        queue_user_id=current_user.username,
        status=QueueStatusEnum.IN_QUEUE
      ).count()

      current_user.queue_count = queue_count
      current_user.follow_count = len(current_user.follow_user)
      return response(data=current_user)

    @self.router.post("/search", summary="模糊搜索用户信息")
    async def search_user(
        requests:UserSearch,
        user_service: UserService = Depends(UserService),
        current_user=Depends(get_current_user)
    ):
      return await user_service.search_member(requests.keyword, requests.user_type)

    @self.router.post("/generate-permanent-token", summary="生成永久token")
    async def generate_permanent_token(
        username: str,
        user_service: UserService = Depends(UserService),
        current_user=Depends(get_current_user)
    ):
      # 只有管理员可以为其他用户生成永久token，普通用户只能为自己生成
      if current_user.role != "admin" and current_user.username != username:
        return response(code=403, message="权限不足，只能为自己生成永久token")
      
      return await user_service.generate_permanent_token(username)

    @self.router.post("/generate-my-permanent-token", summary="为当前用户生成永久token")
    async def generate_my_permanent_token(
        user_service: UserService = Depends(UserService),
        current_user=Depends(get_current_user)
    ):
      return await user_service.generate_permanent_token(current_user.username)

    @self.router.get("/test", summary="测试")
    async def get_current_user2():
      return response(code=404, message="你可以啊")
# ✅ 显式暴露 router
user_controller = UserController()
router = user_controller.router