package com.apexumlcanvas.controllers;

import java.net.MalformedURLException;
import java.net.URL;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import javax.servlet.http.HttpSession;
import javax.xml.ws.BindingProvider;

import org.codehaus.jackson.map.ObjectMapper;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.apexumlcanvas.toolingapi.ApexClass;
import com.apexumlcanvas.toolingapi.ApexClassMember;
import com.apexumlcanvas.toolingapi.ContainerAsyncRequest;
import com.apexumlcanvas.toolingapi.MetadataContainer;
import com.apexumlcanvas.toolingapi.SObject;
import com.apexumlcanvas.toolingapi.SaveResult;
import com.apexumlcanvas.toolingapi.SessionHeader;
import com.apexumlcanvas.toolingapi.SforceServicePortType;
import com.apexumlcanvas.toolingapi.SforceServiceService;

import canvas.CanvasRequest;

@Controller
@RequestMapping("/navigator")
public class NavigatorController {

	@RequestMapping(method = RequestMethod.GET)
	public String load() throws Exception
	{
		// Page makes AJAX requests to compile, retrieve and render symbol table information requested by the user
		return "navigator";
	}
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET, value = "/compile")
	public String compile(HttpSession session) throws Exception
	{
		// Retrieve all ApexClass's (in future will likely need to provide a means to filter this)
		ToolingAPIConnection toolingAPI = createToolingAPIConnection(session);				
		ApexClass[] apexClasses = 
				toolingAPI.service.query("SELECT Id, Name, Body, SymbolTable FROM ApexClass", toolingAPI.session)
					.getRecords().toArray(new ApexClass[0]);
				
		// Delete any existing MetadataContainer?
		MetadataContainer[] containers = 
			toolingAPI.service.query("SELECT Id, Name FROM MetadataContainer WHERE Name = 'ApexNavigator'", toolingAPI.session)
				.getRecords().toArray(new MetadataContainer[0]);
		if(containers.length>0)
			toolingAPI.service.delete(Arrays.asList(containers[0].getId()), toolingAPI.session);
		
		// Create MetadataContainer
		MetadataContainer container = new MetadataContainer();
		container.setName("ApexNavigator");
		List<SaveResult> saveResults = toolingAPI.service.create(new ArrayList<SObject>(Arrays.asList(container)), toolingAPI.session);
		String containerId = saveResults.get(0).getId();
		
		// Create ApexClassMember's and associate them with the MetadataContainer
		List<ApexClassMember> apexClassMembers = new ArrayList<ApexClassMember>();
		for(ApexClass apexClass : apexClasses)
		{
			ApexClassMember apexClassMember = new ApexClassMember();
			apexClassMember.setBody(apexClass.getBody());
			apexClassMember.setContentEntityId(apexClass.getId());
			apexClassMember.setMetadataContainerId(containerId);
			apexClassMembers.add(apexClassMember);
		}
		saveResults = toolingAPI.service.create(new ArrayList<SObject>(apexClassMembers), toolingAPI.session);
		List<String> apexClassMemberIds = new ArrayList<String>();
		for(SaveResult saveResult : saveResults)
			apexClassMemberIds.add(saveResult.getId());			

		// Create ContainerAysncRequest to deploy (check only) the Apex Classes and thus obtain the SymbolTable's
		ContainerAsyncRequest ayncRequest = new ContainerAsyncRequest();
		ayncRequest.setMetadataContainerId(containerId);
		ayncRequest.setIsCheckOnly(true);
		saveResults = toolingAPI.service.create(new ArrayList<SObject>(Arrays.asList(ayncRequest)), toolingAPI.session);
		String containerAsyncRequestId = saveResults.get(0).getId();
		ayncRequest = (ContainerAsyncRequest) 
			toolingAPI.service.retrieve("State, MetadataContainerId", "ContainerAsyncRequest", Arrays.asList(containerAsyncRequestId), toolingAPI.session).get(0);
		return new ObjectMapper().writeValueAsString(ayncRequest);
	}
	
	@ResponseBody
	@RequestMapping(method = RequestMethod.GET, value = "/containerasyncrequest/{id}")
	public String containerAsyncRequest(HttpSession session, @PathVariable("id") String aysncRequestId) throws Exception
	{
		// Query ContainerAsyncRequest and return to client
		ToolingAPIConnection toolingAPI = createToolingAPIConnection(session);				
		ContainerAsyncRequest ayncRequest = (ContainerAsyncRequest) 
			toolingAPI.service.retrieve("State, MetadataContainerId", "ContainerAsyncRequest", Arrays.asList(aysncRequestId), toolingAPI.session).get(0);
		return new ObjectMapper().writeValueAsString(ayncRequest);
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET, value = "/containerasyncrequest/{id}/apexclassmembers")
	public String apexClassMembers(HttpSession session, @PathVariable("id") String aysncRequestId) throws Exception
	{
		// Provide the client with a list of ApexClassMember Id's and Apex Class Names from the aysnc request
		ToolingAPIConnection toolingAPI = createToolingAPIConnection(session);				
		ApexClassMember[] apexClassMembersWithSymbols = 
			toolingAPI.service.query(
						"SELECT Id, ContentEntity.Name " + 
						"FROM ApexClassMember " + 
						"WHERE MetadataContainerId = '" + aysncRequestId + "' " +
						"ORDER BY ContentEntity.Name", toolingAPI.session)
				.getRecords().toArray(new ApexClassMember[0]);		
		return new ObjectMapper().writeValueAsString(apexClassMembersWithSymbols);
	}

	@ResponseBody
	@RequestMapping(method = RequestMethod.GET, value = "/containerasyncrequest/{id}/{classname}/symboltable")
	public String symbolTable(HttpSession session, @PathVariable("id") String aysncRequestId, @PathVariable("classname") String apexClassName) throws Exception
	{
		// Return the SymbolTable for the given Apex class (scoped by the given ContainerAsyncRequest)
		ToolingAPIConnection toolingAPI = createToolingAPIConnection(session);		
		ApexClassMember[] apexClassMembersWithSymbols = 
				toolingAPI.service.query(
							"SELECT ContentEntityId, ContentEntity.Name, SymbolTable " + 
							"FROM ApexClassMember " + 
							"WHERE MetadataContainerId = '" + aysncRequestId + "' "  + 
								"AND ContentEntity.Name = '" + apexClassName + "'", toolingAPI.session)
					.getRecords().toArray(new ApexClassMember[0]);		
		return new ObjectMapper().writeValueAsString(apexClassMembersWithSymbols[0].getSymbolTable());
	}

	/**
	 * Creates and configures a Tooling API connection
	 * @param canvasRequest
	 * @return
	 * @throws MalformedURLException
	 */
	private static ToolingAPIConnection createToolingAPIConnection(HttpSession session) throws MalformedURLException
	{
		CanvasRequest canvasRequest = (CanvasRequest) session.getAttribute("canvasRequest");
		if(session.getAttribute("session")!=null)
			return (ToolingAPIConnection) session.getAttribute("session");
		ToolingAPIConnection toolingApi = new ToolingAPIConnection();
        SforceServiceService service = new SforceServiceService();
        toolingApi.service = service.getSforceService();
		BindingProvider bp = (BindingProvider)toolingApi.service;
		bp.getRequestContext().put(BindingProvider.ENDPOINT_ADDRESS_PROPERTY, "https://" + new URL(canvasRequest.getClient().getInstanceUrl()).getHost() + "/services/Soap/T/29.0");
		toolingApi.session = new SessionHeader();
		toolingApi.session.setSessionId(canvasRequest.getClient().getOAuthToken());
		session.setAttribute("session", toolingApi);
		return toolingApi;
	}
	
	/**
	 * Small class wraps the configured Tooling API service and the required Session Header to pass to each function 
	 */
	private static class ToolingAPIConnection
	{
		public SforceServicePortType service;
		public SessionHeader session;
	}
}
