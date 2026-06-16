import requests
import time
import logging
import json

from core.log_config import integration_logger
from modules.common.models.api_log import APILog

logger = logging.getLogger("http_client")
logging.basicConfig(level=logging.INFO)


class HTTPClient:
  def __init__(self, base_url=None, timeout=30):
    self.base_url = base_url or ""
    self.timeout = timeout
    self.session = requests.Session()

  async def request(
      self,
      method: str,
      url: str,
      headers: dict = None,
      params: dict = None,
      json_body: dict = None,
      custom_info: dict = None
  ):
    full_url = self.base_url + url
    start_time = time.time()

    try:
      response = self.session.request(
        method=method,
        url=full_url,
        headers=headers,
        params=params,
        json=json_body,
        timeout=self.timeout,
      )
      duration = time.time() - start_time

      log_data = {
        "method": method,
        "url": full_url,
        "headers": headers,
        "params": params,
        "body": json_body,
        "status_code": response.status_code,
        "response": response.text,
        "duration_ms": int(duration * 1000),
        "custom_info": custom_info or {},
      }

      integration_logger.info(json.dumps(log_data, ensure_ascii=False, indent=2))
      response.raise_for_status()
      try:

        # 保存日志到数据库
        await APILog.create(
          method=method,
          type="integration",
          url=str(full_url),
          request_headers=str(headers) if headers else None,
          request_body=str(json_body) if json_body else None,
          response_status=response.status_code,
          biz_key1=response.headers.get("bizKey1") or None,
          biz_key2=response.headers.get("bizKey2") or None,
          biz_key3=response.headers.get("bizKey3") or None,
          duration_ms=int(duration * 1000),
          trace_id=headers.get("X-Trace-Id") or None,
          request_id=headers.get("X-Request-Id") or None,
        )
      except Exception as e:
        integration_logger.error(f"Failed to save API log: {e}")
      return response
    except requests.RequestException as e:
      integration_logger.error(f"Request error: {e}")
      raise
