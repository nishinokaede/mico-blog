import json
import time
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.types import ASGIApp

from src.core.log_config import error_logger
from src.modules.common.models.api_log import APILog


class LoggingMiddleware(BaseHTTPMiddleware):
  def __init__(self, app: ASGIApp):
    super().__init__(app)

  async def dispatch(self, request: Request, call_next):
    # 如果时基础API请求，直接放行
    public_paths = ["/health"]

    if request.url.path in public_paths:
      return await call_next(request)
    start_time = time.time()
    # 获取客户端IP和User-Agent
    client_ip = (
        request.headers.get("x-forwarded-for", "").split(",")[0]
        or request.headers.get("x-real-ip")
        or request.client.host
    )
    body = await request.body()
    request_body = body.decode("utf-8") if body else None

    # 响应前先记录原始请求内容
    request_info = {
      "method": request.method,
      "url": str(request.url),
      "headers": dict(request.headers),
      "body": request_body,
      "custom_user_id": request.headers.get("X-User-Id", "anonymous"),
      "custom_trace_id": request.headers.get("X-Trace-Id", "none"),
      "custom_request_id": request.headers.get("X-Request-Id", "none"),
    }

    response = await call_next(request)

    response_body = b""
    async for chunk in response.body_iterator:
      response_body += chunk
    response.body_iterator = iterate_in_chunks(response_body)

    try:
      decoded_response = response_body.decode()
    except:
      decoded_response = "<non-text-response>"

    duration_ms = int((time.time() - start_time) * 1000)
    try:
      # 异步插入数据库
      await APILog.create(
        type="api_log",  # 可根据路径或业务逻辑设置
        method=request.method,
        url=str(request.url),
        request_headers=json.dumps(dict(request.headers), ensure_ascii=False),
        request_body=request_body,
        response_status=str(response.status_code),
        response_body=decoded_response,
        client_ip=client_ip,
        biz_key1=request_info["custom_user_id"],
        biz_key2=None,  # 可自定义提取
        biz_key3=None,  # 可自定义提取
        duration_ms=duration_ms,
        trace_id=request_info["custom_trace_id"],
        request_id=request_info["custom_request_id"]
      )
    except Exception as e:
      error_logger.error(f"Error logging API request: {e}")
    return response


async def iterate_in_chunks(data: bytes, chunk_size: int = 4096):
  for i in range(0, len(data), chunk_size):
    yield data[i:i + chunk_size]
