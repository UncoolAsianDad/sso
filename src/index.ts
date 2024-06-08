import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/consent', async (req, res) => {
  const { consent_challenge } = req.query;

  try {
    const response = await axios.get(`http://localhost:4445/oauth2/auth/requests/consent/${consent_challenge}`);
    const challengeData = response.data;

    if (challengeData.skip) {
      await axios.put(`http://localhost:4445/oauth2/auth/requests/consent/${consent_challenge}/accept`, {
        grant_scope: challengeData.requested_scope,
        grant_access_token_audience: challengeData.requested_access_token_audience,
        session: {}
      });
      return res.redirect(challengeData.redirect_to);
    }

    res.render('consent', { challenge: consent_challenge });
  } catch (error) {
    res.status(500).send('Error during consent request.');
  }
});

app.post('/consent', async (req, res) => {
  const { consent_challenge, submit } = req.body;

  if (submit === 'Deny access') {
    await axios.put(`http://localhost:4445/oauth2/auth/requests/consent/${consent_challenge}/reject`, {
      error: 'access_denied',
      error_description: 'The resource owner denied the request'
    });
    return res.redirect('/');
  }

  try {
    const response = await axios.put(`http://localhost:4445/oauth2/auth/requests/consent/${consent_challenge}/accept`, {
      grant_scope: ['openid'],
      session: {}
    });
    res.redirect(response.data.redirect_to);
  } catch (error) {
    res.status(500).send('Error during consent submission.');
  }
});

app.listen(port, () => {
  console.log(`Consent app listening at http://localhost:${port}`);
});
