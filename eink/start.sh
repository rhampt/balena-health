#!/bin/bash

# python3 -m pip install --upgrade pip
pip3 install -r requirements.txt

echo "Starting e-ink Python app"

python3 eink.py

# Idle
balena-idle