from typing import Optional

from pydantic import BaseModel, ConfigDict
from enum import Enum


class CommonType(str, Enum):
  GROUP = "群组"
  USER = "用户"


class FileCreate(BaseModel):
  user_id: Optional[int] = None
  upload_key: Optional[str] = None
  type: Optional[str] = None


class GetUploadUrlRequest(BaseModel):
  file_name: str
  file_type: Optional[str] = None
  prefix: str = "common"


class GetUploadUrlResponse(BaseModel):
  upload_url: str
  key: str
  public_url: str


class ConfirmUploadRequest(BaseModel):
  key: str
  original_name: Optional[str] = None
  file_type: Optional[str] = None


class ConfirmUploadResponse(BaseModel):
  id: int
  key: str
  url: str
  original_name: Optional[str] = None
