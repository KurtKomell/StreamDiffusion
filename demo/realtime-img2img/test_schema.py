#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from img2img import Pipeline
import json

# Get schema without instantiating Pipeline
schema = Pipeline.InputParams.schema()

print('='*50)
print('SCHEMA FIELDS:', list(schema.get('properties', {}).keys()))
print('='*50)
print(json.dumps(schema, indent=2))
