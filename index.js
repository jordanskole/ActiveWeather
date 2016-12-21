const express = require('express')
const app = express()
const ActiveCampaign = require("activecampaign");

app.set('port', (process.env.PORT || 5000))
app.set('darkSkyAPI', (process.env.darkSkyAPI || false))
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
    res.status(403).send('That doesn\'t look like a valid account/key pair')
    return;
  }
  let ac = new ActiveCampaign(accountString, apiKey);
  ac.credentials_test().then((result) => {
    if (!result.success) {
      // API key/account mismatch
      res.status(403).send('That doesn\'t look like a valid account/key pair')
      return;
    }
    // do stuff

  });

});

// catch all other urls
app.get('*', (req, res) => {
  res.send('All who wander are not lost. Try \'{base}/{account}/catch/weather\'', 404);
});

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
