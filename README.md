![logo](https://raw.githubusercontent.com/rhampt/balena-health/main/images/spash.png)

**This is a starter balenaHub project that allows users to monitor heart rate from a Polar H10 device. Future enhancements will be to support health and well-being.**

## Highlights

- Supports any Low-Energy Bluetooth (BLE) heart rate monitor that conforms to Bluetooth SIG's [Service Schema](https://www.bluetooth.com/wp-content/uploads/Sitecore-Media-Library/Gatt/Xml/Services/org.bluetooth.service.heart_rate.xml).
- Specifically tested with the [Polar H10](https://www.polar.com/us-en/products/accessories/h10_heart_rate_sensor) BLE heart rate device.
- Supports RaspberryPi4-64bit and RaspberryPi3-64bit
- Configurable to include a time-series graph (InfluxDB) to see heart rate over time
- Configurable to show heart rate on an attached E-Ink display
- Configurable to show when your heart rate exceeds a specified value (on a small LED traffic light)

## Motivation

Mental health is extremely important. Stress is known to increase one’s heart rate. I wanted a DIY project where I could connect a heart rate sensor to a Raspberry Pi and have it remind me to take deep breaths during stressful periods. Using a simple DIY equipment desk, my goal was to create a feasible solution to this problem.

This solution allows you to monitor real-time and historical heart rate data while working. It will continually measure and display your heart rate on the locally connected screen. The wireless heart rate sensor communicates real-time to a Raspberry Pi via Bluetooth. An InfluxDB time series database is kept on the device and your historical heart rate data is presented by grafana at a private URL. This will help you spot trends and determine if this method of reducing stress actually works.

Your desktop RPi application will update the attached E-Ink display every 30 seconds or so (configurable) with your latest heart rate. You will also have a connected traffic light LED to indicate the status of your heart rate zone (red=bad, yellow=warning, green=good; also configurable points). During periods of increased stress your yellow or green light would turn red, indicating you should take some deep breaths to slow your heart rate. The red-light deep breaths may end up causing fewer periods of stress.

## Setup and Configuration

TBD

## Documentation

TBD

## Getting Help

If you're having any problem, please [raise an issue](https://github.com/rhampt/balena-health/issues/new) on GitHub and we will be happy to help. You can also find help on the balenaForums.

## Contributing

Do you want to help make balenaHealth better? Take a look at our [Contributing Guide](CONTRIBUTING).

## License

balenaHealth is free software, and may be redistributed under the terms specified in the [License](LICENSE).
