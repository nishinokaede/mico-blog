from tortoise import fields
from tortoise.models import Model


class User(Model):
  username = fields.CharField(max_length=255, pk=True, description="用户名，作为主键")
  nickname = fields.CharField(max_length=255, null=True, description="用户昵称，用于显示")
  group_id = fields.IntField(null=True, description="关联的用户组id")
  username_pinyin = fields.CharField(max_length=255, null=True)
  password = fields.CharField(max_length=128)
  is_superuser = fields.BooleanField(default=False, null=True, description='群组的管理员字段')
  is_verified = fields.BooleanField(default=False, null=True)
  email = fields.CharField(max_length=255, null=True)
  avatar = fields.CharField(max_length=255, null=True)
  phone = fields.CharField(max_length=255, null=True)
  description = fields.TextField(null=True)
  most_love_user = fields.CharField(max_length=255, null=True, description='用户最爱的用户username')
  top_user = fields.JSONField(null=True,default=[], description='用户选择置顶的用户username列表')
  follow_user = fields.JSONField(null=True,default=[], description='用户关注的用户username列表')
  role = fields.CharField(max_length=128, null=True, default='普通用户')

  created = fields.DatetimeField(auto_now_add=True, null=True)
  updated = fields.DatetimeField(auto_now=True, null=True)
  is_active = fields.BooleanField(default=True, null=True)

  class Meta:
    table = "users"
    default_connection = "default"

  def __str__(self):
    return self.username
