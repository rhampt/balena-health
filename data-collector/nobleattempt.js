var noble = require('noble');

noble.on('stateChange', function (state) {
  console.log(state);
  if (state === 'poweredOn') {
    // Seek for peripherals broadcasting the heart rate service
    // This will pick up a Polar H7 and should pick up other ble heart rate bands
    // Will use whichever the first one discovered is if more than one are in range
    noble.startScanning(['180d']);
    console.log(hi);
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', function (peripheral) {
  // Once peripheral is discovered, stop scanning
  noble.stopScanning();

  console.log('discover');

  // connect to the heart rate sensor
  peripheral.connect(function (error) {
    // 180d is the bluetooth service for heart rate:
    // https://developer.bluetooth.org/gatt/services/Pages/ServiceViewer.aspx?u=org.bluetooth.service.heart_rate.xml
    var serviceUUID = ['180d'];
    // 2a37 is the characteristic for heart rate measurement
    // https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml
    var characteristicUUID = ['2a37'];

    // use noble's discoverSomeServicesAndCharacteristics
    // scoped to the heart rate service and measurement characteristic
    peripheral.discoverSomeServicesAndCharacteristics(
      serviceUUID,
      characteristicUUID,
      function (error, services, characteristics) {
        characteristics[0].notify(true, function (error) {
          characteristics[0].on('data', function (data, isNotification) {
            // Upon receiving data (array of bytes), decode the HR (in bpm) and the RRIs included
            //console.log('length: ' + data.length)
            //console.log('flags: ' + data[0]); //(conv this to binary) see: https://developer.bluetooth.org/gatt/characteristics/Pages/CharacteristicViewer.aspx?u=org.bluetooth.characteristic.heart_rate_measurement.xml
            //console.log('bpm: ' + data[1]);
            var i;
            RRITxt = ''; //'RRI: '
            for (i = 2; i < data.length; i += 2) {
              //loop over RRI entries (2 indicies per val)
              RRITxt += ' ' + (data[i] + 256 * data[i + 1]); //2nd bit is most significant
            }
            console.log(RRITxt);
          });
        });
      }
    );
  });
});
