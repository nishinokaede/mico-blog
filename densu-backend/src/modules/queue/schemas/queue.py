from enum import Enum


class QueueStatusEnum(str, Enum):
    IN_QUEUE = "in_queue"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
