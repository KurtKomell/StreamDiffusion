#!/usr/bin/env python
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from img2img import Pipeline
import inspect

print('='*50)
print('InputParams source file:')
print(inspect.getfile(Pipeline.InputParams))
print('='*50)
