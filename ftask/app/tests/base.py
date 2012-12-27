#!/usr/bin/env python

from __future__ import division, absolute_import

from flask import json

import ftask
import unittest

from pymongo import MongoClient


class BaseTestCase(unittest.TestCase):

    def add_test_users(self):
        users = [
            {'username': 'danigm',
             'password': '123',
             'email': 'danigm@wadobo.com'},
        ]
        users += [{'username': 'user%d' % i,
                   'password': '123',
                   'email': 'user%d@wadobo.com' %i}\
                   for i in range(10)]
        for u in users:
            # registering using register view...
            self.app.post('/api/users/register/', data=u)


    def login(self, username, password):
        data = {'username': username, 'password': password}
        res = self.app.post('/api/users/login/', data=data)
        self.apikey = res.headers['Authorization']

    def logout(self):
        headers = [('apikey', self.apikey)]
        self.app.post('/api/users/logout/', headers=headers)
        self.apikey = None

    def setUp(self):
        ftask.app.config['DATABASE'] = 'ftask_test'
        ftask.app.config['TESTING'] = True
        self.app = ftask.app.test_client()

        self.apikey = None
        self.add_test_users()

    def tearDown(self):
        MongoClient().drop_database('ftask_test')

    def get(self, *args, **kwargs):
        return self.query(self.app.get, *args, **kwargs)

    def post(self, *args, **kwargs):
        return self.query(self.app.post, *args, **kwargs)

    def put(self, *args, **kwargs):
        return self.query(self.app.put, *args, **kwargs)

    def delete(self, *args, **kwargs):
        return self.query(self.app.delete, *args, **kwargs)

    def query(self, f, path, data={}, status=200, tojson=False, **kwargs):
        headers = kwargs.pop('headers', [])
        if self.apikey:
            headers += [('apikey', self.apikey)]

        res = f(self.PATH + path, data=data, headers=headers, **kwargs)
        self.assertEqual(res.status_code, status)
        if tojson:
            res.json = json.loads(res.data)

        return res
