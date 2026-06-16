"""
R2 CORS 配置脚本 —— 运行一次即可，允许前端 localhost 直传文件到 R2。

用法:
    poetry run python scripts/configure_r2_cors.py
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# 加载环境变量
env_file = os.getenv('DB_ENV_FILE', '.env')
load_dotenv(dotenv_path=Path(__file__).parent.parent / env_file)

import boto3
from botocore.config import Config

# ── R2 连接 ────────────────────────────────────────────
api_key = os.getenv("R2_API_KEY")
api_secret = os.getenv("R2_API_SECRET")
bucket_url = os.getenv("R2_BUCKET_URL")
bucket_name = os.getenv("R2_BUCKET_NAME")

if not all([api_key, api_secret, bucket_url, bucket_name]):
    print("❌ R2 环境变量未配置，请检查 .env 文件")
    sys.exit(1)

client = boto3.client(
    "s3",
    endpoint_url=bucket_url,
    aws_access_key_id=api_key,
    aws_secret_access_key=api_secret,
    region_name="auto",
    config=Config(signature_version="s3v4"),
)

# ── CORS 配置 ──────────────────────────────────────────
cors_config = {
    "CORSRules": [
        {
            "AllowedOrigins": [
                "*",   # 允许所有来源
            ],
            "AllowedMethods": ["GET", "HEAD", "PUT"],
            "AllowedHeaders": ["Content-Type"],
            "ExposeHeaders": ["ETag"],
            "MaxAgeSeconds": 3600,
        }
    ]
}

try:
    client.put_bucket_cors(Bucket=bucket_name, CORSConfiguration=cors_config)
    print("✅ R2 CORS 配置成功！")
    print(f"   Bucket: {bucket_name}")
    print(f"   AllowedOrigins: {', '.join(cors_config['CORSRules'][0]['AllowedOrigins'])}")
except Exception as e:
    print(f"❌ CORS 配置失败: {e}")
    sys.exit(1)
