#!/usr/bin/env python

from __future__ import division, absolute_import

import unittest


from app.auth.tests.user import UserTestCase
from app.board.tests.board import BoardTestCase
from app.board.tests.lists import ListsTestCase
from app.board.tests.tasks import TasksTestCase


if __name__ == '__main__':
    unittest.main()
