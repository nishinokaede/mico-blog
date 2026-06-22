from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


# ── 帖子创建请求 ──────────────────────────────────────────

class PostCreate(BaseModel):
    """
    创建帖子的请求体。
    content 为 Markdown 正文，tags 和 visibility 可选。
    """
    content: str = Field(..., description="Markdown 格式的帖子正文")
    tags: List[str] = Field(default_factory=list, description="标签列表")
    images: List[str] = Field(default_factory=list, description="图片URL列表")
    video: Optional[str] = Field(default=None, description="视频URL")
    visibility: str = Field(default="public", description="可见性: public / private")


# ── 帖子更新请求 ──────────────────────────────────────────

class PostUpdate(BaseModel):
    """
    更新帖子的请求体，所有字段可选。
    """
    content: Optional[str] = Field(default=None, description="Markdown 正文")
    tags: Optional[List[str]] = Field(default=None, description="标签列表")
    images: Optional[List[str]] = Field(default=None, description="图片URL列表")
    video: Optional[str] = Field(default=None, description="视频URL")
    visibility: Optional[str] = Field(default=None, description="可见性")
    views: Optional[int] = Field(default=None, description="浏览次数")


# ── 帖子响应 ──────────────────────────────────────────────

class PostInDB(BaseModel):
    """
    帖子的完整响应模型，用于序列化返回。
    """
    id: int
    content: str
    tags: List[str] = []
    images: List[str] = []
    video: Optional[str] = None
    visibility: str = "public"
    views: int = 0
    ip_address: Optional[str] = None
    device: Optional[str] = None
    user_id: Optional[str] = None
    is_pinned: bool = False
    pinned_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class PostListResponse(BaseModel):
    """分页帖子列表响应"""
    list: List[PostInDB] = Field(default_factory=list, description="帖子列表")
    total: int = Field(default=0, description="总数")


# ── 搜索参数 ──────────────────────────────────────────────

class PostSearchParams(BaseModel):
    """
    帖子搜索 / 筛选参数，所有字段可选。
    """
    tag: Optional[str] = Field(default=None, description="按标签筛选")
    visibility: Optional[str] = Field(default=None, description="按可见性筛选: all / public / private")
    content: Optional[str] = Field(default=None, description="正文模糊搜索关键词")
    start_date: Optional[str] = Field(default=None, description="起始日期 YYYY-MM-DD")
    end_date: Optional[str] = Field(default=None, description="结束日期 YYYY-MM-DD")


# ── 标签响应 ──────────────────────────────────────────────

class TagInDB(BaseModel):
    """
    标签及使用次数。
    """
    name: str
    count: int


# ── 统计响应 ──────────────────────────────────────────────

class StatsResponse(BaseModel):
    """
    首页统计信息。
    """
    memo_count: int = Field(default=0, description="帖子总数")
    tag_count: int = Field(default=0, description="标签种类数")
    day_count: int = Field(default=0, description="连续记录天数")
    heatmap: List[dict] = Field(default_factory=list, description="热力图数据 [{date, count}]")


# ── 用户配置更新 ──────────────────────────────────────────

class UserProfileUpdate(BaseModel):
    """
    更新当前用户配置的请求体。
    """
    nickname: Optional[str] = Field(default=None, description="昵称")
    avatar: Optional[str] = Field(default=None, description="头像 URL")
    email: Optional[str] = Field(default=None, description="邮箱")
    bio: Optional[str] = Field(default=None, description="个人介绍")
    default_visibility: Optional[str] = Field(default=None, description="默认可见性")
    password: Optional[str] = Field(default=None, description="新密码，留空不修改")


# ── 系统设置更新 ──────────────────────────────────────────

class SiteConfigUpdate(BaseModel):
    """
    更新系统设置的请求体。
    """
    logo_url: Optional[str] = Field(default=None, description="网站图标 URL")
    site_title: Optional[str] = Field(default=None, description="网站标题")
    show_ip_device: Optional[bool] = Field(default=None, description="是否展示发帖IP和设备信息")
