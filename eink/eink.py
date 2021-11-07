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


def init():
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


def evalMessage(client, userdata, message):
    strPayload = str(message.payload.decode("utf-8"))
    logging.info("message received {0}".format(strPayload))

    if message.topic == "balena":
        bpm = json.loads(strPayload)["bpm"]
        if bpm < int(bpmThreshold):
            printHR(str(bpm))
        else:
            printSunset()
    elif message.topic == "clear":
        logging.info("TODO: handle clear case")


def main():
    init()

    mqtt_address = os.getenv("MQTT_ADDRESS", "localhost")
    mqtt_topic = os.getenv("MQTT_SUB_TOPIC", "balena")

    logging.info("Starting mqtt client, subscribed to {0}:1883".format(mqtt_address))
    client = mqtt.Client()
    try:
        client.connect(mqtt_address, 1883, 60)
        client.loop_start()
        client.subscribe(mqtt_topic)
        client.on_message = evalMessage
        logging.info("Subscribing to topic: {0}".format(mqtt_topic))
    except Exception as e:
        logging.error("Error connecting to mqtt. ({0})".format(str(e)))
        exit(1)

    while True:
        time.sleep(1)


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
