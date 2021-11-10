#!/bin/bash

if [[ "${SIMULATION_MODE}" == "true" ]]; then
  echo "Starting eink in simulation mode."
  python3 eink-sim.py
else
  python3 eink.py
fi

# Idle
balena-idle