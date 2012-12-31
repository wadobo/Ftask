#!/usr/bin/env python

from __future__ import division, absolute_import
from .board import BoardTestCase


class ListsTestCase(BoardTestCase):
    BASE_PATH = '/api/boards/%s/lists'

    def set_first_board_path(self):
        self.PATH = '/api/boards'
        res = self.get('/', status=200, tojson=True)
        board = res.json['objects'][0]
        self.PATH = self.BASE_PATH % board['id']

    def add_test_data(self):
        super(ListsTestCase, self).add_test_data()

        self.login('danigm', '123')
        self.set_first_board_path()

        datas = [{ 'name': 'list %s' % i } for i in range(10)]
        for data in datas:
            res = self.post('/new/', data=data, status=200)
        self.logout()

        self.login('user1', '123')
        self.set_first_board_path()

        datas = [{ 'name': 'user1 list %s' % i } for i in range(5)]
        for data in datas:
            res = self.post('/new/', data=data, status=200)
        self.logout()

    def test_creation(self):
        # we need boards
        super(ListsTestCase, self).add_test_data()

        # Bad data
        self.login('danigm', '123')
        self.set_first_board_path()
        res = self.post('/new/', data={}, status=400)

        # all ok
        data = { 'name': 'list1' }
        res = self.post('/new/', data=data, status=200)

        # already created list
        res = self.post('/new/', data=data, status=400)
        self.logout()

    def test_list(self):
        self.add_test_data()
        self.login('danigm', '123')
        self.set_first_board_path()
        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 13)
        self.logout()

        self.login('user1', '123')
        self.set_first_board_path()
        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 8)
        for i in range(5):
            self.assertEqual(res.json['objects'][i+3]['name'], 'user1 list %s' % i)
        self.logout()

    def test_view(self):
        self.add_test_data()
        self.login('danigm', '123')
        self.set_first_board_path()
        res = self.get('/', status=200, tojson=True)
        l = res.json['objects'][0]

        res = self.get('/%s/' % l['id'], status=200, tojson=True)
        self.assertEqual(res.json['name'], l['name'])
        self.assertEqual(res.json['id'], l['id'])
        self.logout()

        res = self.get('/%s/' % l['id'], status=401)
        self.login('user1', '123')
        self.set_first_board_path()
        res = self.get('/%s/' % l['id'], status=404)
        self.logout()

    def test_update(self):
        self.add_test_data()
        self.login('danigm', '123')
        self.set_first_board_path()
        res = self.get('/', status=200, tojson=True)
        l = res.json['objects'][0]

        data = {'name': 'newname'}
        res = self.put('/%s/' % l['id'], data=data, status=200, tojson=True)

        res = self.get('/', status=200, tojson=True)
        for i in res.json['objects']:
            if i['id'] == l['id']:
                self.assertEqual(i['name'], 'newname')

    def test_deletion(self):
        self.add_test_data()
        self.login('danigm', '123')
        self.set_first_board_path()
        res = self.get('/', status=200, tojson=True)
        l = res.json['objects'][0]

        res = self.delete('/%s/' % l['id'], status=200, tojson=True)

        res = self.get('/', status=200, tojson=True)
        self.assertEqual(res.json['meta']['total'], 12)
