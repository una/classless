import Oauth2Provider from 'torii/providers/oauth2-code';
import ENV from '../config/environment';

export default Oauth2Provider.extend({
  name: 'slack-proxy',
  apiKey: '2151811447.72286919815',
  baseUrl: `${ENV['api-host']}/auth/slack/`,
  redirectUri: `${ENV['api-host']}/auth/slack/callback`,
  responseParams: []
});
