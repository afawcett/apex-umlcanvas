package com.apexumlcanvas.controllers;

import javax.servlet.http.HttpSession;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;

import canvas.CanvasRequest;
import canvas.SignedRequest;

@Controller
@RequestMapping("/canvas")
public class CanvasController {

	@RequestMapping(method = RequestMethod.POST)
	public String canvasRequest(@RequestParam("signed_request") String signedRequest, HttpSession session)
	{
	    String secret = System.getenv("CANVAS_CONSUMER_SECRET");
	    CanvasRequest request = SignedRequest.verifyAndDecode(signedRequest, secret);
		session.setAttribute("canvasRequest", request);
		session.setAttribute("session", null); // TODO: Need to figure out how to sync Spring Session with Salesforce Session switching
		return "redirect:umlcanvas"; // Change this to redirect:navigator to load the jsmindmap demo
	}
}
