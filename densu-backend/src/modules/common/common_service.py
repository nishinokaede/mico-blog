import os
from fastapi import Depends, status
from src.core.interfaces.response import response
from src.core.log_config import error_logger, system_logger
from src.modules.user.models import User
from src.core.jwt import TokenManager, JWTTokenManager
from src.modules.common.schemas.common import (
    FileCreate,
    GetUploadUrlRequest,
    GetUploadUrlResponse,
    ConfirmUploadRequest,
    ConfirmUploadResponse,
)
from src.modules.common.models.upload_file import UploadFile
from src.utils import UUIDGenerator
from src.utils.upload_cos import COSUploader
from src.utils.r2_upload import R2Uploader


class CommonService:
  def __init__(
      self,
      token_manager: TokenManager = Depends(JWTTokenManager)
  ):
    """
    初始化UserService实例。

    Args:
        token_manager (TokenManager): 用于处理JWT令牌的创建和验证的管理器。
    """
    self.token_manager = token_manager

  @staticmethod
  async def upload_file(upload_file: FileCreate, file, user: User):
    """
    上传文件接口

      Args:
        upload_file:上传的文件的参数
        file:上传的文件
        user:通过token拿到的用户

      Returns:
        dict: 返回的信息
    """
    uuid = UUIDGenerator.generate_time_based_uuid()

    file_extension = os.path.splitext(file.filename)[1].lower()
    key = f"{upload_file.type}/{uuid}{file_extension}"
    is_success = await COSUploader().upload_file_stream(file.file, key)
    if is_success:
      file_url = f"https://queue-test-1318630772.cos.ap-shanghai.myqcloud.com/{key}"
      if upload_file.type == "avatar":
        user.avatar = file_url
        await user.save()
        system_logger.info(f"{user.username}上传头像成功: {file_url}")
      system_logger.info(f"{user.username}上传文件成功: {file_url}")
      return response(message="上传成功", data=file_url)
    else:
      error_logger.error(f"{user.username}上传文件失败")
      return response(code=status.HTTP_500_INTERNAL_SERVER_ERROR, message="上传失败")

  @staticmethod
  async def get_upload_url(request: GetUploadUrlRequest, user: User):
    """获取 R2 预签名上传 URL"""
    file_extension = os.path.splitext(request.file_name)[1].lower()
    if not file_extension:
      return response(code=status.HTTP_400_BAD_REQUEST, message="文件名缺少扩展名")

    r2 = R2Uploader()
    key = r2.generate_key(request.prefix, file_extension)
    upload_url = r2.generate_presigned_upload_url(key)
    public_url = r2.get_public_url(key)

    system_logger.info(f"{user.username} 获取上传URL: key={key}")
    return response(data={
        "upload_url": upload_url,
        "key": key,
        "public_url": public_url,
    })

  @staticmethod
  async def confirm_upload(request: ConfirmUploadRequest, user: User):
    """确认上传完成，保存文件记录"""
    r2 = R2Uploader()
    public_url = r2.get_public_url(request.key)

    record = await UploadFile.create(
        key=request.key,
        url=public_url,
        original_name=request.original_name,
        file_type=request.file_type,
        uploader_id=user.username,
    )

    system_logger.info(f"{user.username} 确认上传: key={request.key}, url={public_url}")
    return response(data={
        "id": record.id,
        "key": record.key,
        "url": record.url,
        "original_name": record.original_name,
    })
