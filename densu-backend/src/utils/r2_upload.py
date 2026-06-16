import os
import uuid
from datetime import datetime

import boto3
from botocore.config import Config


class R2Uploader:
    """Cloudflare R2 文件上传服务"""

    def __init__(self):
        self.api_key = os.getenv("R2_API_KEY")
        self.api_secret = os.getenv("R2_API_SECRET")
        self.region = os.getenv("R2_REGION", "auto")
        self.bucket_name = os.getenv("R2_BUCKET_NAME")
        self.bucket_url = os.getenv("R2_BUCKET_URL")
        self.base_url = os.getenv("R2_BASE_URL")

        self.client = boto3.client(
            "s3",
            endpoint_url=self.bucket_url,
            aws_access_key_id=self.api_key,
            aws_secret_access_key=self.api_secret,
            region_name=self.region,
            config=Config(signature_version="s3v4"),
        )

    def generate_presigned_upload_url(self, key: str, expires_in: int = 3600) -> str:
        """生成预签名上传 URL"""
        return self.client.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": self.bucket_name,
                "Key": key,
            },
            ExpiresIn=expires_in,
        )

    @staticmethod
    def generate_key(prefix: str, file_extension: str) -> str:
        """生成唯一的对象 key"""
        now = datetime.now()
        date_path = now.strftime("%Y/%m/%d")
        unique_id = uuid.uuid4().hex[:16]
        return f"{prefix}/{date_path}/{unique_id}{file_extension}"

    def get_public_url(self, key: str) -> str:
        """根据 key 构造公开访问 URL"""
        return f"{self.base_url}/{key}"
