export default {introspectAccessToken}

function introspectAccessToken(r) {
  r.log("yay")
  r.return(200)

  r.subrequest("/default/introspect",
    // function (reply) {
    //   if (reply.status !== 200) {
    //     r.return(401); // Unexpected response, return 'auth required'
    //   }
    //
    //   const response = JSON.parse(reply.responseBody);
    //   if (response.active) {
    //     r.return(204); // Token is valid, return success code
    //   } else {
    //     r.return(403); // Token is invalid, return forbidden code
    //   }
    // }
  );
}
