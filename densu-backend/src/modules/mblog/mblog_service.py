import os
from datetime import datetime, timedelta
from typing import Optional, List

from tortoise.expressions import Q

from src.core.interfaces.response import response
from src.core.log_config import error_logger, system_logger
from src.utils.r2_upload import R2Uploader
from src.modules.mblog.models.post import MblogPost
from src.modules.mblog.schemas.post import (
    PostCreate,
    PostUpdate,
    PostInDB,
    PostSearchParams,
    StatsResponse,
    UserProfileUpdate,
)
from src.modules.user.models import User
from src.modules.user.schemas.user import UserInDB


def _get_user_id(current_user: Optional[UserInDB]) -> Optional[str]:
    """从 UserInDB 或 None 提取 username"""
    return current_user.username if current_user else None


def _visible_to(posts, current_user: Optional[UserInDB]) -> list:
    """
    根据用户认证状态过滤帖子可见性。
    - 已登录：返回自己所有帖子（public + private）
    - 未登录：只返回 public 帖子
    """
    uid = _get_user_id(current_user)
    result = []
    for p in posts:
        if p.visibility == "public" or (uid and p.user_id == uid):
            result.append(p)
    return result


class MblogService:
    """
    微博服务类，处理帖子 CRUD、搜索、标签管理与统计。
    """

    DEFAULT_USER = "densu"

    # ── 帖子 CRUD ──────────────────────────────────────────

    @staticmethod
    async def get_posts(
        visibility: Optional[str] = None,
        current_user: Optional[UserInDB] = None,
        limit: int = 100,
        offset: int = 0,
    ):
        uid = _get_user_id(current_user) or MblogService.DEFAULT_USER
        query = Q(user_id=uid)
        if visibility:
            query &= Q(visibility=visibility)

        posts = await MblogPost.filter(query).offset(offset).limit(limit).order_by("-created_at")
        visible_posts = _visible_to(posts, current_user)
        post_list = [PostInDB.model_validate(p) for p in visible_posts]
        return response(data=post_list)

    @staticmethod
    async def get_post_by_id(post_id: int, current_user: Optional[UserInDB] = None):
        post = await MblogPost.get_or_none(id=post_id)
        if not post:
            return response(code=404, message="帖子不存在")

        visible = _visible_to([post], current_user)
        if not visible:
            return response(code=404, message="帖子不存在或无权查看")

        return response(data=PostInDB.model_validate(post))

    @staticmethod
    async def create_post(data: PostCreate, current_user: UserInDB):
        uid = current_user.username or MblogService.DEFAULT_USER
        try:
            post = await MblogPost.create(
                content=data.content,
                tags=data.tags or [],
                images=data.images or [],
                video=data.video,
                visibility=data.visibility or "public",
                user_id=uid,
            )
            return response(data=PostInDB.model_validate(post), message="发布成功")
        except Exception as e:
            error_logger.error(f"创建帖子失败: {str(e)}")
            return response(code=500, message=f"发布失败: {str(e)}")

    @staticmethod
    async def update_post(post_id: int, data: PostUpdate, current_user: UserInDB):
        post = await MblogPost.get_or_none(id=post_id)
        if not post:
            return response(code=404, message="帖子不存在")
        if post.user_id != current_user.username:
            return response(code=403, message="无权修改他人帖子")

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            return response(data=PostInDB.model_validate(post))

        try:
            await post.update_from_dict(update_data).save()
            return response(data=PostInDB.model_validate(post), message="更新成功")
        except Exception as e:
            error_logger.error(f"更新帖子失败: {str(e)}")
            return response(code=500, message=f"更新失败: {str(e)}")

    @staticmethod
    async def delete_post(post_id: int, current_user: UserInDB):
        post = await MblogPost.get_or_none(id=post_id)
        if not post:
            return response(code=404, message="帖子不存在")
        if post.user_id != current_user.username:
            return response(code=403, message="无权删除他人帖子")

        try:
            await post.delete()
            return response(message="删除成功")
        except Exception as e:
            error_logger.error(f"删除帖子失败: {str(e)}")
            return response(code=500, message=f"删除失败: {str(e)}")

    # ── 搜索 ──────────────────────────────────────────────

    @staticmethod
    async def search_posts(params: PostSearchParams, current_user: Optional[UserInDB] = None):
        uid = _get_user_id(current_user) or MblogService.DEFAULT_USER
        query = Q(user_id=uid)

        if params.visibility and params.visibility != "all":
            query &= Q(visibility=params.visibility)

        if params.content:
            query &= Q(content__icontains=params.content)

        if params.start_date:
            try:
                start = datetime.strptime(params.start_date, "%Y-%m-%d")
                query &= Q(created_at__gte=start)
            except ValueError:
                pass

        if params.end_date:
            try:
                end = datetime.strptime(params.end_date, "%Y-%m-%d") + timedelta(days=1)
                query &= Q(created_at__lt=end)
            except ValueError:
                pass

        posts = await MblogPost.filter(query).order_by("-created_at")

        if params.tag:
            posts = [p for p in posts if params.tag in (p.tags or [])]

        visible_posts = _visible_to(posts, current_user)
        post_list = [PostInDB.model_validate(p) for p in visible_posts]
        return response(data=post_list)

    # ── 标签管理 ──────────────────────────────────────────

    @staticmethod
    async def get_tags(current_user: Optional[UserInDB] = None):
        uid = _get_user_id(current_user) or MblogService.DEFAULT_USER
        posts = await MblogPost.filter(user_id=uid).all()
        visible_posts = _visible_to(posts, current_user)

        tag_counts: dict[str, int] = {}
        for p in visible_posts:
            for tag in p.tags or []:
                if tag:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1

        tags = sorted(
            [{"name": k, "count": v} for k, v in tag_counts.items()],
            key=lambda x: x["count"],
            reverse=True,
        )
        return response(data=tags)

    @staticmethod
    async def delete_tag(tag_name: str, current_user: UserInDB):
        uid = current_user.username or MblogService.DEFAULT_USER
        posts = await MblogPost.filter(user_id=uid).all()

        updated = 0
        for p in posts:
            if tag_name in (p.tags or []):
                p.tags = [t for t in p.tags if t != tag_name]
                await p.save()
                updated += 1

        return response(
            data={"removed_from": updated},
            message=f"标签 #{tag_name} 已从 {updated} 条帖子中移除"
        )

    # ── 统计 ──────────────────────────────────────────────

    @staticmethod
    async def get_stats(current_user: Optional[UserInDB] = None):
        uid = _get_user_id(current_user) or MblogService.DEFAULT_USER
        posts = await MblogPost.filter(user_id=uid).order_by("-created_at").all()
        visible_posts = _visible_to(posts, current_user)

        memo_count = len(visible_posts)

        tag_set: set[str] = set()
        for p in visible_posts:
            for t in p.tags or []:
                if t:
                    tag_set.add(t)
        tag_count = len(tag_set)

        day_count = 0
        today = datetime.now().date()
        for i in range(365):
            check_date = today - timedelta(days=i)
            has_post = any(
                p.created_at and p.created_at.date() == check_date for p in visible_posts
            )
            if has_post:
                day_count += 1
            else:
                break

        heatmap = []
        for i in range(42):
            d = today - timedelta(days=41 - i)
            count = sum(
                1 for p in visible_posts
                if p.created_at and p.created_at.date() == d
            )
            heatmap.append({"date": d.strftime("%Y-%m-%d"), "count": count})

        stats = StatsResponse(
            memo_count=memo_count,
            tag_count=tag_count,
            day_count=day_count,
            heatmap=heatmap,
        )
        return response(data=stats)

    # ── 文件上传 ──────────────────────────────────────────

    @staticmethod
    async def get_upload_url(file_name: str, file_type: Optional[str] = None, upload_type: str = "post"):
        file_extension = os.path.splitext(file_name)[1].lower()
        if not file_extension:
            return response(code=400, message="文件名缺少扩展名")

        # 根据类型选择前缀: avatar -> avatar, post -> post
        prefix = "avatar" if upload_type == "avatar" else "post"

        try:
            r2 = R2Uploader()
            key = r2.generate_key(prefix, file_extension)
            upload_url = r2.generate_presigned_upload_url(key)
            public_url = r2.get_public_url(key)
            system_logger.info(f"获取上传URL: type={upload_type}, key={key}")
            return response(data={
                "upload_url": upload_url,
                "key": key,
                "public_url": public_url,
            })
        except Exception as e:
            error_logger.error(f"获取上传URL失败: {str(e)}")
            return response(code=500, message=f"上传服务暂不可用: {str(e)}")

    @staticmethod
    async def confirm_upload(key: str, original_name: Optional[str] = None, upload_type: str = "post"):
        try:
            r2 = R2Uploader()
            public_url = r2.get_public_url(key)

            # 仅头像类型需要更新用户 avatar 字段
            if upload_type == "avatar":
                user = await User.get_or_none(username=MblogService.DEFAULT_USER)
                if user:
                    user.avatar = public_url
                    await user.save()
                    system_logger.info(f"用户 {MblogService.DEFAULT_USER} 更新头像: {public_url}")

            return response(data={"url": public_url})
        except Exception as e:
            error_logger.error(f"确认上传失败: {str(e)}")
            return response(code=500, message=f"上传确认失败: {str(e)}")

    # ── 用户配置 ──────────────────────────────────────────

    @staticmethod
    async def get_user_profile(current_user: UserInDB):
        user = await User.get_or_none(username=current_user.username)
        if not user:
            return response(code=404, message=f"用户 {current_user.username} 不存在")

        return response(data={
            "nickname": user.nickname or current_user.username,
            "avatar": user.avatar or "",
            "email": user.email or "",
            "bio": user.description or "",
            "default_visibility": "public",
        })

    @staticmethod
    async def update_user_profile(data: UserProfileUpdate, current_user: UserInDB):
        user = await User.get_or_none(username=current_user.username)
        if not user:
            return response(code=404, message=f"用户 {current_user.username} 不存在")

        update_data = data.model_dump(exclude_unset=True)
        password = update_data.pop("password", None)
        bio = update_data.pop("bio", None)
        update_data.pop("default_visibility", None)

        if "nickname" in update_data:
            user.nickname = update_data["nickname"]
        if "avatar" in update_data:
            user.avatar = update_data["avatar"]
        if "email" in update_data:
            user.email = update_data["email"]
        if bio is not None:
            user.description = bio

        try:
            await user.save()
            return response(message="保存成功")
        except Exception as e:
            error_logger.error(f"更新用户配置失败: {str(e)}")
            return response(code=500, message=f"保存失败: {str(e)}")
