from fastapi import APIRouter, Depends, Query, Request
from typing import Optional
from pydantic import BaseModel, Field

from src.core.interfaces.response import response
from src.core.auth import get_optional_user, get_current_user
from src.modules.mblog.mblog_service import MblogService
from src.modules.mblog.schemas.post import (
    PostCreate,
    PostUpdate,
    PostSearchParams,
    UserProfileUpdate,
    SiteConfigUpdate,
)
from src.modules.user.schemas.user import UserInDB


class UploadUrlRequest(BaseModel):
    """获取上传 URL 请求体"""
    file_name: str = Field(..., description="文件名")
    file_type: Optional[str] = Field(default=None, description="MIME 类型")
    upload_type: str = Field(default="post", description="上传类型: avatar / post")


class ConfirmUploadRequest(BaseModel):
    """确认上传请求体"""
    key: str = Field(..., description="R2 对象 key")
    original_name: Optional[str] = Field(default=None, description="原始文件名")
    upload_type: str = Field(default="post", description="上传类型: avatar / post")


class MblogController:
    """
    微博模块控制器 —— 注册所有 /mblog 路由。
    """

    def __init__(self):
        self.router = APIRouter(prefix="/mblog", tags=["微博模块"])

        # ── 帖子读取（可选认证：已登录用户看全部，游客只看 public） ──

        @self.router.get("/posts", summary="获取帖子列表")
        async def list_posts(
            visibility: Optional[str] = Query(default=None),
            page: int = Query(default=1, ge=1, description="页码"),
            page_size: int = Query(default=20, ge=1, le=100, description="每页数量"),
            current_user: Optional[UserInDB] = Depends(get_optional_user),
        ):
            return await MblogService.get_posts(
                visibility=visibility,
                page=page,
                page_size=page_size,
                current_user=current_user,
            )

        @self.router.get("/posts/{post_id}", summary="获取单条帖子")
        async def get_post(
            post_id: int,
            current_user: Optional[UserInDB] = Depends(get_optional_user),
        ):
            return await MblogService.get_post_by_id(post_id, current_user=current_user)

        # ── 帖子写入（必须登录） ───────────────────────────────

        @self.router.post("/posts", summary="发布帖子")
        async def create_post(
            data: PostCreate,
            request: Request,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.create_post(data, current_user=current_user, request=request)

        @self.router.put("/posts/{post_id}", summary="更新帖子")
        async def update_post(
            post_id: int,
            data: PostUpdate,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.update_post(post_id, data, current_user=current_user)

        @self.router.delete("/posts/{post_id}", summary="删除帖子")
        async def delete_post(
            post_id: int,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.delete_post(post_id, current_user=current_user)

        # ── 置顶/取消置顶（必须登录） ─────────────────────────

        @self.router.post("/posts/{post_id}/toggle-pin", summary="置顶/取消置顶帖子")
        async def toggle_pin(
            post_id: int,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.toggle_pin(post_id, current_user=current_user)

        # ── 搜索（可选认证） ───────────────────────────────────

        @self.router.get("/search", summary="搜索帖子")
        async def search_posts(
            tag: Optional[str] = Query(default=None),
            visibility: Optional[str] = Query(default=None),
            content: Optional[str] = Query(default=None),
            start_date: Optional[str] = Query(default=None),
            end_date: Optional[str] = Query(default=None),
            current_user: Optional[UserInDB] = Depends(get_optional_user),
        ):
            params = PostSearchParams(
                tag=tag,
                visibility=visibility,
                content=content,
                start_date=start_date,
                end_date=end_date,
            )
            return await MblogService.search_posts(params, current_user=current_user)

        # ── 标签管理 ───────────────────────────────────────────

        @self.router.get("/tags", summary="获取所有标签")
        async def list_tags(
            current_user: Optional[UserInDB] = Depends(get_optional_user),
        ):
            return await MblogService.get_tags(current_user=current_user)

        @self.router.delete("/tags/{tag_name}", summary="删除标签")
        async def delete_tag(
            tag_name: str,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.delete_tag(tag_name, current_user=current_user)

        # ── 统计（可选认证） ───────────────────────────────────

        @self.router.get("/stats", summary="获取统计数据")
        async def get_stats(
            current_user: Optional[UserInDB] = Depends(get_optional_user),
        ):
            return await MblogService.get_stats(current_user=current_user)

        # ── 文件上传（必须登录） ────────────────────────────────

        @self.router.post("/upload-url", summary="获取上传URL")
        async def get_upload_url(
            data: UploadUrlRequest,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.get_upload_url(data.file_name, data.file_type, data.upload_type)

        @self.router.post("/confirm-upload", summary="确认上传完成")
        async def confirm_upload(
            data: ConfirmUploadRequest,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.confirm_upload(data.key, data.original_name, data.upload_type)

        # ── 用户配置（必须登录） ────────────────────────────────

        @self.router.get("/user", summary="获取用户配置")
        async def get_user_profile(
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.get_user_profile(current_user=current_user)

        @self.router.put("/user", summary="更新用户配置")
        async def update_user_profile(
            data: UserProfileUpdate,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.update_user_profile(data, current_user=current_user)

        # ── 系统设置（读取公开，写入需登录） ──────────────────

        @self.router.get("/site-config", summary="获取系统设置")
        async def get_site_config():
            return await MblogService.get_site_config()

        @self.router.put("/site-config", summary="更新系统设置")
        async def update_site_config(
            data: SiteConfigUpdate,
            current_user: UserInDB = Depends(get_current_user),
        ):
            return await MblogService.update_site_config(data)


# ✅ 显式暴露 router（auto-routing 机制依赖此变量）
mblog_controller = MblogController()
router = mblog_controller.router
