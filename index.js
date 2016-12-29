'use strict';

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ActiveCampaign = require('activecampaign');
const Forecast = require('forecast');
const dstk = require('dstk');

app.set('port', (process.env.PORT || 5000))
app.set('darkSkyAPI', (process.env.DARK_SKY_API_KEY || false))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(request, response) {
  response.sendFile('./public/index.html');
})

app.post('/:account/catch/weather/', (req, res) => {

  console.log('Weather POST catch called');

  // build our api base url for making API requests
  let account = req.params.account;
  let accountString = `https://${account}.api-us1.com`
  console.log('accountString: ', accountString);

  // if no api key break
  let apiKey = req.query.apiKey;
  if (!apiKey) {
    res.status(403).send('That doesn\'t look like a valid ActiveCampaign account/key pair')
    console.log('ActiveCampaign key missing');
    return;
  }

  // make sure we are getting a Dark Sky API key somehow
  if ((!app.get('darkSkyAPI')) && (typeof req.query.darkSkyKey != 'string')) {
    res.status(403).send('A DarkSky API key is required. Read more: https://www.activecampaign.com/blog/');
    console.log('DarkSky key missing');
    return;
  }

  // set the darksky key
  var darkSkyKey = app.get('darkSkyAPI');

  // override the key, in case we want to swap credentials from AC webhook and not env
  if (typeof req.query.darkSkyKey == 'string') {
    darkSkyKey = req.query.darkSkyKey;
  }

  console.log('DarkSky key set to: ', darkSkyKey);

  // parse the ActiveCampaign webhook
  var contact = req.body.contact;
  console.log('Contact IP address: ', contact.ip4);

  let ac = new ActiveCampaign(accountString, apiKey);
  ac.credentials_test().then((result) => {
    if (!result.success) {
      // API key/account mismatch
      res.status(403).send('That doesn\'t look like a valid ActiveCampaign account/key pair')
      console.log('ActiveCampaign credentials error');
      return;
    }

    // let contactIp =
    dstk.ipToCoordinates(contact.ip4, (err, data, httpResponse) => {
      // handle err
      if (err) {
        res.status(500).send('Something went wrong');
        console.log('dstk error');
        return;
      }

      location = data[contact.ip4];
      // build some geo stuffs
      console.log('The contact is located in: ', data[contact.ip4]);
      var updateContact = {
        'email': contact.email,
        'field[%GEOLAT%]': location.latitude.toString(),
        'field[%GEOLONG%]': location.longitude.toString()
      }
      console.log('Lat is a type of %s, and is %s', typeof updateContact.geo_lat, updateContact.geo_lat);
      console.log('long is a type of %s, and is %s', typeof updateContact.geo_long, updateContact.geo_long);

      // call Dark Sky
      var forecast = new Forecast({
        service: 'darksky',
        key: darkSkyKey,
        cache: true,
        units: 'fahrenheit'
      });

      forecast.get([location.latitude, location.longitude], (err, weather) => {
        // handle err
        if (err) {
          console.log('darkSkyKey error: ', err);
          return;
        }

        // updateContact.temp_icon = weather.daily.data[0].icon;
        updateContact['field[%TEMPICON%]'] = weather.daily.data[0].icon;
        // updateContact.temp_min = weather.daily.data[0].temperatureMin;
        updateContact['field[%TEMPLOW%]'] = weather.daily.data[0].temperatureMin;
        // updateContact.temp_max = weather.daily.data[0].temperatureMax;
        updateContact['field[%TEMPHIGH%]'] = weather.daily.data[0].temperatureMax;

        ac.api('contact/sync', updateContact).then((result) => {
          console.log('updated contact: ', result);
        });

        console.log('The contacts forecast is: ', updateContact);
      });

    });

    // do stuff
    res.status(200).send('Yay!')
    return;

  });

});

// catch all other urls
app.get('*', (req, res) => {
  res.status(404).send('All who wander are not lost. Try \'{base}/{account}/catch/weather\'');
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})

/* ===================== */
/*          Notes        */
/*            &          */
/*       Scratchpad      */
/* ===================== */


/*

const NodeGeocoder = require('node-geocoder');
const geocodeOptions = {
  provider: 'datasciencetoolkit',
  httpAdapter: 'http'
};


let geocoder = NodeGeocoder(geocodeOptions);
geocoder.geocode(geoString)
  .then((result) => {
    // darkSky call
    console.log('Geo Result: ', result);

  })
  .catch((err) => {
    console.log('Geocoder error: ', err);
  });
*/
