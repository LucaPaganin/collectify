import createStore from 'react-auth-kit/createStore';
import { refreshApi, setupAuthInterceptor } from '../utils/authUtils';

const authStore = createStore({
  authName: '_auth',
  authType: 'cookie',
  cookieDomain: window.location.hostname,
  cookieSecure: window.location.protocol === 'https:',
  refresh: refreshApi
});

setupAuthInterceptor(() => {
  let token;
  const authVal = authStore.tokenObject.value;
  console.log(`authVal: ${JSON.stringify(authVal)}`);
  if (authVal.isSignIn) {
    token = authVal.auth.token;
  } else if (authVal.isUsingRefreshToken) {
    token = authVal.refresh?.token;
  }
  return token || null;
});

export default authStore;
