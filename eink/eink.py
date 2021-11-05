#!/usr/local/bin/python
# -*- coding:utf-8 -*-
import sys
import os
import logging
import time
import atexit
from PIL import Image, ImageDraw, ImageFont
from waveshare_epd import epd2in7  # https://www.waveshare.com/wiki/2.7inch_e-Paper_HAT

epd = epd2in7.EPD()

logging.basicConfig(level=logging.INFO)


def init():
    logging.info("Initializing and clearing the display")
    epd.init()
    epd.Clear()
    time.sleep(2)
    logging.info("Finished initializing and clearing the display")


def printHR(string):
    HBlackImage = Image.new("1", (epd2in7.EPD_HEIGHT, epd2in7.EPD_WIDTH), 255)

    draw = ImageDraw.Draw(
        HBlackImage
    )  # Create draw object and pass in the image layer we want to work with (HBlackImage)
    font = ImageFont.truetype(
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 90
    )  # Create our font, passing in the font file and font size

    draw.text((50, 40), string, font=font, fill=0)

    epd.display(epd.getbuffer(HBlackImage))


def printSunset():
    image = Image.new("1", (epd2in7.EPD_HEIGHT, epd2in7.EPD_WIDTH), 255)
    unicorn = Image.open("sunset.png")
    image.paste(unicorn, (0, 0))
    epd.display(epd.getbuffer(image))


def main():
    init()

    count = 0
    while True:
        if count % 2 == 0:
            printSunset()
        else:
            printHR(str(count))
        time.sleep(30)
        count = count + 1


def exit_handler():
    logging.info("eink exiting, clearing eink display")
    epd.Clear()


atexit.register(exit_handler)

if __name__ == "__main__":
    try:
        main()
    except IOError as e:
        logging.error(e)
        exit(1)
