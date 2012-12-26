#!/usr/bin/env python

from __future__ import division, absolute_import

from flask import json

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

    def get(self, path, status=200, tojson=False):
        res = self.app.get(self.PATH + path)
        self.assertEqual(res.status_code, status)
        if tojson:
            res.json = json.loads(res.data)

        return res

    def post(self, path, data={}, status=200, tojson=False):
        res = self.app.post(self.PATH + path, data=data)
        self.assertEqual(res.status_code, status)
        if tojson:
            res.json = json.loads(res.data)

        return res

    def put(self, path, data={}, status=200, tojson=False):
        res = self.app.put(self.PATH + path, data=data)
        self.assertEqual(res.status_code, status)
        if tojson:
            res.json = json.loads(res.data)

        return res

    def delete(self, path, data={}, status=200, tojson=False):
        res = self.app.delete(self.PATH + path, data=data)
        self.assertEqual(res.status_code, status)
        if tojson:
            res.json = json.loads(res.data)

        return res
