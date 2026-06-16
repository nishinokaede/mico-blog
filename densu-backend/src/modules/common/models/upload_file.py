from tortoise import fields
from tortoise.models import Model


class UploadFile(Model):
    """R2 上传文件记录"""

    id = fields.IntField(pk=True)
    key = fields.CharField(max_length=512, unique=True, description="R2 对象 key")
    url = fields.CharField(max_length=1024, description="公开访问地址")
    original_name = fields.CharField(max_length=255, null=True, description="原始文件名")
    file_type = fields.CharField(max_length=100, null=True, description="MIME 类型")
    uploader_id = fields.CharField(max_length=50, null=True, description="上传者用户名")
    created_at = fields.DatetimeField(auto_now_add=True)

    class Meta:
        table = "upload_file"
