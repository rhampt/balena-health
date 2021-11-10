#!/bin/bash

if [[ "${SIMULATION_MODE}" == "true" ]]; then
  echo "Starting data-collector in simulation mode."
  npm run start-sim
else
  npm run start
fi

# Idle
balena-idle 