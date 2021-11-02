const logger = require('./logger');
const { createBluetooth } = require('node-ble');
const { bluetooth, destroy } = createBluetooth();

// Ensure that anything unhandled gets logged
process.on('unhandledRejection', (reason, p) => logger.error('Unhandled Promise Rejection: ' + reason.stack));

// Figured out my Mac Address by putting the container on idle and running `bluetoothctl | grep Polar`
const MAC = 'E8:78:8D:A0:03:CA';

const Main = async () => {
  let device;
  try {
    const adapter = await bluetooth.defaultAdapter();
    if (!(await adapter.isDiscovering())) await adapter.startDiscovery();

    device = await adapter.waitDevice(MAC);
    await device.connect();
    const gattServer = await device.gatt();
    logger.info('Connected to the BLE device!');

    // 180d is the bluetooth service for heart rate:
    // https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.heart_rate.xml
    const serviceUUID = '180d';
    const service1 = await gattServer.getPrimaryService(serviceUUID);

    logger.info('Connected to the service!');

    // 2a37 is the characteristic for heart rate measurement
    // https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml
    var characteristicUUID = '2a37';
    const characteristic1 = await service1.getCharacteristic(characteristicUUID);

    // await characteristic1.writeValue(Buffer.from('Hello world'));
    const buffer = await characteristic1.readValue();
    console.log(buffer);

    // const services = await gattServer.services();
    // console.log(services);

    // for (let uuid in services) {
    //   try {
    //     const service1 = await gattServer.getPrimaryService(uuid);
    //     const characteristic1 = await service1.getCharacteristic(uuid);
    //     const buffer = await characteristic1.readValue();
    //     console.log(buffer);
    //   } catch {
    //     continue;
    //   }
    // }

    // const service2 = await gattServer.getPrimaryService('uuid')
    // const characteristic2 = await service2.getCharacteristic('uuid')
    // await characteristic2.startNotifications()
    // characteristic2.on('valuechanged', buffer => {
    //   console.log(buffer)
    // })
    // await characteristic2.stopNotifications();
  } catch (err) {
    logger.error('Unknown Error Caught in Main');
    logger.error(err?.message);
  } finally {
    if (typeof device.disconnect !== 'undefined') {
      await device.disconnect();
    }
    destroy();
  }
};

(async () => {
  logger.info('Hello from index.js');
  await Main();
  //   setInterval(async () => {
  //     await Main();
  //   }, 30 * 1000); // Try again in 30 seconds
})();
