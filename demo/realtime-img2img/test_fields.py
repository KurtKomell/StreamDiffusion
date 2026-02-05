#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from img2img import Pipeline
import json

# Check model fields
print('='*50)
print('MODEL FIELDS:')
print('='*50)
for field_name, field_info in Pipeline.InputParams.model_fields.items():
    print(f"  {field_name}: {field_info}")
print('='*50)

# Get schema
schema = Pipeline.InputParams.schema()

print('\nSCHEMA FIELDS:', list(schema.get('properties', {}).keys()))
print('='*50)
