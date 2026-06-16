from tortoise import fields
from tortoise.models import Model


class QueueRecord(Model):
    """排队记录 - 用户模块依赖的存根模型"""
    id = fields.IntField(pk=True)
    queue_user_id = fields.CharField(max_length=255, null=True)
    status = fields.CharField(max_length=50, default="in_queue")

    class Meta:
        table = "queue_records"
