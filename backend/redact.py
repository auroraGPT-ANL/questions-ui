#!/usr/bin/env python
import models
import csv
from pathlib import Path

to_replace = {}
to_remove = {}
with open("redactions/copyrighted_files.csv") as copyrighted_files_f:
    copyright_files = csv.DictReader(copyrighted_files_f)
    for file in copyright_files:
        id = "files/" + file['filename']
        url = file['url']
        if url == "":
            to_remove[id] = None
        else:
            to_replace[id] = url

# update the database to mark the files as removed
db = models.SessionLocal()

to_replace_ids = db.query(models.ExperimentTurnFiles).where(models.ExperimentTurnFiles.file_path.in_(to_replace.keys())).all()
for r in to_replace_ids:
    r.file_path = to_replace[r.file_path]
db.add_all(to_replace_ids)

to_remove_ids = db.query(models.ExperimentTurnFiles.turn_id).where(models.ExperimentTurnFiles.file_path.in_(to_remove.keys()))
print("to_remove", to_remove_ids)
db.query(models.ExperimentTurn).where(models.ExperimentTurn.id.in_(to_remove_ids)).update({'data_removed': True})

db.query(models.ExperimentLog).where(models.ExperimentLog.final_evaluation_id.is_(None), models.ExperimentLog.preliminary_evaluation_id.is_(None)).delete()

# now remove entire entries related to restricted experiments
with open("redactions/export_control.csv") as export_control_f:
    export_control = csv.DictReader(export_control_f)
    to_remove = [int(e['id']) for e in export_control]
    db.query(models.ExperimentLog).where(models.ExperimentLog.id.in_(to_remove)).delete()
    db.flush()

db.commit()

# now remove the files subject to copyright
for f in Path("files").iterdir():
    if f.suffix in ['.png', '.jpeg', '.pdf']:
        f.unlink()




