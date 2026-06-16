from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict
from fastapi import Form


class UserCreate(BaseModel):
  username: str
  nickname: Optional[str] = None
  password: str


class UserRead(BaseModel):
  username: str
  nickname: Optional[str] = None

  # 更新为 Pydantic v2 的配置方式
  model_config = ConfigDict(from_attributes=True)  # 替代原来的 orm_mode


class UserLogin(BaseModel):
  username: str
  password: str

  @classmethod
  def as_form(
      cls,
      username: str = Form(...),
      password: str = Form(...)
  ):
    return cls(username=username, password=password)


class UserInDB(BaseModel):
  username: str
  nickname: Optional[str] = None
  email: Optional[str]
  avatar: Optional[str]
  phone: Optional[str]
  description: Optional[str]
  role: Optional[str]
  is_superuser: Optional[bool]
  is_verified: Optional[bool]
  is_active: Optional[bool]
  group_id: Optional[int]
  created: Optional[datetime]
  updated: Optional[datetime]
  # 其他需要的字段...
  queue_count: Optional[int] = 0
  follow_count: Optional[int] = 0
  follow_user: Optional[list] = None

  model_config = ConfigDict(from_attributes=True)


class UserRoleEnum(str, Enum):
  USER = "普通用户"
  ADMIN = "群主管理员"
  MEMBER = "群组成员"
  SUPER_ADMIN = "超级管理员"


class UserSearch(BaseModel):
  keyword: Optional[str] = None
  user_type: Optional[UserRoleEnum] = None
