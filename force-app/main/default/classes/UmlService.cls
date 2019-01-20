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

public class UmlService 
{
	private static ToolingApi.SymbolTable augumentSymbolTable(ToolingApi.SymbolTable symbolTable)
	{
		if (symbolTable != null)
		{
            Map<String, ApexClass> classes = new ApexClassesSelector().selectByName(new List<String> { symbolTable.name }); 
            
            list<string> classBodyLines = classes.get( symbolTable.name ).body.split('\n');
            
            if ( classBodyLines[symbolTable.tableDeclaration.location.line - 1].containsIgnoreCase(' interface ') )
            {
                symbolTable.isInterface = true;
            }
		}

		return symbolTable;
	}
	
    private static List<ToolingAPI.ApexClass> executeCalloutQueryForApexClass(final string className)
    {
        return (List<ToolingAPI.ApexClass>) 
                new ToolingApi().query(
                    'Select Name, SymbolTable ' + 
                    'From ApexClass ' + 
                   'Where Name = \'' + className + '\'').records;
    }

    /**
     * Helper to turn a bad SaveResult into an exception
     **/
    private static UmlServiceException makeException(final ToolingAPI.SaveResult saveResult)
    {
        String message = '';
        
        for (ToolingAPI.Error error : saveResult.errors)
        {
            message += error.message + String.join(error.fields, ',') + '\n';
        }
        
        return new UmlServiceException(message);
    }

	private static UmlServiceException makeException(final ToolingApi.ToolingAPIAuthorizationException tapiae)
	{
		string message = 'In order to use ApexUML, you must establish a Remote Site entry for \''+System.Url.getSalesforceBaseUrl().toExternalForm()+'\'';
        return new UmlServiceException(message);
	}
	
	public static ToolingApi.ContainerAsyncRequest compile(String className)
	{
		// Retrieve the ApexClass Body
		Map<String, ApexClass> classes = 
			new ApexClassesSelector().selectByName(new List<String> { className });	

		if (classes.isEmpty())
		{
			throw new UmlServiceException('Apex Class ' + className + ' not found');
		}

		// Delete any existing MetadataContainer?
		ToolingApi tooling = new ToolingApi();
        
        List<ToolingAPI.MetadataContainer> containers = new List<ToolingAPI.MetadataContainer>();
         
        try
        {
            containers = (List<ToolingAPI.MetadataContainer>)
                tooling.query(
                    'SELECT Id, Name FROM MetadataContainer WHERE Name = \'ApexNavigator\'').records;
        }
        catch (ToolingApi.ToolingAPIAuthorizationException tapiae)
        {
            throw makeException(tapiae);
        }
        
        if ( containers != null && ! containers.isEmpty() )
        {
            tooling.deleteSObject(ToolingAPI.SObjectType.MetadataContainer, containers[0].Id);
        }

		// Create MetadataContainer
		ToolingAPI.MetadataContainer container = new ToolingAPI.MetadataContainer();
		container.name = 'ApexNavigator';

        ToolingAPI.SaveResult containerSaveResult = new ToolingAPI.SaveResult();
        
        try
        {
            containerSaveResult = tooling.createSObject(container);
        }
        catch (ToolingApi.ToolingAPIAuthorizationException tapiae)
        {
            throw makeException(tapiae);
        }
        
		system.debug( 'containerSaveResult == '+containerSaveResult );
		
		if ( ! containerSaveResult.success )
        {
			throw makeException(containerSaveResult);
        }
		Id containerId = containerSaveResult.id;

		// Create ApexClassMember and associate them with the MetadataContainer
		ToolingAPI.ApexClassMember apexClassMember = new ToolingAPI.ApexClassMember();
		
		apexClassMember.Body = classes.get(className).Body;
		apexClassMember.ContentEntityId = classes.get(className).id;
		apexClassMember.MetadataContainerId = containerId;
		
		ToolingAPI.SaveResult apexClassMemberSaveResult = tooling.createSObject(apexClassMember);
		
		if ( ! apexClassMemberSaveResult.success )
		{
			throw makeException(apexClassMemberSaveResult);
		}

		// Create ContainerAysncRequest to deploy (check only) the Apex Classes and thus obtain the SymbolTable's
		ToolingAPI.ContainerAsyncRequest asyncRequest = new ToolingAPI.ContainerAsyncRequest();
		
		asyncRequest.metadataContainerId = containerId;
		asyncRequest.IsCheckOnly = true;
		
		ToolingAPI.SaveResult asyncRequestSaveResult = tooling.createSObject(asyncRequest);		
		
		if ( ! asyncRequestSaveResult.success )
		{
			throw makeException(asyncRequestSaveResult);
		}
		
		asyncRequest = ((List<ToolingAPI.ContainerAsyncRequest>)
			tooling.query(
				'SELECT Id, State, MetadataContainerId, CompilerErrors ' + 
				'FROM ContainerAsyncRequest ' + 
				'WHERE Id = \'' + asyncRequestSaveResult.Id + '\'').records)[0];
				
		return asyncRequest;
	}

	public static ToolingAPI.ContainerAsyncRequest containerAsyncRequest(String asyncRequestId)
	{
		// Query ContainerAsyncRequest and return to client
		ToolingApi toolingAPI = new ToolingApi();
		
		ToolingAPI.ContainerAsyncRequest asyncRequest = ((List<ToolingAPI.ContainerAsyncRequest>)
			toolingAPI.query(
				'SELECT Id, State, MetadataContainerId, CompilerErrors ' + 
				'FROM ContainerAsyncRequest ' + 
				'WHERE Id = \'' + asyncRequestId + '\'').records)[0];
		
		return asyncRequest;
	}

    public static ToolingApi.SymbolTable symbolTable(String className)
    {
        List<ToolingAPI.ApexClass> classes = new List<ToolingAPI.ApexClass>();
        
        try
        {
            classes = executeCalloutQueryForApexClass(className);
        }
        catch (ToolingApi.ToolingAPIAuthorizationException tapiae)
        {
            throw makeException(tapiae);
        }
        catch (System.CalloutException ce)
        {
        	system.debug('ce == '+ce.getStackTraceString());
        	if ('Read timed out'.equalsIgnoreCase(ce.getMessage()))
        	{
        		// try one more time
        		// This time if there is an exception thrown, just let it go up 
        		// the call stack
        		classes = executeCalloutQueryForApexClass(className);
        	}
        }

        if (classes == null || classes.isEmpty())
            throw new UmlServiceException('Apex Class ' + className + ' not found');
        
        return augumentSymbolTable(classes[0].symbolTable);
    }

	public static ToolingApi.SymbolTable symbolTable(String asyncRequestId, String className)
	{
		ToolingApi toolingAPI = new ToolingApi();
		
		List<ToolingAPI.ApexClassMember> classes = (List<ToolingAPI.ApexClassMember>) 
			toolingAPI.query(
				'SELECT ContentEntityId, ContentEntity.Name, SymbolTable ' + 
				'FROM ApexClassMember ' + 
				'WHERE MetadataContainerId = \'' + asyncRequestId + '\' '  + 
					'AND ContentEntity.Name = \'' + className + '\'').records;
		
		if (classes == null || classes.isEmpty())
			throw new UmlServiceException('Apex Class ' + className + ' not found in Metadata Container ' + asyncRequestId);
		
		return augumentSymbolTable(classes[0].symbolTable);
	}

	public class UmlServiceException extends Exception { }

}