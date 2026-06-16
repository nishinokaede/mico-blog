from fastapi import Request, HTTPException
from src.core.auth import get_current_user
from src.core.interfaces.response import response
from tortoise.transactions import in_transaction

from src.modules.common.models.api_call import ApiCall


async def auth_middleware(request: Request, call_next):
  # 允许访问的无认证路径（精确匹配）
  public_paths = [
      "/user/token", "/user/login", "/user/register", "/user/refresh", "/health",
  ]
  # 允许访问的无认证路径前缀（startswith 匹配）
  public_path_prefixes = ["/docs", "/redoc", "/openapi.json", "/mblog"]

  # ✅ 记录 API 访问次数
  path = request.url.path
  async with in_transaction():
    api_call = await ApiCall.get_or_none(api_url=path)
    if api_call:
      api_call.times += 1
      await api_call.save()
    else:
      await ApiCall.create(api_url=path, times=1)

  # ✅ 放行无需 token 的路径
  is_public = path in public_paths or any(path.startswith(p) for p in public_path_prefixes)

  if is_public:
    # 尝试从 token 中解析用户（可选认证）
    token = request.headers.get("Authorization")
    if token:
      try:
        token_parts = token.split()
        if len(token_parts) == 2 and token_parts[0].lower() == "bearer":
          user = await get_current_user(token_parts[1])
          request.state.user = user
      except Exception:
        pass  # token 无效也放行，只是没有用户信息
    return await call_next(request)

  token = request.headers.get("Authorization")
  if not token:
    return response(code=404, message="认证要求, 无token！")

  try:
    token_parts = token.split()
    if len(token_parts) != 2 or token_parts[0].lower() != "bearer":
      return response(code=404, message="无效的token格式")

    user = await get_current_user(token_parts[1])
    request.state.user = user
  except HTTPException as e:
    return response(code=404, message=f"错误-{e}")
  except Exception as e:
    return response(code=404, message="token错误！"+str(e))

  return await call_next(request)


def add_auth_middleware(app):
  app.middleware("http")(auth_middleware)
