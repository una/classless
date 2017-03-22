import config from '../config/environment';

export default function getInitalSuggestionFromPageContext() {
  let url = document.referrer.toString();
  let contexts = config.APP.contexts;
  for(let i=0; i < contexts.length; i++) {
    if(url.match(new RegExp(contexts[i].cloudUrlRegex, 'i'))) {
      return contexts[i].searchQuery;
    }
  }
  return config.APP.defaultSearchQuery || '';
}
