#!/bin/bash

# TODO: Do MQTT publishing

echo "Building the data-collector Golang app"
go build bpm.go

# Idle
balena-idle