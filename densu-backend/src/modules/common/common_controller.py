import json

from fastapi import APIRouter, Depends, UploadFile, File, Form

from src.modules.common.common_service import CommonService
from src.modules.common.schemas.common import (
    FileCreate,
    GetUploadUrlRequest,
    ConfirmUploadRequest,
)
from src.modules.user.models import User
from src.core.auth import get_current_user


class CommonController:
  def __init__(self):
    self.router = APIRouter(prefix="/common", tags=["通用模块"])

    @self.router.post("/upload_file", summary="上传文件")
    async def upload_file_api(
        upload_file: str = Form(...),
        file: UploadFile = File(...),
        user: User = Depends(get_current_user),
    ):
      upload_file_data = FileCreate(**json.loads(upload_file))
      return await CommonService.upload_file(upload_file_data, file, user)

    @self.router.post("/get_upload_url", summary="获取R2上传URL")
    async def get_upload_url(
        request: GetUploadUrlRequest,
        user: User = Depends(get_current_user),
    ):
      return await CommonService.get_upload_url(request, user)

    @self.router.post("/confirm_upload", summary="确认R2上传完成")
    async def confirm_upload(
        request: ConfirmUploadRequest,
        user: User = Depends(get_current_user),
    ):
      return await CommonService.confirm_upload(request, user)


common_controller = CommonController()
router = common_controller.router
