import os
from dotenv import load_dotenv
from pathlib import Path

# 动态加载指定的 .env 文件
env_file = os.getenv('DB_ENV_FILE', '.env')  # 默认使用项目根目录的 .env
load_dotenv(dotenv_path=Path(env_file))

TORTOISE_ORM = {
    "connections": {
        "default": {
            "engine": "tortoise.backends.asyncpg",
            "credentials": {
                "host": os.getenv("DB_HOST"),
                "port": int(os.getenv("DB_PORT", 5432)),
                "user": os.getenv("DB_USER"),
                "password": os.getenv("DB_PASSWORD"),
                "database": os.getenv("DB_NAME"),
                "minsize": int(os.getenv("DB_MINSIZE", 1)),
                "maxsize": int(os.getenv("DB_MAXSIZE", 5)),
                "ssl": False,
            },
            "echo": os.getenv("DB_ECHO", "False").lower() == "true"
        }
    },
    "apps": {
        "models": {
            "models": [
                'src.modules.user.models.user',
                'src.modules.common.models.api_call',
                'src.modules.common.models.api_log',
                'src.modules.common.models.upload_file',
                'src.modules.mblog.models.post',
                'src.modules.queue.models.queue',
            ],
            "default_connection": "default",
        }
    },
    "use_tz": False,
    "timezone": "Asia/Shanghai"
}
