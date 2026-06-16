import logging

logger = logging.getLogger(__name__)


class COSUploader:
    """COS文件上传器（存根）"""

    async def upload_file_stream(self, file_stream, key: str) -> bool:
        """上传文件流到COS"""
        logger.warning(f"COS上传未配置，跳过上传: key={key}")
        return False
