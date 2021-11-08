#!/usr/local/bin/python
# -*- coding:utf-8 -*-
import os
import logging
import time
import atexit
import json
import paho.mqtt.client as mqtt
from PIL import Image, ImageDraw, ImageFont
from waveshare_epd import epd2in7  # https://www.waveshare.com/wiki/2.7inch_e-Paper_HAT

epd = epd2in7.EPD()

logging.basicConfig(level=logging.INFO)

bpmThreshold = os.getenv("BPM_THRESHOLD", "80")
mqttAddress = os.getenv("MQTT_ADDRESS", "localhost")
mqttTopic = os.getenv("MQTT_SUB_TOPIC", "balena")
mqttRetryInSecs = 30
mqttConnectedFlag = False


def initDisplay():
    logging.info("Initializing and clearing the display")
    epd.init()
    epd.Clear()
    time.sleep(2)
    logging.info("Finished initializing and clearing the display")


def printHR(string):
    bpmImg = Image.new("1", (epd2in7.EPD_HEIGHT, epd2in7.EPD_WIDTH), 255)
    draw = ImageDraw.Draw(bpmImg)
    font = ImageFont.truetype("lemon.ttf", 50)
    draw.text((10, 50), string + " bpm", font=font, fill=0)
    epd.display(epd.getbuffer(bpmImg))


def printSunset():
    sunsetImg = Image.new("1", (epd2in7.EPD_HEIGHT, epd2in7.EPD_WIDTH), 255)
    sunsetImg.paste(Image.open("sunset.png"), (0, 0))
    draw = ImageDraw.Draw(sunsetImg)
    font = ImageFont.truetype("lemon.ttf", 20)
    draw.text((15, 140), "Take deep breaths :)", font=font, fill=0)
    epd.display(epd.getbuffer(sunsetImg))


def on_connect(client, userdata, flags, rc):
    global mqttConnectedFlag
    logging.info("MQTT connection successful. Subscribing to {0}".format(mqttTopic))
    mqttConnectedFlag = True


def on_disconnect(client, userdata, rc):
    global mqttConnectedFlag
    logging.info("MQTT disconnect detected")
    mqttConnectedFlag = False


def on_message(client, userdata, message):
    strPayload = str(message.payload.decode("utf-8"))
    logging.info("MQTT message received: {0}".format(strPayload))

    if message.topic == "balena":
        bpm = json.loads(strPayload)["bpm"]
        if bpm < int(bpmThreshold):
            printHR(str(bpm))
        else:
            printSunset()


def main():
    initDisplay()

    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message

    while True:
        if not mqttConnectedFlag:
            logging.info(
                "Attempting to connect to MQTT at {0}:1883".format(mqttAddress)
            )
            try:
                client.connect(mqttAddress, 1883, 60)
                client.loop_start()
                client.subscribe(mqttTopic)
            except Exception as e:
                logging.error("Error connecting to MQTT. ({0})".format(str(e)))
            time.sleep(mqttRetryInSecs)
        else:
            time.sleep(2)


def exit_handler():
    logging.info("eink exiting, clearing display")
    epd.Clear()


atexit.register(exit_handler)


if __name__ == "__main__":
    try:
        main()
    except IOError as e:
        logging.error(e)
        exit(1)
