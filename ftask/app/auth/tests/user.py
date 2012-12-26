#!/usr/bin/env python

from __future__ import division, absolute_import
from ...tests.base import BaseTestCase


class UserTestCase(BaseTestCase):
    PATH = '/api/users'

    def add_test_data(self):
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
            self.post('/register/', data=u, status=200)

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
        self.add_test_data()

        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 11)
        self.assertEqual(res.json['objects'][0]['username'], 'danigm')

    def test_login(self):
        # adding people
        self.add_test_data()

        # No user
        data = {'username': 'pepe', 'password': 'abc'}
        res = self.post('/login/', data=data, status=400)

        # Bad password
        data = {'username': 'danigm', 'password': 'abc'}
        res = self.post('/login/', data=data, status=400)

        # All ok
        data = {'username': 'danigm', 'password': '123'}
        res = self.post('/login/', data=data, status=200, tojson=True)
        assert 'Authorization' in res.headers
        apikey = res.headers['Authorization']

        headers = [('apikey', apikey)]
        res = self.get('/profile/', status=200, tojson=True, headers=headers)
        print res.json
