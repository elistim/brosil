import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

import app as brosil


class TrackerApiTest(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.original_data_file = brosil.DATA_FILE
        self.original_trackers_file = brosil.TRACKERS_FILE
        base = Path(self.temp_dir.name)
        brosil.DATA_FILE = base / "data.json"
        brosil.TRACKERS_FILE = base / "trackers.json"

    def tearDown(self):
        brosil.DATA_FILE = self.original_data_file
        brosil.TRACKERS_FILE = self.original_trackers_file
        self.temp_dir.cleanup()

    def test_create_use_and_delete_custom_tracker(self):
        self.assertEqual(len(brosil.get_trackers()), 4)

        created = brosil.create_tracker(brosil.TrackerRequest(name="  Учёба  "))
        tracker_id = created["id"]
        self.assertEqual(created["name"], "Учёба")

        saved = brosil.save_day(
            brosil.MarkRequest(
                date="2026-08-11",
                values={"smoke": True, tracker_id: True},
            )
        )
        self.assertTrue(saved["ok"])
        day = brosil.get_data()["2026-08-11"]
        self.assertTrue(day["smoke"])
        self.assertTrue(day[tracker_id])

        deleted = brosil.delete_tracker(tracker_id)
        self.assertTrue(deleted["ok"])
        self.assertNotIn(tracker_id, brosil.get_data()["2026-08-11"])
        self.assertTrue(brosil.get_data()["2026-08-11"]["smoke"])

    def test_rejects_duplicate_tracker_name(self):
        brosil.create_tracker(brosil.TrackerRequest(name="Учёба"))
        with self.assertRaises(HTTPException) as raised:
            brosil.create_tracker(brosil.TrackerRequest(name="учёба"))
        self.assertEqual(raised.exception.status_code, 409)


if __name__ == "__main__":
    unittest.main()
