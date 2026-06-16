#!/usr/bin/env python
# -*- coding: UTF-8 -*-
'''
@Project ：queue-backend 
@File    ：api_call.py
@IDE     ：PyCharm 
@Author  ：densu
@Date    ：2025/7/20 03:08 
'''
from tortoise import fields
from tortoise.models import Model


class ApiCall(Model):
    """
    接口请求次数记录
    """
    id = fields.IntField(pk=True)
    api_url = fields.CharField(max_length=255, unique=True)
    times = fields.IntField(default=0)

    created = fields.DatetimeField(auto_now_add=True, null=True)
    updated = fields.DatetimeField(auto_now=True, null=True)

    class Meta:
        table = "api_call"
