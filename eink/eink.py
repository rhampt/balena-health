#!/usr/local/bin/python
# -*- coding:utf-8 -*-
import os
import logging
from time import sleep
import atexit
import json
import random
from threading import Timer
import paho.mqtt.client as mqtt
from PIL import Image, ImageDraw, ImageFont
from waveshare_epd import epd2in7  # https://www.waveshare.com/wiki/2.7inch_e-Paper_HAT
import RPi.GPIO as GPIO

BUZZER_PIN = 5
KEY1_PIN = 16
GPIO.setmode(GPIO.BCM)
GPIO.setwarnings(False)
GPIO.setup(BUZZER_PIN, GPIO.OUT, initial=GPIO.HIGH)
GPIO.setup(KEY1_PIN, GPIO.IN, pull_up_down=GPIO.PUD_UP)

epd = epd2in7.EPD()

logging.basicConfig(level=logging.INFO)

bpmThreshold = int(os.getenv("BPM_THRESHOLD", "80"))
heartBeatInterval = int(os.getenv("HEARTBEAT_INTERVAL", "60"))  # seconds
mqttRetryPeriod = int(os.getenv("MQTT_RETRY_PERIOD", "30"))  # seconds
simulationMode = os.getenv("SIMULATION_MODE", "false")
mqttConnectedFlag = False

client = mqtt.Client()


class HeartBeatTimer(object):
    def __init__(self, interval, function):
        self.interval = interval
        self.function = function
        self.timer = Timer(self.interval, self.function)

    def run(self):
        self.timer.start()

    def reset(self):
        self.timer.cancel()
        self.timer = Timer(self.interval, self.function)
        self.timer.start()


def initDisplay():
    logging.info("Clearing the display")
    epd.init()
    epd.Clear()
    heartBeatTimer.reset()


# Start our heartbeat timer to clear if no messages for a period (avoid eink burn-in)
heartBeatTimer = HeartBeatTimer(heartBeatInterval, initDisplay)


def printHR(string):
    bpmImg = Image.new("1", (epd2in7.EPD_HEIGHT, epd2in7.EPD_WIDTH), 255)
    draw = ImageDraw.Draw(bpmImg)
    font = ImageFont.truetype("lemon.ttf", 50)
    draw.text(
        (20 + random.randint(-10, 10), 60 + random.randint(-10, 10)),
        string + " bpm",
        font=font,
        fill=0,
    )
    epd.display(epd.getbuffer(bpmImg))


def printSunset():
    sunsetImg = Image.new("1", (epd2in7.EPD_HEIGHT, epd2in7.EPD_WIDTH), 255)
    sunsetImg.paste(Image.open("sunset.png"), (0, 0))
    draw = ImageDraw.Draw(sunsetImg)
    font = ImageFont.truetype("lemon.ttf", 20)
    draw.text(
        (15 + random.randint(-5, 5), 140 + random.randint(-5, 5)),
        "Take deep breaths :)",
        font=font,
        fill=0,
    )
    epd.display(epd.getbuffer(sunsetImg))

    GPIO.output(BUZZER_PIN, GPIO.LOW)  # Turn on buzzer
    sleep(0.5)
    GPIO.output(BUZZER_PIN, GPIO.HIGH)  # Turn off buzzer


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
    logging.info("MQTT message received: {0}".format(strPayload))
    heartBeatTimer.reset()

    if message.topic == "balena":
        bpm = json.loads(strPayload)["bpm"]
        if bpm < bpmThreshold:
            printHR(str(bpm))
        else:
            printSunset()


def main():
    # Give the device state time to settle
    sleep(5)

    logging.info(
        "Applying Config: "
        + json.dumps(
            {
                "simulationMode": simulationMode,
                "bpmThreshold": bpmThreshold,
                "heartBeatInterval": heartBeatInterval,
                "mqttRetryPeriod": mqttRetryPeriod,
            }
        )
    )

    # Initialize and clear the display
    initDisplay()

    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    while True:
        if GPIO.input(KEY1_PIN) == False:
            logging.info("Key 1 Pressed")
            initDisplay()
            sleep(0.5)
        if not mqttConnectedFlag:
            logging.info(
                "Attempting to establish an MQTT connection at mqtt://localhost:1883"
            )
            try:
                client.connect("localhost", 1883, 60)
                client.loop_start()
            except Exception as e:
                logging.error("MQTT connection error: {0}".format(str(e)))
            sleep(mqttRetryPeriod)


def exit_handler():
    logging.info("Exiting, clearing display")
    heartBeatTimer.cancel()
    client.disconnect()
    client.loop_stop()
    epd.Clear()


atexit.register(exit_handler)


if __name__ == "__main__":
    try:
        main()
    except IOError as e:
        logging.error(e)
        exit(1)
