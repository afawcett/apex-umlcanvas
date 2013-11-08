/**
* Copyright (c) 2011, salesforce.com, inc.
* All rights reserved.
*
* Redistribution and use in source and binary forms, with or without modification, are permitted provided
* that the following conditions are met:
*
* Redistributions of source code must retain the above copyright notice, this list of conditions and the
* following disclaimer.
*
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and
* the following disclaimer in the documentation and/or other materials provided with the distribution.
*
* Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or
* promote products derived from this software without specific prior written permission.
*
* THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
* WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
* PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
* ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
* TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
* HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
* NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
* POSSIBILITY OF SUCH DAMAGE.
*/
/**
 *@namespace Sfdc.canvas.client
 *@name Sfdc.canvas.client
 */
(function ($$) {

    "use strict";

    var pversion, cversion = "29.0";

    var module =   (function() /**@lends module */ {

        var purl;

        function startsWithHttp(u, d) {
            return  $$.isNil(u) ? u : (u.substring(0, 4) === "http") ? u : d;
        }

        // returns the url of the Parent Window
        function getTargetOrigin(to) {
            var h;
            if (to === "*") {return to;}
            if (!$$.isNil(to)) {
                h = $$.stripUrl(to);
                purl = startsWithHttp(h, purl);
                if (purl) {return purl;}
            }
            // This relies on the parent passing it in. This may not be there as the client can do a redirect.
            h = $$.document().location.hash;
            if (h) {
                h = decodeURIComponent(h.replace(/^#/, ''));
                purl = startsWithHttp(h, purl);
            }
            return purl;
        }

        // The main cross domain callback handler
        function xdCallback(data) {
            if (data) {
                if (submodules[data.type]) {
                    submodules[data.type].callback(data);
                }
                // Just ignore...
            }
        }

        var submodules = (function () {

            var cbs = [], seq = 0, autog = true;

            // Functions common to submodules...

            function postit(clientscb, message) {
                var wrapped, to, c;

                // need to keep a mapping from request to callback, otherwise
                // wrong callbacks get called. Unfortunately, this is the only
                // way to handle this as postMessage acts more like topic/queue.
                // limit the sequencers to 100 avoid out of memory errors
                seq = (seq > 100) ? 0 : seq + 1;
                cbs[seq] = clientscb;
                wrapped = {seq : seq, src : "client", clientVersion : cversion, parentVersion: pversion, body : message};

                c  = message && message.config && message.config.client;
                to = getTargetOrigin($$.isNil(c) ? null : c.targetOrigin);
                if ($$.isNil(to)) {
                    throw "ERROR: targetOrigin was not supplied and was not found on the hash tag, this can result from a redirect or link to another page.";
                }
                $$.xd.post(wrapped, to, parent);
            }

            function validateClient(client, cb) {
                var msg;

                client = client || $$.oauth && $$.oauth.client();

                if ($$.isNil(client) || $$.isNil(client.oauthToken)) {
                    msg = {status : 401, statusText : "Unauthorized" , parentVersion : pversion, payload : "client or client.oauthToken not supplied"};
                }
                if ($$.isNil(client.instanceId) || $$.isNil(client.targetOrigin)) {
                    msg = {status : 400, statusText : "Bad Request" , parentVersion : pversion, payload : "client.instanceId or client.targetOrigin not supplied"};
                }
                if (!$$.isNil(msg)) {
                    if ($$.isFunction(cb)) {
                        cb(msg);
                        return false;
                    }
                    else {
                        throw msg;
                    }
                }
                return true;
            }

            // Submodules...

            var event = (function() {
                var subscriptions = {}, STR_EVT = "sfdc.streamingapi";

                function validName(name, res) {
                    var msg, r = $$.validEventName(name, res);
                    if (r !== 0) {
                        msg = {1 : "Event names can only contain one namespace",
                               2 : "Namespace has already been reserved",
                               3 : "Event name contains invalid characters"
                        };
                        throw msg[r];
                    }
                }

                function findSubscription(event) {
                    var s, name = event.name;

                    if (name === STR_EVT) {
                        s = subscriptions[name][event.params.topic];
                    } else {
                        s = subscriptions[name];
                    }

                    if (!$$.isNil(s) && $$.isFunction(s.onData)) {
                        return s;
                    }

                    return null;
                }

                return  {
                    callback : function (data) {
                        var event = data.payload,
                            subscription = findSubscription(event),
                            func;

                        if (!$$.isNil(subscription)) {
                            if (event.method === "onData") {
                                func = subscription.onData;
                            } else if (event.method === "onComplete") {
                                func = subscription.onComplete;
                            }

                            if (!$$.isNil(func) && $$.isFunction(func)) {
                                func(event.payload);
                            }
                        }
                    },

                    /**
                     * @description Subscribes to parent or custom events. Events
                     * with the namespaces 'canvas', 'sfdc', 'force', 'salesforce', and 'chatter' are reserved by Salesforce.
                     * Developers can choose their own namespace and event names.
                     * Event names must be in the form <code>namespace.eventname</code>.
                     * @public
                     * @name Sfdc.canvas.client#subscribe
                     * @function
                     * @param {client} client The object from the signed request
                     * @param {Object} s The subscriber object or array of objects with name and callback functions
                     * @example
                     * // Subscribe to the parent window onscroll event.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     // Capture the onScrolling event of the parent window.
                     *     Sfdc.canvas.client.subscribe(sr.client,
                     *          {name : 'canvas.scroll', onData : function (event) {
                     *              console.log("Parent's contentHeight; " + event.heights.contentHeight);
                     *              console.log("Parent's pageHeight; " + event.heights.pageHeight);
                     *              console.log("Parent's scrollTop; " + event.heights.scrollTop);
                     *              console.log("Parent's contentWidth; " + event.widths.contentWidth);
                     *              console.log("Parent's pageWidth; " + event.widths.pageWidth);
                     *              console.log("Parent's scrollLeft; " + event.widths.scrollLeft);
                     *          }}
                     *     );
                     * });
                     *
                     * @example
                     * // Subscribe to a custom event.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.subscribe(sr.client,
                     *         {name : 'mynamespace.someevent', onData : function (event) {
                     *             console.log("Got custom event ",  event);
                     *         }}
                     *     );
                     * });
                     *
                     * @example
                     * // Subscribe to multiple events
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.subscribe(sr.client, [
                     *         {name : 'mynamespace.someevent1', onData : handler1},
                     *         {name : 'mynamespace.someevent2', onData : handler2},
                     *     ]);
                     * });
                     *
                     * @example
                     * //Subscribe to Streaming API events.  
                     * //The PushTopic to subscribe to must be passed in.
                     * //The 'onComplete' method may be defined,
                     * //and will fire when the subscription is complete.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     var handler1 = function(){ console.log("onData done");},
                     *     handler2 = function(){ console.log("onComplete done");};
                     *     Sfdc.canvas.client.subscribe(sr.client,
                     *         {name : 'sfdc.streamingapi', params:{topic:"/topic/InvoiceStatements"}},
                     *          onData : handler1, onComplete : handler2}
                     *     );
                     * });
                     *
                     * 
                     */
                    subscribe : function(client, s) {
                        var subs = {};

                        if ($$.isNil(s) || (!validateClient(client))) {
                            throw "precondition fail";
                        }

                        $$.each($$.isArray(s) ? s : [s], function (v) {
                            if (!$$.isNil(v.name)) {
                                validName(v.name, ["canvas", "sfdc"]);

                                if (v.name === STR_EVT) {
                                    if (!$$.isNil(v.params) && !$$.isNil(v.params.topic)) {
                                        if ($$.isNil(subscriptions[v.name])) {
                                            subscriptions[v.name] = {};
                                        }
                                        subscriptions[v.name][v.params.topic] = v;
                                    } else {
                                        throw "[" +STR_EVT +"] topic is missing";
                                    }
                                } else {
                                    subscriptions[v.name] = v;
                                }

                                subs[v.name] = {
                                    params : v.params
                                };
                            } else {
                                throw "subscription does not have a 'name'";
                            }
                        });
                        if (!client.isVF) {
                            postit(null, {type : "subscribe", config : {client : client}, subscriptions : subs});
                        }
                    },
                    /**
                     * @description Unsubscribes from parent or custom events.
                     * @public
                     * @name Sfdc.canvas.client#unsubscribe
                     * @function
                     * @param {client} client The object from the signed request
                     * @param {Object} s The events to unsubscribe from
                     * @example
                     * //Unsubscribe from the canvas.scroll method.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.unsubscribe(sr.client, "canvas.scroll");
                     *});
                     *
                     * @example
                     * //Unsubscribe from the canvas.scroll method by specifying the object name.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.unsubscribe(sr.client, {name : "canvas.scroll"});
                     *});
                     *
                     * @example
                     * //Unsubscribe from multiple events.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.unsubscribe(sr.client, ['canvas.scroll', 'foo.bar']);
                     *});
                     *
                     * @example
                     * //Unsubscribe from Streaming API events.
                     * //The PushTopic to unsubscribe from  must be passed in.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.unsubscribe(sr.client, {name : 'sfdc.streamingapi',
                     *               params:{topic:"/topic/InvoiceStatements"}});
                     *});
                     */
                    unsubscribe : function(client, s) {
                        // client can pass in the handler object or just the name
                        var subs = {};

                        if ($$.isNil(s) || !validateClient(client)) {
                            throw "PRECONDITION FAIL: need fo supply client and event name";
                        }

                        if ($$.isString(s)) {
                            subs[s] = {};
                            delete subscriptions[s];
                        }
                        else {
                            $$.each($$.isArray(s) ? s : [s], function (v) {
                                var name = v.name ? v.name : v;
                                validName(name, ["canvas", "sfdc"]);
                                subs[name] = {
                                    params : v.params
                                };
                                if (name === STR_EVT) {
                                    if(!$$.isNil(subscriptions[name])) {
                                        if (!$$.isNil(subscriptions[name][v.params.topic])) {
                                            delete subscriptions[name][v.params.topic];
                                        }
                                        if ($$.size(subscriptions[name]) <= 0) {
                                            delete subscriptions[name];
                                        }
                                    }
                                } else {
                                    delete subscriptions[name];
                                }
                            });
                        }
                        if (!client.isVF) {
                            postit(null, {type : "unsubscribe", config : {client : client}, subscriptions : subs});
                        }
                    },
                    /**
                     * @description Publishes a custom event. Events are published to all subscribing canvas applications
                     * on the same page, regardless of domain. Choose a unique namespace so the event doesn't collide with other
                     * application events. Events can have payloads of arbitrary JSON objects.
                     * @public
                     * @name Sfdc.canvas.client#publish
                     * @function
                     * @param {client} client The object from the signed request
                     * @param {Object} e The event to publish
                     * @example
                     * // Publish the foo.bar event with the specified payload.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.publish(sr.client,
                     *         {name : "foo.bar", payload : {some : 'stuff'}});
                     *});
                     */
                    publish : function(client, e) {
                        if (!$$.isNil(e) && !$$.isNil(e.name)) {
                            validName(e.name);
                            if (validateClient(client)) {
                                postit(null, {type : "publish", config : {client : client}, event : e});
                            }
                        }
                    }
                };
            }());

            var callback = (function() {
                return  {
                    callback : function (data) {
                        // If the server is telling us the access_token is invalid, wipe it clean.
                        if (data.status === 401 &&
                            $$.isArray(data.payload) &&
                            data.payload[0].errorCode &&
                            data.payload[0].errorCode === "INVALID_SESSION_ID") {
                            // Session has expired logout.
                            if ($$.oauth) {$$.oauth.logout();}
                        }
                        // Find appropriate client callback an invoke it.
                        if ($$.isFunction(cbs[data.seq])) {
                            if (!$$.isFunction(cbs[data.seq])) {
                                alert("not function");
                            }
                            cbs[data.seq](data);
                        }
                        else {
                            // This can happen when the user switches out canvas apps real quick,
                            // before the request from the last canvas app have finish processing.
                            // We will ignore any of these results as the canvas app is no longer active to
                            // respond to the results.
                        }
                    }
                };
            }());

            var services = (function() {

                var sr;

                return  {
                    /**
                     * @description Performs a cross-domain, asynchronous HTTP request.
                     <br>Note: this method shouldn't be used for same domain requests.
                     * @param {String} url The URL to which the request is sent
                     * @param {Object} settings A set of key/value pairs to configure the request
                     <br>The success setting is required at minimum and should be a callback function
                     * @config {String} [client] The required client context {oauthToken: "", targetOrigin : "", instanceId : ""}
                     * @config {String} [contentType] "application/json"
                     * @config {String} [data] The request body
                     * @config {String} [headers] request headers
                     * @config {String} [method="GET"] The type of AJAX request to make
                     * @config {Function} [success] Callback for all responses from the server (failure and success). Signature: success(response); interesting fields: [response.data, response.responseHeaders, response.status, response.statusText}
                     * @config {Boolean} [async=true] Asynchronous: only <code>true</code> is supported.
                     * @name Sfdc.canvas.client#ajax
                     * @function
                     * @throws An error if the URL is missing or the settings object doesn't contain a success callback function.
                     * @example
                     * //Posting to a Chatter feed:
                     * var sr = JSON.parse('<%=signedRequestJson%>');
                     * var url = sr.context.links.chatterFeedsUrl+"/news/"
                     *                                   +sr.context.user.userId+"/feed-items";
                     * var body = {body : {messageSegments : [{type: "Text", text: "Some Chatter Post"}]}};
                     * Sfdc.canvas.client.ajax(url,
                     *   {client : sr.client,
                     *     method: 'POST',
                     *     contentType: "application/json",
                     *     data: JSON.stringify(body),
                     *     success : function(data) {
                     *     if (201 === data.status) {
                     *          alert("Success"
                     *          }
                     *     }
                     *   });
                     * @example
                     * // Gets a list of Chatter users:
                     * // Paste the signed request string into a JavaScript object for easy access.
                     * var sr = JSON.parse('<%=signedRequestJson%>');
                     * // Reference the Chatter user's URL from Context.Links object.
                     * var chatterUsersUrl = sr.context.links.chatterUsersUrl;
                     *
                     * // Make an XHR call back to Salesforce through the supplied browser proxy.
                     * Sfdc.canvas.client.ajax(chatterUsersUrl,
                     *   {client : sr.client,
                     *   success : function(data){
                     *   // Make sure the status code is OK.
                     *   if (data.status === 200) {
                     *     // Alert with how many Chatter users were returned.
                     *     alert("Got back "  + data.payload.users.length +
                     *     " users"); // Returned 2 users
                     *    }
                     * })};
                     */
                    ajax : function (url, settings) {

                        var ccb, config, defaults;

                        if (!url) {
                            throw "PRECONDITION ERROR: url required with AJAX call";
                        }
                        if (!settings || !$$.isFunction(settings.success)) {
                            throw "PRECONDITION ERROR: function: 'settings.success' missing.";
                        }
                        if (! validateClient(settings.client, settings.success)) {
                            return;
                        }

                        ccb = settings.success;
                        defaults = {
                            method: 'GET',
                            async: true,
                            contentType: "application/json",
                            headers: {"Authorization" : "OAuth "  + settings.client.oauthToken,
                                "Accept" : "application/json"},
                            data: null
                        };
                        config = $$.extend(defaults, settings || {});

                        // Remove any listeners as functions cannot get marshaled.
                        config.success = undefined;
                        config.failure = undefined;
                        // Don't allow the client to set "*" as the target origin.
                        if (config.client.targetOrigin === "*") {
                            config.client.targetOrigin = null;
                        }
                        else {
                            // We need to set this here so we can validate the origin when we receive the call back
                            purl = startsWithHttp(config.targetOrigin, purl);
                        }
                        postit(ccb, {type : "ajax", url : url, config : config});
                    },
                    /**
                     * @description Returns the context for the current user and organization.
                     * @public
                     * @name Sfdc.canvas.client#ctx
                     * @function
                     * @param {Function} clientscb The callback function to run when the call to ctx completes
                     * @param {Object} client The signedRequest.client.
                     * @example
                     * // Gets context in the canvas app.
                     *
                     * function callback(msg) {
                     *   if (msg.status !== 200) {
                     *     alert("Error: " + msg.status);
                     *     return;
                     *   }
                     *   alert("Payload: ", msg.payload);
                     * }
                     * var ctxlink = Sfdc.canvas.byId("ctxlink");
                     * var client = Sfdc.canvas.oauth.client();
                     * ctxlink.onclick=function() {
                     *   Sfdc.canvas.client.ctx(callback, client)};
                     * }
                     */
                    ctx : function (clientscb, client) {
                        if (validateClient(client, clientscb)) {
                            postit(clientscb, {type : "ctx", accessToken : client.oauthToken, config : {client : client}});
                        }
                    },
                    /**
                     * @description Stores or gets the oauth token in a local javascript variable. Note, if longer term
                     * (survive page refresh) storage is needed store the oauth token on the server side.
                     * @param {String} t oauth token, if supplied it will be stored in a volatile local JS variable.
                     * @returns {Object} the oauth token.
                     */
                    token : function(t) {
                        return $$.oauth && $$.oauth.token(t);
                    },
                    /**
                     * @description Returns the current version of the client.
                     * @returns {Object} {clientVersion : "29.0", parentVersion : "29.0"}.
                     */
                    version : function() {
                        return {clientVersion: cversion, parentVersion : pversion};
                    },
                    /**
                     * @description Temporary storage for the signed request. An alternative for users storing SR in
                     * a global variable.
                     * @param {Object} s signedrequest to be temporarily stored in Sfdc.canvas.client object.
                     * @returns {Object} the value previously stored
                     */
                    signedrequest : function(s) {
                        if (arguments.length > 0) {
                            sr = s;
                        }
                        return sr;
                    }
                };
            }());

            var frame = (function() {
                return  {
                    /**
                     * @public
                     * @name Sfdc.canvas.client#size
                     * @function
                     * @description Returns the current size of the iFrame.
                     * @return {Object}<br>
                     * <code>heights.contentHeight</code>: the height of the virtual iFrame, all content, not just visible content.<br>
                     * <code>heights.pageHeight</code>: the height of the visible iFrame in the browser.<br>
                     * <code>heights.scrollTop</code>: the position of the scroll bar measured from the top.<br>
                     * <code>widths.contentWidth</code>: the width of the virtual iFrame, all content, not just visible content.<br>
                     * <code>widths.pageWidth</code>: the width of the visible iFrame in the browser.<br>
                     * <code>widths.scrollLeft</code>: the position of the scroll bar measured from the left.
                     * @example
                     * //get the size of the iFrame and print out each component.
                     * var sizes = Sfdc.canvas.client.size();
                     * console.log("contentHeight; " + sizes.heights.contentHeight);
                     * console.log("pageHeight; " + sizes.heights.pageHeight);
                     * console.log("scrollTop; " + sizes.heights.scrollTop);
                     * console.log("contentWidth; " + sizes.widths.contentWidth);
                     * console.log("pageWidth; " + sizes.widths.pageWidth);
                     * console.log("scrollLeft; " + sizes.widths.scrollLeft);
                     */
                    size : function() {
                        var docElement = $$.document().documentElement;
                        var contentHeight = docElement.scrollHeight,
                            pageHeight = docElement.clientHeight,
                            scrollTop = (docElement && docElement.scrollTop) || $$.document().body.scrollTop,
                            contentWidth = docElement.scrollWidth,
                            pageWidth = docElement.clientWidth,
                            scrollLeft = (docElement && docElement.scrollLeft) || $$.document().body.scrollLeft;

                        return {heights : {contentHeight : contentHeight, pageHeight : pageHeight, scrollTop : scrollTop},
                            widths : {contentWidth : contentWidth, pageWidth : pageWidth, scrollLeft : scrollLeft}};
                    },
                    /**
                     * @public
                     * @name Sfdc.canvas.client#resize
                     * @function
                     * @description Informs the parent window to resize the canvas iFrame. If no parameters are specified,
                     * the parent window attempts to determine the height of the canvas app based on the
                     * content and then sets the iFrame width and height accordingly. To explicitly set the dimensions,
                     * pass in an object with height and/or width properties.
                     * @param {Client} client The object from the signed request
                     * @param {size} size The optional height and width information
                     * @example
                     * //Automatically determine the size
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.resize(sr.client);
                     * });
                     *
                     * @example
                     * //Set the height and width explicitly
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.resize(sr.client, {height : "1000px", width : "900px"});
                     * });
                     *
                     * @example
                     * //Set only the height
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.resize(sr.client, {height : "1000px"});
                     * });
                     *
                     */
                    resize : function(client, size) {
                        var sh, ch, sw, cw, s = {height : "", width : ""},
                            docElement = $$.document().documentElement;

                        // If the size was not supplied, adjust window
                        if ($$.isNil(size)) {
                            sh = docElement.scrollHeight;
                            ch = docElement.clientHeight;
                            if (ch !== sh) {
                                s.height = sh + "px";
                            }
                            sw = docElement.scrollWidth;
                            cw = docElement.clientWidth;
                            if (sw !== cw) {
                                s.width = sw + "px";
                            }
                        }
                        else {
                            if (!$$.isNil(size.height)) {
                                s.height = size.height;
                            }
                            if (!$$.isNil(size.width)) {
                                s.width = size.width;
                            }
                        }
                        if (!$$.isNil(s.height) || !$$.isNil(s.width)) {
                            postit(null, {type : "resize", config : {client : client}, size : s});
                        }
                    },
                    /**
                     * @public
                     * @name Sfdc.canvas.client#autogrow
                     * @function
                     * @description Starts or stops a timer which checks the content size of the iFrame and
                     * adjusts the frame accordingly.
                     * Use this function when you know your content is changing size, but you're not sure when. There's a delay as
                     * the resizing is done asynchronously. Therfore, if you know when your content changes size, you should 
                     * explicitly call the resize() method and save browser CPU cycles.
                     * Note: you should turn off scrolling before this call, otherwise you might get a flicker.
                     * @param {client} client The object from the signed request
                     * @param {boolean} b Whether it's turned on or off; defaults to <code>true</code>
                     * @param {Integer} interval The interval used to check content size; default timeout is 300ms.
                     * @example
                     *
                     * // Turn on auto grow with default settings.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.autogrow(sr.client);
                     * });
                     *
                     * // Turn on auto grow with a polling interval of 100ms (milliseconds).
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.autogrow(sr.client, true, 100);
                     * });
                     *
                     * // Turn off auto grow.
                     * Sfdc.canvas(function() {
                     *     sr = JSON.parse('<%=signedRequestJson%>');
                     *     Sfdc.canvas.client.autogrow(sr.client, false);
                     * });
                     */
                    autogrow : function(client, b, interval) {
                        var ival = ($$.isNil(interval)) ? 300 : interval;
                        autog  = ($$.isNil(b)) ? true : b;
                        if (autog === false) {
                            return;
                        }
                        setTimeout(function () {
                            submodules.frame.resize(client);
                            submodules.frame.autogrow(client, autog);
                        },ival);
                    }
                };
            }());

            return {
                services : services,
                frame : frame,
                event : event,
                callback : callback
            };
        }());

        $$.xd.receive(xdCallback, getTargetOrigin);

        return {
            ctx : submodules.services.ctx,
            ajax : submodules.services.ajax,
            token : submodules.services.token,
            version : submodules.services.version,
            resize : submodules.frame.resize,
            size : submodules.frame.size,
            autogrow : submodules.frame.autogrow,
            subscribe : submodules.event.subscribe,
            unsubscribe : submodules.event.unsubscribe,
            publish : submodules.event.publish,
            signedrequest : submodules.services.signedrequest
        };
    }());

    $$.module('Sfdc.canvas.client', module);

}(Sfdc.canvas));
