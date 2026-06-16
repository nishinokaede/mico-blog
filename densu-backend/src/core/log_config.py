import logging
import os
from logging.handlers import TimedRotatingFileHandler


def setup_logger(name, log_file, level=logging.INFO):
  """设置按天轮转日志的记录器，保留30天"""

  formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(pathname)s - %(lineno)d - %(message)s')

  # 按天轮换日志，每天创建一个新文件，最多保留30天
  handler = TimedRotatingFileHandler(log_file, when='midnight', interval=1, backupCount=30, encoding='utf-8', utc=False)
  handler.setFormatter(formatter)
  handler.suffix = "%Y-%m-%d.log"  # 设置文件名后缀

  logger = logging.getLogger(name)
  logger.setLevel(level)

  # 防止重复添加 handler（例如在 FastAPI 中多次导入模块）
  if not logger.hasHandlers():
    logger.addHandler(handler)

  print(f"Logger '{name}' 设置完成。日志文件: {log_file}")
  return logger


# 确保日志目录存在
log_dir = "logs"
os.makedirs(log_dir, exist_ok=True)
print(f"已创建/检查日志目录: {log_dir}")

# 创建日志器
# api_logger = setup_logger('api_logger', os.path.join(log_dir, 'api'))
error_logger = setup_logger('error_logger', os.path.join(log_dir, 'error'), level=logging.ERROR)
system_logger = setup_logger('system_logger', os.path.join(log_dir, 'system'))
integration_logger = setup_logger('integration_logger', os.path.join(log_dir, 'integration'))

print("记录器设置完成.")
