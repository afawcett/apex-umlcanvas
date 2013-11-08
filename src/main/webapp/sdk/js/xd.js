
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
(function ($$, window) {

    "use strict";

    var module =   (function() {

        var internalCallback;

        /**
        * @description Pass a message to the target url
        * @param {String} message The message to send
        * @param {String} target_url Specifies what the origin of the target must be for the event to be dispatched.
        * @param {String} [target] The window that is the message's target. Defaults to the parent of the current window.
        */
        function postMessage(message, target_url, target) {
			var sfdcJson = Sfdc.JSON || JSON;

            // If target url was not supplied (client may have lost it), we could default to '*',
            // However there are security implications here as other canvas apps could receive this
            // canvas apps oauth token.
            if ($$.isNil(target_url)) {
                throw "ERROR: target_url was not supplied on postMessage";
            }
            var otherWindow = $$.stripUrl(target_url);

            target = target || parent;  // default to parent
            if (window.postMessage) {
                // the browser supports window.postMessage, so call it with a targetOrigin
                // set appropriately, based on the target_url parameter.

                // Add the targetModule as Canvas so we are the only ones interested in these events
                if ($$.isObject(message)) {message.targetModule = "Canvas";}
                message = sfdcJson.stringify(message);
                target.postMessage(message, otherWindow);
            }
        }
        
        /**
        * @name Sfdc.canvas.xd#receive
        * @description Runs the callback function when the message event is received.
        * @param {Function} callback Function to run when the message event is received 
            if the event origin is acceptable.
        * @param {String} source_origin The origin of the desired events
        */
        function receiveMessage(callback, source_origin) {

            // browser supports window.postMessage (if not not supported for pilot - removed per securities request)
            if (window.postMessage) {
                // bind the callback to the actual event associated with window.postMessage
                if (callback) {
                    internalCallback = function(e) {

                        var data, r;
						var sfdcJson = Sfdc.JSON || JSON;
                        if (!$$.isNil(e)) {
                            if (typeof source_origin === 'string' && e.origin !== source_origin) {
                                return false;
                            }
                            if ($$.isFunction(source_origin)) {
                                r = source_origin(e.origin, e.data);
                                if (r === false) {
                                    return false;
                                }
                            }
                            if ($$.appearsJson(e.data))  {
                                try {
                                    data = sfdcJson.parse(e.data);
                                } catch (ignore) {
                                    // Ignore parsing errors of any non json objects sent from other frames
                                }
                                // If we could parse the data and there is a targetModule make sure it is for us
                                if (!$$.isNil(data) && ($$.isNil(data.targetModule) || data.targetModule === "Canvas")) {
                                    callback(data, r);
                                }
                            }
                        }
                    };
                }
                if (window.addEventListener) {
                    window.addEventListener('message', internalCallback, false);
                } else {
                    window.attachEvent('onmessage', internalCallback);
                }
            }
        }
        
        /**
        * @description Removes the message event listener
        * @public     
        */
        function removeListener() {

            // browser supports window.postMessage
            if (window.postMessage) {
                if (window.removeEventListener) {
                    window.removeEventListener('message', internalCallback, false);
                } else {
                    window.detachEvent('onmessage', internalCallback);
                }
            }
        }

        return {
            post : postMessage,
            receive : receiveMessage,
            remove : removeListener
        };
    }());

    $$.module('Sfdc.canvas.xd', module);

}(Sfdc.canvas, this));
