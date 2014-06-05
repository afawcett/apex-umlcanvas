/**
 * Copyright (c) 2014, Apex UML
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification,
 *   are permitted provided that the following conditions are met:
 *
 * - Redistributions of source code must retain the above copyright notice,
 *      this list of conditions and the following disclaimer.
 * - Redistributions in binary form must reproduce the above copyright notice,
 *      this list of conditions and the following disclaimer in the documentation
 *      and/or other materials provided with the distribution.
 * - Neither the name of the Apex UML, inc nor the names of its contributors
 *      may be used to endorse or promote products derived from this software without
 *      specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 *  ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 *  OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
 *  THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 *  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS
 *  OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 *  OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 *  ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
**/

@IsTest
private class UmlControllerTest 
{
	private static testmethod void testUmlControllerApexClassesJSONEncoded()
	{
		system.debug( new UmlController().apexClassesJSONEncoded );
	}
	
    private static testmethod void testUmlControllerSymbolTableMethod()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testSymbolTableResponse 
                        },
                    new Integer[] { 
                        200 // GET Success
                    }));

        // User selects a class from the list and renders initial SymbolTable
        ToolingApi.SymbolTable symbolTable = UmlController.symbolTable('UmlService');
        System.assertEquals('UmlService', symbolTable.name);
        System.assertEquals(5, symbolTable.methods.size());
        System.assertEquals(0, symbolTable.externalReferences.size());
    }

    private static testmethod void testUmlControllerSymbolTableMethodClassDoesNotExist()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testSymbolTableClassNotFoundResponse 
                        },
                    new Integer[] { 
                        200 // GET Success
                    }));

        // Look for a class that does not exist
        string classNameThatDoesNotExist = 'foo_bar';
        try
        {
            ToolingApi.SymbolTable symbolTableDNE = UmlController.symbolTable(classNameThatDoesNotExist);
            System.assert(false,'UmlController.symbolTable(\''+classNameThatDoesNotExist+'\') did not produce expected UmlService.UmlServiceException');
        }
        catch (UmlService.UmlServiceException use)
        {
            system.debug('\n\n'+use.getStackTraceString()+'\n\n');
            System.assert(true);
        }
        catch (Exception e)
        {
            System.assert(false,'UmlController.symbolTable(\'foo_bar\') produced exception of '+e);
        }
    }

    private static testmethod void testUmlControllerSymbolTableMethodWithAsyncRequestIdClassDoesNotExist()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testSymbolTableClassNotFoundResponse 
                        },
                    new Integer[] { 
                        200 // GET Success
                    }));

        // Look for a class that does not exist
        string classNameThatDoesNotExist = 'foo_bar';
        try
        {
            ToolingApi.SymbolTable symbolTableDNE = UmlController.symbolTableFromCompile('fakeAsyncRequestId', classNameThatDoesNotExist);
            System.assert(false,'UmlController.symbolTable(\''+classNameThatDoesNotExist+'\') did not produce expected UmlService.UmlServiceException');
        }
        catch (UmlService.UmlServiceException use)
        {
        	system.debug('\n\n'+use.getStackTraceString()+'\n\n');
            System.assert(true);
        }
        catch (Exception e)
        {
            system.debug('exception seen is === '+e);
            system.debug('\n\n'+e.getStackTraceString()+'\n\n');
            System.assert(false,'UmlController.symbolTable(\'foo_bar\') produced exception of '+e);
        }
    }

    private static testmethod void testUmlControllerCompileMethod()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testQueryMetadataContainerResponse,
                        testDeleteMetadataContainerResponse,
                        testInsertMetadataContainerResponse,
                        testInsertApexClassMemberResponse,
                        testInsertContainerAsyncResponse,
                        testQueryAsyncContainerResponse1,
                        testQueryAsyncContainerResponse2,
                        testSymbolTableExternalsResponse
                        },
                    new Integer[] { 
                        200, // GET Success
                        204, // DELETE Success
                        201, // POST Success
                        201, // POST Success
                        201, // POST Success
                        200, // GET Success
                        200, // GET Success
                        200  // GET Success
                    }));

        // Page starts background compile
        ToolingApi.ContainerAsyncRequest asyncRequest = UmlController.compile('UmlService');
        System.assertEquals('Queued', asyncRequest.state);
        
        // Page queries background compile
        asyncRequest = UmlController.containerAsyncRequest(asyncRequest.Id);
        System.assertEquals('Completed', asyncRequest.state);
        
        // Page queries SymbolTable (now with external references populated)
        ToolingApi.SymbolTable symbolTable = UmlController.symbolTableFromCompile(asyncRequest.metadataContainerId, 'UmlService');
        System.assertEquals('UmlService', symbolTable.name);
        System.assertEquals(5, symbolTable.methods.size());
        System.assertEquals(15, symbolTable.externalReferences.size());

    }

    private static testmethod void testUmlControllerCompileMethodClassDoesNotExist()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testSymbolTableClassNotFoundResponse
                        },
                    new Integer[] { 
                        200 // GET Success
                    }));

        string classNameThatDoesNotExist = 'foo_bar';

        // Page starts background compile on a class that does not exist
        try
        {
            ToolingApi.ContainerAsyncRequest asyncRequestDNE = UmlController.compile(classNameThatDoesNotExist);
            System.assert(false,'UmlController.compile(\''+classNameThatDoesNotExist+'\') did not produce expected UmlService.UmlServiceException');
        }
        catch (UmlService.UmlServiceException use)
        {
            system.debug('\n\n'+use.getStackTraceString()+'\n\n');
            System.assert(true);
        }
        catch (Exception e)
        {
            system.debug('exception seen is === '+e);
            system.debug('\n\n'+e.getStackTraceString()+'\n\n');
            System.assert(false,'UmlController.compile(\'foo_bar\') produced exception of '+e);
        }
    }

    private static testmethod void testUmlControllerCompileMethodClassCreateFails()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testQueryMetadataContainerResponse,
                        testDeleteMetadataContainerResponse,
                        testInsertMetadataContainerFailedResponse
                        },
                    new Integer[] { 
                        200, // GET Success
                        204, // DELETE Success
                        201 // POST Success
                    }));

        string classNameThatDoesNotExist = 'foo_bar';

        // Page starts background compile
        try
        {
            ToolingApi.ContainerAsyncRequest asyncRequest = UmlController.compile('UmlService');
            System.assert(false,'UmlController.compile(\''+classNameThatDoesNotExist+'\') did not produce expected UmlService.UmlServiceException');
        }
        catch (UmlService.UmlServiceException use)
        {
            system.debug('\n\n'+use.getStackTraceString()+'\n\n');
            System.assert(true);
        }
        catch (Exception e)
        {
            system.debug('exception seen is === '+e);
            system.debug('\n\n'+e.getStackTraceString()+'\n\n');
            System.assert(false,'UmlController.compile(\'foo_bar\') produced exception of '+e);
        }
    }

    private static testmethod void testUmlControllerCompileMethod2ndClassCreateFails()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testQueryMetadataContainerResponse,
                        testDeleteMetadataContainerResponse,
                        testInsertMetadataContainerResponse,
                        testInsertApexClassMemberFailedResponse
                        },
                    new Integer[] { 
                        200, // GET Success
                        204, // DELETE Success
                        201, // POST Success
                        201 // POST Success
                    }));

        string classNameThatDoesNotExist = 'foo_bar';

        // Page starts background compile
        try
        {
            ToolingApi.ContainerAsyncRequest asyncRequest = UmlController.compile('UmlService');
            System.assert(false,'UmlController.compile(\''+classNameThatDoesNotExist+'\') did not produce expected UmlService.UmlServiceException');
        }
        catch (UmlService.UmlServiceException use)
        {
            system.debug('\n\n'+use.getStackTraceString()+'\n\n');
            System.assert(true);
        }
        catch (Exception e)
        {
            system.debug('exception seen is === '+e);
            system.debug('\n\n'+e.getStackTraceString()+'\n\n');
            System.assert(false,'UmlController.compile(\'foo_bar\') produced exception of '+e);
        }
    }

    private static testmethod void testUmlControllerCompileMethod3rdClassCreateFails()
    {
        Test.setMock(HttpCalloutMock.class, 
            new ToolingAPIMock(
                    new String[] { 
                        testQueryMetadataContainerResponse,
                        testDeleteMetadataContainerResponse,
                        testInsertMetadataContainerResponse,
                        testInsertApexClassMemberResponse,
                        testInsertContainerAsyncFailedResponse
                        },
                    new Integer[] { 
                        200, // GET Success
                        204, // DELETE Success
                        201, // POST Success
                        201, // POST Success
                        201 // POST Success
                    }));

        string classNameThatDoesNotExist = 'foo_bar';

        // Page starts background compile
        try
        {
            ToolingApi.ContainerAsyncRequest asyncRequest = UmlController.compile('UmlService');
            System.assert(false,'UmlController.compile(\''+classNameThatDoesNotExist+'\') did not produce expected UmlService.UmlServiceException');
        }
        catch (UmlService.UmlServiceException use)
        {
            system.debug('\n\n'+use.getStackTraceString()+'\n\n');
            System.assert(true);
        }
        catch (Exception e)
        {
            system.debug('exception seen is === '+e);
            system.debug('\n\n'+e.getStackTraceString()+'\n\n');
            System.assert(false,'UmlController.compile(\'foo_bar\') produced exception of '+e);
        }
    }

	public class ToolingAPIMock implements HttpCalloutMock 
	{
		private Integer testResponseIndex;
		private List<String> testResponses;
		private List<Integer> testStatusCodes;
		
		public ToolingAPIMock(List<String> testResponses, List<Integer> testStatusCodes)
		{
			this.testResponseIndex = 0;
			this.testResponses = testResponses;
			this.testStatusCodes = testStatusCodes;
		}
		
		public HTTPResponse respond(HTTPRequest req) 
		{		
			HttpResponse res = new HttpResponse();
			if(testResponses[testResponseIndex]!=null)
				res.setBody(testResponses[testResponseIndex]);
			res.setStatusCode(testStatusCodes[testResponseIndex]);
			testResponseIndex++;
			return res;	
		}
	}

    // System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/query/?q=Select+Name%2C+SymbolTable+From+ApexClass+Where+Name+%3D+%27UmlService%27, Method=GET]
    private static final String testSymbolTableResponse = 
        '{"size":1,"totalSize":1,"done":true,"entityTypeName":"ApexClass","records":[{"attributes":{"type":"ApexClass","url":"/services/data/v29.0/tooling/sobjects/ApexClass/01pi00000057VInAAM"},"Name":"UmlService","SymbolTable":{"name":"UmlService","constructors":[],"interfaces":[],"key":"01pi00000057VIn","methods":[{"returnType":"SymbolTable","parameters":[{"name":"className","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"symbolTable","location":{"column":39,"line":29},"type":null,"references":[]},{"returnType":"ContainerAsyncRequest","parameters":[{"name":"className","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"compile","location":{"column":49,"line":42},"type":null,"references":[]},{"returnType":"ContainerAsyncRequest","parameters":[{"name":"asyncRequestId","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"containerAsyncRequest","location":{"column":49,"line":90},"type":null,"references":[]},{"returnType":"SymbolTable","parameters":[{"name":"asyncRequestId","type":"String"},{"name":"className","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"symbolTable","location":{"column":39,"line":102},"type":null,"references":[]},{"returnType":"UmlServiceException","parameters":[{"name":"saveResult","type":"SaveResult"}],"visibility":"PRIVATE","modifiers":["STATIC"],"name":"makeException","location":{"column":37,"line":121},"type":null,"references":[]}],"properties":[],"id":"01pi00000057VIn","namespace":null,"innerClasses":[{"name":"UmlServiceException","constructors":[],"interfaces":[],"key":null,"methods":[],"properties":[],"id":null,"namespace":null,"innerClasses":[],"variables":[],"externalReferences":[],"tableDeclaration":{"modifiers":[],"name":"UmlServiceException","location":{"column":15,"line":116},"type":"UmlServiceException","references":[]}}],"variables":[{"modifiers":[],"name":"className","location":{"column":58,"line":29},"type":"String","references":[]},{"modifiers":[],"name":"toolingAPI","location":{"column":14,"line":31},"type":"ToolingAPI","references":[]},{"modifiers":[],"name":"apexClasses","location":{"column":30,"line":32},"type":"LIST","references":[]},{"modifiers":[],"name":"className","location":{"column":64,"line":42},"type":"String","references":[]},{"modifiers":[],"name":"classes","location":{"column":26,"line":45},"type":"Map","references":[]},{"modifiers":[],"name":"tooling","location":{"column":14,"line":51},"type":"ToolingAPI","references":[]},{"modifiers":[],"name":"containers","location":{"column":38,"line":52},"type":"LIST","references":[]},{"modifiers":[],"name":"container","location":{"column":32,"line":59},"type":"MetadataContainer","references":[]},{"modifiers":[],"name":"containerSaveResult","location":{"column":25,"line":61},"type":"SaveResult","references":[]},{"modifiers":[],"name":"containerId","location":{"column":6,"line":64},"type":"Id","references":[]},{"modifiers":[],"name":"apexClassMember","location":{"column":30,"line":67},"type":"ApexClassMember","references":[]},{"modifiers":[],"name":"apexClassMemberSaveResult","location":{"column":25,"line":71},"type":"SaveResult","references":[]},{"modifiers":[],"name":"asyncRequest","location":{"column":36,"line":76},"type":"ContainerAsyncRequest","references":[]},{"modifiers":[],"name":"asyncRequestSaveResult","location":{"column":25,"line":79},"type":"SaveResult","references":[]},{"modifiers":[],"name":"asyncRequestId","location":{"column":78,"line":90},"type":"String","references":[]},{"modifiers":[],"name":"toolingAPI","location":{"column":14,"line":93},"type":"ToolingAPI","references":[]},{"modifiers":[],"name":"asyncRequest","location":{"column":36,"line":94},"type":"ContainerAsyncRequest","references":[]},{"modifiers":[],"name":"asyncRequestId","location":{"column":58,"line":102},"type":"String","references":[]},{"modifiers":[],"name":"className","location":{"column":81,"line":102},"type":"String","references":[]},{"modifiers":[],"name":"toolingAPI","location":{"column":14,"line":104},"type":"ToolingAPI","references":[]},{"modifiers":[],"name":"apexClasses","location":{"column":36,"line":105},"type":"LIST","references":[]},{"modifiers":[],"name":"saveResult","location":{"column":73,"line":121},"type":"SaveResult","references":[]},{"modifiers":[],"name":"message","location":{"column":10,"line":123},"type":"String","references":[]},{"modifiers":[],"name":"error","location":{"column":24,"line":124},"type":"Error","references":[]}],"externalReferences":[],"tableDeclaration":{"modifiers":[],"name":"UmlService","location":{"column":14,"line":27},"type":"UmlService","references":[]}}}],"queryLocator":null}';
    
    // System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/query/?q=Select+Name%2C+SymbolTable+From+ApexClass+Where+Name+%3D+%27foo_bar%27, Method=GET]
    private static final String testSymbolTableClassNotFoundResponse = 
        '{"size":0,"totalSize":0,"done":true,"records":[],"queryLocator":null,"entityTypeName":null}';
    
	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/query/?q=SELECT+Id%2C+Name+FROM+MetadataContainer+WHERE+Name+%3D+%27ApexNavigator%27, Method=GET]
	private static final String testQueryMetadataContainerResponse = 
		'{"size":1,"totalSize":1,"done":true,"entityTypeName":"MetadataContainer","records":[{"attributes":{"type":"MetadataContainer","url":"/services/data/v29.0/tooling/sobjects/MetadataContainer/1dci00000002LbxAAE"},"Id":"1dci00000002LbxAAE","Name":"ApexNavigator"}],"queryLocator":null}';	

	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/MetadataContainer/1dci00000002LbsAAE, Method=DELETE]
	private static final String testDeleteMetadataContainerResponse = 
		null;

	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/MetadataContainer, Method=POST]
	private static final String testInsertMetadataContainerResponse = 
		'{"id":"1dci00000002LbxAAE","success":true,"errors":[]}';

    // System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/MetadataContainer, Method=POST]
    private static final String testInsertMetadataContainerFailedResponse = 
        '{"success":false,"id":null,"errors":[{"statusCode":"401","message":"SOMETHING TERRIBLE HAS HAPPENED","fields":["field1"]}]}';

    // System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/ApexClassMember, Method=POST]
    private static final String testInsertApexClassMemberResponse = 
        '{"id":"400i00000006KdUAAU","success":true,"errors":[]}';

    // System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/ApexClassMember, Method=POST]
    private static final String testInsertApexClassMemberFailedResponse = 
        '{"success":false,"id":null,"errors":[{"statusCode":"401","message":"SOMETHING TERRIBLE HAS HAPPENED","fields":["field1"]}]}';

	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/ContainerAsyncRequest, Method=POST]
	private static final String testInsertContainerAsyncResponse = 
		'{"id":"1dri0000000dm94AAA","success":true,"errors":[]}';

    // System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/sobjects/ContainerAsyncRequest, Method=POST]
    private static final String testInsertContainerAsyncFailedResponse = 
        '{"success":false,"id":null,"errors":[{"statusCode":"401","message":"SOMETHING TERRIBLE HAS HAPPENED","fields":["field1"]}]}';

	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/query/?q=SELECT+Id%2C+State%2C+MetadataContainerId%2C+CompilerErrors+FROM+ContainerAsyncRequest+WHERE+Id+%3D+%271dri0000000dm94AAA%27, Method=GET] 
	private static final String testQueryAsyncContainerResponse1 = 
		'{"size":1,"totalSize":1,"done":true,"entityTypeName":"ContainerAsyncRequest","records":[{"attributes":{"type":"ContainerAsyncRequest","url":"/services/data/v29.0/tooling/sobjects/ContainerAsyncRequest/1dri0000000dm94AAA"},"Id":"1dri0000000dm94AAA","State":"Queued","MetadataContainerId":"1dci00000002LbxAAE","CompilerErrors":null}],"queryLocator":null}';

	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/query/?q=SELECT+Id%2C+State%2C+MetadataContainerId%2C+CompilerErrors+FROM+ContainerAsyncRequest+WHERE+Id+%3D+%271dri0000000dm94AAA%27, Method=GET]
	private static final String testQueryAsyncContainerResponse2 = 
		'{"size":1,"totalSize":1,"done":true,"entityTypeName":"ContainerAsyncRequest","records":[{"attributes":{"type":"ContainerAsyncRequest","url":"/services/data/v29.0/tooling/sobjects/ContainerAsyncRequest/1dri0000000dm94AAA"},"Id":"1dri0000000dm94AAA","State":"Completed","MetadataContainerId":"1dci00000002LbxAAE","CompilerErrors":"[]"}],"queryLocator":null}';

	// System.HttpRequest[Endpoint=https://na15.salesforce.com/services/data/v29.0/tooling/query/?q=SELECT+ContentEntityId%2C+ContentEntity.Name%2C+SymbolTable+FROM+ApexClassMember+WHERE+MetadataContainerId+%3D+%271dci00000002LbxAAE%27+AND+ContentEntity.Name+%3D+%27UmlService%27, Method=GET]
	private static final String testSymbolTableExternalsResponse = 
		'{"size":1,"totalSize":1,"done":true,"records":[{"attributes":{"type":"ApexClassMember","url":"/services/data/v29.0/tooling/sobjects/ApexClassMember/400i00000006KdUAAU"},"ContentEntityId":"01pi00000057VInAAM","ContentEntity":{"attributes":{"type":"ApexClass","url":"/services/data/v29.0/tooling/sobjects/ApexClass/01pi00000057VInAAM"},"Name":"UmlService"},"SymbolTable":{"name":"UmlService","constructors":[],"interfaces":[],"key":"01pi00000057VIn","methods":[{"returnType":"SymbolTable","parameters":[{"name":"className","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"symbolTable","location":{"column":39,"line":29},"type":null,"references":[]},{"returnType":"ContainerAsyncRequest","parameters":[{"name":"className","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"compile","location":{"column":49,"line":42},"type":null,"references":[]},{"returnType":"ContainerAsyncRequest","parameters":[{"name":"asyncRequestId","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"containerAsyncRequest","location":{"column":49,"line":90},"type":null,"references":[]},{"returnType":"SymbolTable","parameters":[{"name":"asyncRequestId","type":"String"},{"name":"className","type":"String"}],"visibility":"PUBLIC","modifiers":["STATIC"],"name":"symbolTable","location":{"column":39,"line":102},"type":null,"references":[]},{"returnType":"UmlServiceException","parameters":[{"name":"saveResult","type":"SaveResult"}],"visibility":"PRIVATE","modifiers":["STATIC"],"name":"makeException","location":{"column":37,"line":121},"type":null,"references":[{"column":10,"line":63},{"column":10,"line":73},{"column":10,"line":81}]}],"properties":[],"id":"01pi00000057VIn","variables":[{"modifiers":[],"name":"className","location":{"column":58,"line":29},"type":"String","references":[{"column":25,"line":36},{"column":50,"line":38}]},{"modifiers":[],"name":"toolingAPI","location":{"column":14,"line":31},"type":"ToolingAPI","references":[{"column":4,"line":33}]},{"modifiers":[],"name":"apexClasses","location":{"column":30,"line":32},"type":"LIST","references":[{"column":6,"line":37},{"column":10,"line":39}]},{"modifiers":[],"name":"className","location":{"column":64,"line":42},"type":"String","references":[{"column":62,"line":46},{"column":50,"line":48},{"column":38,"line":68},{"column":49,"line":69}]},{"modifiers":[],"name":"classes","location":{"column":26,"line":45},"type":"Map","references":[{"column":6,"line":47},{"column":26,"line":68},{"column":37,"line":69}]},{"modifiers":[],"name":"tooling","location":{"column":14,"line":51},"type":"ToolingAPI","references":[{"column":4,"line":53},{"column":4,"line":56},{"column":47,"line":61},{"column":53,"line":71},{"column":50,"line":79},{"column":4,"line":83}]},{"modifiers":[],"name":"containers","location":{"column":38,"line":52},"type":"LIST","references":[{"column":68,"line":56},{"column":6,"line":55},{"column":27,"line":55}]},{"modifiers":[],"name":"container","location":{"column":32,"line":59},"type":"MetadataContainer","references":[{"column":3,"line":60},{"column":69,"line":61}]},{"modifiers":[],"name":"containerSaveResult","location":{"column":25,"line":61},"type":"SaveResult","references":[{"column":24,"line":63},{"column":7,"line":62},{"column":20,"line":64}]},{"modifiers":[],"name":"containerId","location":{"column":6,"line":64},"type":"Id","references":[{"column":41,"line":70},{"column":38,"line":77}]},{"modifiers":[],"name":"apexClassMember","location":{"column":30,"line":67},"type":"ApexClassMember","references":[{"column":3,"line":68},{"column":3,"line":69},{"column":3,"line":70},{"column":75,"line":71}]},{"modifiers":[],"name":"apexClassMemberSaveResult","location":{"column":25,"line":71},"type":"SaveResult","references":[{"column":24,"line":73},{"column":7,"line":72}]},{"modifiers":[],"name":"asyncRequest","location":{"column":36,"line":76},"type":"ContainerAsyncRequest","references":[{"column":3,"line":77},{"column":3,"line":78},{"column":72,"line":79},{"column":3,"line":82},{"column":10,"line":87}]},{"modifiers":[],"name":"asyncRequestSaveResult","location":{"column":25,"line":79},"type":"SaveResult","references":[{"column":24,"line":81},{"column":7,"line":80},{"column":23,"line":86}]},{"modifiers":[],"name":"asyncRequestId","location":{"column":78,"line":90},"type":"String","references":[{"column":23,"line":98}]},{"modifiers":[],"name":"toolingAPI","location":{"column":14,"line":93},"type":"ToolingAPI","references":[{"column":4,"line":95}]},{"modifiers":[],"name":"asyncRequest","location":{"column":36,"line":94},"type":"ContainerAsyncRequest","references":[{"column":10,"line":99}]},{"modifiers":[],"name":"asyncRequestId","location":{"column":58,"line":102},"type":"String","references":[{"column":40,"line":109},{"column":100,"line":112}]},{"modifiers":[],"name":"className","location":{"column":81,"line":102},"type":"String","references":[{"column":38,"line":110},{"column":50,"line":112}]},{"modifiers":[],"name":"toolingAPI","location":{"column":14,"line":104},"type":"ToolingAPI","references":[{"column":4,"line":106}]},{"modifiers":[],"name":"apexClasses","location":{"column":36,"line":105},"type":"LIST","references":[{"column":6,"line":111},{"column":10,"line":113}]},{"modifiers":[],"name":"saveResult","location":{"column":73,"line":121},"type":"SaveResult","references":[{"column":32,"line":124}]},{"modifiers":[],"name":"message","location":{"column":10,"line":123},"type":"String","references":[{"column":4,"line":125},{"column":34,"line":126}]},{"modifiers":[],"name":"error","location":{"column":24,"line":124},"type":"Error","references":[{"column":15,"line":125},{"column":43,"line":125}]}],"innerClasses":[{"name":"UmlServiceException","constructors":[],"interfaces":[],"key":null,"methods":[],"properties":[],"id":null,"variables":[],"innerClasses":[],"externalReferences":[],"namespace":null,"tableDeclaration":{"modifiers":[],"name":"UmlServiceException","location":{"column":15,"line":116},"type":"UmlServiceException","references":[{"column":17,"line":121},{"column":14,"line":126},{"column":14,"line":38},{"column":14,"line":48},{"column":14,"line":112}]}}],"externalReferences":[{"name":"SymbolTable","methods":[],"variables":[],"namespace":"ToolingApi","references":[{"column":16,"line":29},{"column":16,"line":102}]},{"name":"ToolingApi","methods":[],"variables":[],"namespace":null,"references":[{"column":3,"line":31},{"column":31,"line":31},{"column":3,"line":51},{"column":28,"line":51},{"column":3,"line":93},{"column":31,"line":93},{"column":3,"line":104},{"column":31,"line":104}]},{"name":"QueryResult","methods":[],"variables":[{"name":"records","references":[{"column":43,"line":36},{"column":78,"line":54},{"column":57,"line":86},{"column":46,"line":98},{"column":56,"line":110}]}],"namespace":null,"references":[]},{"name":"ToolingAPI","methods":[{"returnType":null,"argTypes":[],"parameters":[],"name":"query","references":[{"column":15,"line":33},{"column":12,"line":53},{"column":12,"line":83},{"column":15,"line":95},{"column":15,"line":106}]},{"returnType":null,"argTypes":[],"parameters":[],"name":"deleteSObject","references":[{"column":12,"line":56}]},{"returnType":null,"argTypes":[],"parameters":[],"name":"createSObject","references":[{"column":55,"line":61},{"column":61,"line":71},{"column":58,"line":79}]}],"variables":[],"namespace":null,"references":[]},{"name":"ContainerAsyncRequest","methods":[],"variables":[],"namespace":"ToolingApi","references":[{"column":16,"line":42}]},{"name":"ApexClassesSelector","methods":[{"returnType":null,"argTypes":[],"parameters":[],"name":"selectByName","references":[{"column":30,"line":46}]}],"variables":[],"namespace":null,"references":[{"column":8,"line":46}]},{"name":"MetadataContainer","methods":[],"variables":[],"namespace":"ToolingAPI","references":[{"column":3,"line":59},{"column":48,"line":59}]},{"name":"MetadataContainer","methods":[],"variables":[{"name":"name","references":[{"column":13,"line":60}]}],"namespace":null,"references":[]},{"name":"SaveResult","methods":[],"variables":[],"namespace":"ToolingAPI","references":[{"column":3,"line":61},{"column":3,"line":71},{"column":3,"line":79}]},{"name":"SaveResult","methods":[],"variables":[{"name":"success","references":[{"column":27,"line":62},{"column":33,"line":72},{"column":30,"line":80}]},{"name":"id","references":[{"column":40,"line":64}]},{"name":"Id","references":[{"column":46,"line":86}]},{"name":"errors","references":[{"column":43,"line":124}]}],"namespace":null,"references":[{"column":62,"line":121}]},{"name":"ApexClassMember","methods":[],"variables":[],"namespace":"ToolingAPI","references":[{"column":3,"line":67},{"column":52,"line":67}]},{"name":"ApexClassMember","methods":[],"variables":[{"name":"Body","references":[{"column":19,"line":68}]},{"name":"ContentEntityId","references":[{"column":19,"line":69}]},{"name":"MetadataContainerId","references":[{"column":19,"line":70}]}],"namespace":null,"references":[]},{"name":"ContainerAsyncRequest","methods":[],"variables":[],"namespace":"ToolingAPI","references":[{"column":3,"line":76},{"column":55,"line":76},{"column":16,"line":90},{"column":3,"line":94}]},{"name":"ContainerAsyncRequest","methods":[],"variables":[{"name":"metadataContainerId","references":[{"column":16,"line":77}]},{"name":"IsCheckOnly","references":[{"column":16,"line":78}]}],"namespace":null,"references":[]},{"name":"Error","methods":[],"variables":[{"name":"message","references":[{"column":21,"line":125}]},{"name":"fields","references":[{"column":49,"line":125}]}],"namespace":null,"references":[]}],"namespace":null,"tableDeclaration":{"modifiers":[],"name":"UmlService","location":{"column":14,"line":27},"type":"UmlService","references":[]}}}],"queryLocator":null,"entityTypeName":"ApexClassMember"}';
}