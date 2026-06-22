from tortoise import fields
from tortoise.models import Model


class SiteConfig(Model):
    """系统设置（单行配置表）"""
    id = fields.IntField(pk=True, generated=True)
    logo_url = fields.CharField(max_length=512, null=True, description="网站左上角图标 URL")
    site_title = fields.CharField(max_length=128, null=True, description="网站标题")
    show_ip_device = fields.BooleanField(default=False, description="是否在卡片上展示发帖IP和设备信息")

    created_at = fields.DatetimeField(auto_now_add=True)
    updated_at = fields.DatetimeField(auto_now=True)

    class Meta:
        table = "site_config"
        default_connection = "default"
