export default {introspectAccessToken}

/**
 * A subrequest (mapped in the nginx config) is made to the oauth2 server.
 * The response is either http 200 {active: false} or http 200 {active: true, ... other info ...}.
 * This function translates the response json to an appropriate http response code (204, 401 or 403) which
 * can be interpreted by the nginx 'auth_request' module.
 * @param r nginx request object
 */
function introspectAccessToken(r) {
  r.subrequest("/default/introspect",
    function (reply) {
      if (reply.status !== 200) {
        r.return(401); // Unexpected response, return 'auth required'
      }

      const response = JSON.parse(reply.responseText);
      if (response.active) {
        r.return(204); // Token is valid, return success code
      } else {
        r.return(403); // Token is invalid, return forbidden code
      }
    }
  );
}
