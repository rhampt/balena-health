#!/usr/local/bin/python
# -*- coding:utf-8 -*-
import os
import logging
import time
import atexit
import json
import random
from threading import Timer
import paho.mqtt.client as mqtt

logging.basicConfig(level=logging.INFO)

bpmThreshold = int(os.getenv("BPM_THRESHOLD", "80"))
mqttRetryPeriod = int(os.getenv("MQTT_RETRY_PERIOD", "30"))  # seconds
simulationMode = os.getenv("SIMULATION_MODE", "false")
mqttConnectedFlag = False

client = mqtt.Client()


def on_connect(client, userdata, flags, rc):
    global mqttConnectedFlag
    logging.info("MQTT connection established, subscribing to the 'balena' topic")
    client.subscribe("balena")
    mqttConnectedFlag = True


def on_disconnect(client, userdata, rc):
    global mqttConnectedFlag
    logging.info("MQTT disconnect detected")
    mqttConnectedFlag = False


def on_message(client, userdata, message):
    strPayload = str(message.payload.decode("utf-8"))

    if message.topic == "balena":
        bpm = json.loads(strPayload)["bpm"]
        if bpm < bpmThreshold:
            logging.info("BPM received: {0}".format(bpm))
        else:
            logging.warn("Alarm Triggering Event! BPM received: {0}".format(bpm))


def main():
    # Give the device state time to settle
    time.sleep(5)

    logging.info(
        "Applying Config: "
        + json.dumps(
            {
                "simulationMode": simulationMode,
                "bpmThreshold": bpmThreshold,
                "mqttRetryPeriod": mqttRetryPeriod,
            }
        )
    )

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    while True:
        if not mqttConnectedFlag:
            logging.info(
                "Attempting to establish an MQTT connection at mqtt://localhost:1883"
            )
            try:
                client.connect("localhost", 1883, 60)
                client.loop_start()
            except Exception as e:
                logging.error("MQTT connection error: {0}".format(str(e)))
            time.sleep(mqttRetryPeriod)
        else:
            time.sleep(2)


def exit_handler():
    logging.info("Exiting...")
    client.disconnect()
    client.loop_stop()


atexit.register(exit_handler)


if __name__ == "__main__":
    try:
        main()
    except IOError as e:
        logging.error(e)
        exit(1)
