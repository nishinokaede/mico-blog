FROM python:3.12-slim

WORKDIR /app

# 安装 poetry
RUN pip install poetry==1.8.3

# 复制依赖文件并安装
COPY pyproject.toml poetry.lock poetry.toml ./
RUN poetry config virtualenvs.create false && poetry install --no-interaction --no-ansi --no-root

# 复制源代码
COPY src/ ./src/
COPY scripts/ ./scripts/

# 暴露端口
EXPOSE 8005

# 启动服务
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8005"]
