#!/usr/bin/env python

from __future__ import division, absolute_import
from ...tests.base import BaseTestCase


class BoardTestCase(BaseTestCase):
    PATH = '/api/boards'

    def add_test_data(self):
        self.login('danigm', '123')
        datas = [{ 'name': 'board%s' % i } for i in range(10)]
        for data in datas:
            res = self.post('/new/', data=data, status=200)
        self.logout()

        self.login('user1', '123')
        datas = [{ 'name': 'user1 board %s' % i } for i in range(5)]
        for data in datas:
            res = self.post('/new/', data=data, status=200)
        self.logout()

    def test_creation(self):
        # Bad data
        self.login('danigm', '123')
        res = self.post('/new/', data={}, status=400)

        # all ok
        data = { 'name': 'board1' }
        res = self.post('/new/', data=data, status=200)

        # already created board
        res = self.post('/new/', data=data, status=400)
        self.logout()

    def test_list(self):
        self.add_test_data()
        self.login('danigm', '123')
        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 10)
        self.logout()

        self.login('user1', '123')
        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 5)
        for i in range(5):
            self.assertEqual(res.json['objects'][i]['name'], 'user1 board %s' % i)
        self.logout()

    def test_view(self):
        self.add_test_data()
        self.login('danigm', '123')
        res = self.get('/', status=200, tojson=True)
        board = res.json['objects'][0]

        res = self.get('/%s' % board['id'], status=200, tojson=True)
        self.assertEqual(res.json['name'], board['name'])
        self.assertEqual(res.json['id'], board['id'])
        self.logout()

        res = self.get('/%s' % board['id'], status=401)
        self.login('user1', '123')
        res = self.get('/%s' % board['id'], status=404)
        self.logout()

    def test_update(self):
        self.add_test_data()
        self.login('danigm', '123')
        res = self.get('/', status=200, tojson=True)
        board = res.json['objects'][0]

        data = {'name': 'newname'}
        res = self.put('/%s' % board['id'], data=data, status=200, tojson=True)

        res = self.get('/', status=200, tojson=True)
        for b in res.json['objects']:
            if b['id'] == board['id']:
                self.assertEqual(b['name'], 'newname')

    def test_deletion(self):
        self.add_test_data()
        self.login('danigm', '123')
        res = self.get('/', status=200, tojson=True)
        board = res.json['objects'][0]

        res = self.delete('/%s' % board['id'], status=200, tojson=True)

        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 9)
