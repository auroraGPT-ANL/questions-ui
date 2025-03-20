#!/usr/bin/env python
import json
import argparse

parser = argparse.ArgumentParser()
parser.add_argument("infile", type=argparse.FileType('r'))
parser.add_argument("outfile", type=argparse.FileType('w'))
args = parser.parse_args()

jam = json.load(args.infile)

assert jam['version']['version'] == "1.0.0", "file is not correct version"

for e in jam['experiments']:
    for turn in e['turns']:
        turn['data_removed'] = False
jam['version']['version'] = "1.1.0"

json.dump(jam, args.outfile)
