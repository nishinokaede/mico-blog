"""公共模型"""
from datetime import datetime
from typing import Generic, Optional, TypeVar, List
from pydantic import BaseModel, Field

T = TypeVar("T")


class Response(BaseModel, Generic[T]):
  """
  Pydantic v2 中，直接从 BaseModel 继承并使用泛型
  """
  code: int = 200
  request_id: Optional[str] = None
  data: Optional[T] = None
  message: str = "请求成功"


class ReadBase(BaseModel):
  """数据读取的基类"""

  id: int
  status: int = Field(default=1, description="数据状态 1正常默认值 9 删除 5使用中 ")
  created: datetime
  modified: datetime


class LoginForm(BaseModel):
  """用户登录参数"""

  username: str = Field("admin", description="账号", max_length=12, min_length=3)
  password: str = Field("123456", description="密码", min_length=6, max_length=16)


class LoginResult(BaseModel):
  """登录响应模型"""

  id: int = Field(..., description="用户ID")
  token: str = Field(..., description="token 串")
  token_type: str = Field("Bearer", description="token 类型")


class QueryData(BaseModel):
  """分页查询基础数据"""

  page: int = Field(default=1, description="页码", ge=1)
  limit: int = Field(default=10, description="数量", ge=1)


class ListAll(BaseModel, Generic[T]):
  """查列表时的模型"""

  total: int = Field(..., description="总数")
  list: List[T] = Field(..., description="数据列表")
