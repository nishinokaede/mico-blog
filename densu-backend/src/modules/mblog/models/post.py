from tortoise import fields
from tortoise.models import Model


class MblogPost(Model):
    """
    微博帖子模型，存储用户发布的碎片化内容。

    字段说明:
    - id: 自增主键
    - content: Markdown 格式的帖子正文
    - tags: 从正文中提取的标签列表 (JSON 数组)
    - visibility: 可见性 (public / private)
    - views: 浏览次数
    - user_id: 关联的用户用户名 (对应 User 表的 username 主键)
    - created_at: 创建时间
    - updated_at: 最后更新时间
    """

    id = fields.IntField(pk=True, description="帖子ID")
    content = fields.TextField(description="Markdown 格式的帖子正文")
    tags = fields.JSONField(default=[], description="标签列表")
    images = fields.JSONField(default=[], description="图片URL列表")
    video = fields.CharField(max_length=512, null=True, description="视频URL")
    visibility = fields.CharField(max_length=16, default="public", description="可见性: public / private")
    views = fields.IntField(default=0, description="浏览次数")
    ip_address = fields.CharField(max_length=128, null=True, description="发帖IP地理位置")
    device = fields.CharField(max_length=256, null=True, description="发帖设备信息")
    user_id = fields.CharField(max_length=255, null=True, description="关联用户用户名")
    is_pinned = fields.BooleanField(default=False, description="是否置顶")
    pinned_at = fields.DatetimeField(null=True, description="置顶时间")

    created_at = fields.DatetimeField(auto_now_add=True, description="创建时间")
    updated_at = fields.DatetimeField(auto_now=True, description="更新时间")

    class Meta:
        table = "mblog_posts"
        default_connection = "default"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Post#{self.id} by {self.user_id}"
