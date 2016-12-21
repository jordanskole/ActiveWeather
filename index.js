const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const ActiveCampaign = require('activecampaign');
const DarkSky = require('darksky');
const dstk = require('dstk');

app.set('port', (process.env.PORT || 5000))
app.set('darkSkyAPI', (process.env.DARK_SKY_API_KEY || false))
app.set('GoogleAPI', (process.env.GOOGLE_API_KEY || false))
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded());

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.post('/:account/catch/weather/', (req, res) => {

  // build our api base url for making API requests
  let account = req.params.account;
  let accountString = `https://${account}.api-us1.com`

  // if no api key break
  let apiKey = req.query.apiKey;
  if (!apiKey) {
    res.status(403).send('That doesn\'t look like a valid ActiveCampaign account/key pair')
    return;
  }

  // make sure we are getting a Dark Sky API key somehow
  if ((!app.get('darkSkyAPI')) && (typeof req.query.darkSkyKey != 'string')) {
    res.status(403).send('A DarkSky API key is required. Read more: https://www.activecampaign.com/blog/');
    return;
  }

  // parse the ActiveCampaign webhook
  var contact = req.body.contact;


  let ac = new ActiveCampaign(accountString, apiKey);
  ac.credentials_test().then((result) => {
    if (!result.success) {
      // API key/account mismatch
      res.status(403).send('That doesn\'t look like a valid ActiveCampaign account/key pair')
      return;
    }

    // let contactIp =
    dstk.ipToCoordinates(contact.ip4, (err, data, httpResponse) => {
      // handle err
      if (err) {
        res.status(500).send('Something went wrong');
        return;
      }

      // do stuff
      console.log('The contact is located in: ', data);
    });


    // do stuff

    res.status(200).send('Yay!')
    return;
  });

});

// catch all other urls
app.get('*', (req, res) => {
  res.send('All who wander are not lost. Try \'{base}/{account}/catch/weather\'', 404);
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
