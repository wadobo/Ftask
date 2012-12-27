#!/usr/bin/env python

from __future__ import division, absolute_import
from ...tests.base import BaseTestCase


class BoardTestCase(BaseTestCase):
    PATH = '/api/boards'

    def add_test_data(self):
        pass

    def test_creation(self):
        # Bad data
        self.login('danigm', '123')
        res = self.post('/new/', data={}, status=400)

        # all ok
        data = { 'name': 'board1' }
        res = self.post('/new/', data=data, status=200)

        # already created board
        res = self.post('/new/', data=data, status=400)

    def test_list(self):
        pass

    def test_view(self):
        pass

    def test_update(self):
        pass

    def test_deletion(self):
        pass
