#!/usr/bin/env python

from __future__ import division, absolute_import
from ...tests.base import BaseTestCase


class UserTestCase(BaseTestCase):
    PATH = '/api/users'

    def test_register(self):
        # Bad data
        data = { 'username': 'danigm' }
        res = self.post('/register/', data=data, status=400)

        # all ok
        data = { 'username': 'danigm',
                 'password': '123',
                 'email': 'danigm@wadobo.com'}
        res = self.post('/register/', data=data, status=200)

        # already registered user
        res = self.post('/register/', data=data, status=400)


    def test_list(self):
        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 0)

        # adding people
        self.test_register()

        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 1)
        self.assertEqual(res.json['objects'][0]['username'], 'danigm')
