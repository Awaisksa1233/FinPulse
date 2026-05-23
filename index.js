export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const targetHost = "AwaisAI.pythonanywhere.com";

    // Update the hostname to the PythonAnywhere target
    url.hostname = targetHost;

    // Clone headers and update the Host header to match the destination host
    // PythonAnywhere requires the Host header to route requests to the correct virtual server
    const newHeaders = new Headers(request.headers);
    newHeaders.set("Host", targetHost);

    // Build the request forward configuration
    const fetchOptions = {
      method: request.method,
      headers: newHeaders,
      redirect: "manual"
    };

    // Forward the body for writing requests (POST, PUT, PATCH, DELETE)
    if (request.method !== "GET" && request.method !== "HEAD") {
      // Get body content
      fetchOptions.body = request.clone().body;
    }

    try {
      const response = await fetch(url.toString(), fetchOptions);
      return response;
    } catch (error) {
      return new Response(`Cloudflare Worker Proxy Error: ${error.message}`, { status: 502 });
    }
  }
};
