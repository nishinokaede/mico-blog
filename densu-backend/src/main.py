from dotenv import load_dotenv
load_dotenv()  # 必须在其他导入之前加载 .env，确保 JWT SECRET_KEY 等环境变量可用

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from tortoise.contrib.fastapi import register_tortoise

from src.core.interfaces.response import response
from src.core.logger_middleware import LoggingMiddleware
from src.core.auth_middleware import add_auth_middleware
from src.core.custom_response import CustomJSONResponse
from src.core.dbConfig import TORTOISE_ORM
from src.core.load_routers import register_routes

app = FastAPI(
    title="densu-backend",
    description="densu自己的后端",
    version="0.0.1",
    default_response_class=CustomJSONResponse,
    # Swagger UI 配置
    docs_url="/docs",  # Swagger UI的访问地址
    redoc_url="/redoc",  # ReDoc文档的访问地址
    openapi_url="/openapi.json"  # OpenAPI架构的地址
)

# 注册数据库
register_tortoise(
    app=app,
    config=TORTOISE_ORM,
    generate_schemas=False,  # 关闭自动 schema 生成，手动管理数据库迁移
    # add_exception_handlers=True,  # 生产环境不要开，会泄露调试信息
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许的来源列表
    allow_credentials=True,  # 是否允许证书（cookies等）
    allow_methods=["*"],  # 允许所有HTTP方法
    allow_headers=["*"],  # 允许所有的头部信息
)

# 添加认证中间件
app.add_middleware(LoggingMiddleware)
add_auth_middleware(app)

# 健康检查端点
@app.get("/health")
async def health_check():
    """健康检查端点"""
    return response(message='Queue Backend is running')

# 自动注册路由
register_routes(app)
