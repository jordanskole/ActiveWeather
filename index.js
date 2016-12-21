const express = require('express');
const app = express();
const ActiveCampaign = require('activecampaign');
const DarkSky = require('darksky');

app.set('port', (process.env.PORT || 5000))
app.set('darkSkyAPI', (process.env.DARK_SKY_API_KEY || false))
app.use(express.static(__dirname + '/public'))

app.get('/', function(request, response) {
  response.send('Hello World!')
})

app.get('/:account/catch/weather/', (req, res) => {

  // build our api base url for making API requests
  let account = req.params.account;
  let accountString = `https://${account}.api-us1.com`

  // if no api key break
  let apiKey = req.query.apiKey;
  if (!apiKey) {
    res.status(403).send('That doesn\'t look like a valid ActiveCampaign account/key pair')
    return;
  }
  let ac = new ActiveCampaign(accountString, apiKey);
  ac.credentials_test().then((result) => {
    if (!result.success) {
      // API key/account mismatch
      res.status(403).send('That doesn\'t look like a valid ActiveCampaign account/key pair')
      return;
    }
    // make sure we are getting a Dark Sky API key somehow
    if ((!app.get('darkSkyAPI')) && (typeof req.query.darkSkyKey != 'string')) {
      res.status(403).send('A DarkSky API key is required');
      return;
    }

    res.send('Yay!')
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
