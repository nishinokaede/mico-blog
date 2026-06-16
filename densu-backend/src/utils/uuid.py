#!/usr/bin/env python
# -*- coding: UTF-8 -*-
'''
@Project ：queue-backend 
@File    ：uuid.py
@IDE     ：PyCharm 
@Author  ：densu
@Date    ：2025/7/19 01:30 
'''

import uuid
import time


class UUIDGenerator:
  """
  A utility class for generating UUIDs based on current timestamp.
  """

  @staticmethod
  def generate_time_based_uuid():
    """
    Generates a UUID based on the current timestamp.

    Returns:
        str: A UUID string generated using the current timestamp.
    """
    # Get current timestamp in nanoseconds
    nanoseconds = time.time_ns()

    # Create a UUID using the timestamp
    # We'll use UUID1 which uses timestamp and MAC address by default
    # But we'll modify it to use our precise nanosecond timestamp
    return str(uuid.uuid1(node=nanoseconds & 0xffffffffffff))

  @staticmethod
  def generate_time_based_uuid_v4():
    """
    Generates a random UUID (v4) but seeds it with the current timestamp.

    Returns:
        str: A UUID string that's randomly generated but timestamp-seeded.
    """
    # Get current timestamp
    timestamp = int(time.time() * 1000)  # milliseconds

    # Set random seed with timestamp
    import random
    random.seed(timestamp)

    # Generate random UUID
    return str(uuid.uuid4())

  @classmethod
  def get_uuid(cls, method='time_based'):
    """
    Get a UUID using the specified generation method.

    Args:
        method (str): Generation method, either 'time_based' or 'random_seeded'.
                      Defaults to 'time_based'.

    Returns:
        str: The generated UUID.

    Raises:
        ValueError: If an invalid method is specified.
    """
    if method == 'time_based':
      return cls.generate_time_based_uuid()
    elif method == 'random_seeded':
      return cls.generate_time_based_uuid_v4()
    else:
      raise ValueError(f"Invalid UUID generation method: {method}. "
                       "Choose 'time_based' or 'random_seeded'.")