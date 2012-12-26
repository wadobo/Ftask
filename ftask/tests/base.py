#!/usr/bin/env python

from __future__ import division, absolute_import

import ftask
import unittest

from pymongo import MongoClient


class BaseTestCase(unittest.TestCase):

    def setUp(self):
        ftask.app.config['DATABASE'] = 'ftask_test'
        ftask.app.config['TESTING'] = True
        self.app = ftask.app.test_client()

    def tearDown(self):
        MongoClient().drop_database('ftask_test')
