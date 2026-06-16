from tortoise import fields, models
from tortoise.contrib.pydantic import pydantic_model_creator


class APILog(models.Model):
  id = fields.IntField(pk=True)
  type = fields.CharField(max_length=50, null=True)  # 接口类型，如：用户、群组等
  method = fields.CharField(max_length=10,null=True)
  url = fields.TextField(null=True)
  request_headers = fields.TextField(null=True)
  request_body = fields.TextField(null=True)

  response_status = fields.CharField(max_length=10,null=True)
  response_body = fields.TextField(null=True)
  client_ip = fields.CharField(max_length=50, null=True)
  # 自定义业务字段
  biz_key1 = fields.CharField(max_length=255, null=True)
  biz_key2 = fields.TextField(null=True)
  biz_key3 = fields.TextField(null=True)

  duration_ms = fields.IntField(null=True)  # 请求耗时
  trace_id = fields.CharField(max_length=255, null=True)
  request_id = fields.CharField(max_length=255, null=True)

  created = fields.DatetimeField(auto_now_add=True, null=True)
  updated = fields.DatetimeField(auto_now=True, null=True)

  class Meta:
    table = "api_log"
    ordering = ["-created_at"]


