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
        data = { 'username': 'pepe',
                 'password': '123',
                 'email': 'pepe@wadobo.com'}
        res = self.post('/register/', data=data, status=200)

        # already registered user
        res = self.post('/register/', data=data, status=400)


    def test_list(self):
        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 11)
        self.assertEqual(res.json['objects'][0]['username'], 'danigm')

    def test_login(self):
        # Not logged
        self.get('/profile/', status=401)

        # No user
        data = {'username': 'pepe', 'password': 'abc'}
        res = self.post('/login/', data=data, status=400)

        # Bad password
        data = {'username': 'danigm', 'password': 'abc'}
        res = self.post('/login/', data=data, status=400)

        # Loggin ok
        data = {'username': 'danigm', 'password': '123'}
        res = self.post('/login/', data=data, status=200, tojson=True)
        assert 'Authorization' in res.headers
        apikey = res.headers['Authorization']

        # Getting auth view
        headers = [('apikey', apikey)]
        self.get('/profile/', status=200, tojson=True, headers=headers)

    def test_logout(self):
        # Not logged
        self.get('/profile/', status=401)

        # Loggin ok
        data = {'username': 'danigm', 'password': '123'}
        res = self.post('/login/', data=data, status=200, tojson=True)
        apikey = res.headers['Authorization']

        # Getting auth view
        headers = [('apikey', apikey)]
        self.get('/profile/', status=200, tojson=True, headers=headers)

        # Login out
        self.post('/logout/', status=200, tojson=True, headers=headers)

        # Logged out
        self.get('/profile/', status=401, headers=headers)

    def test_baselogin(self):
        self.get('/profile/', status=401)

        self.login('danigm', '123')
        self.get('/profile/', status=200, tojson=True)
        self.logout()

        self.get('/profile/', status=401)
