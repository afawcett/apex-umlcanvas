public class UmlService 
{
	public static ToolingApi.SymbolTable symbolTable(String className)
	{
		ToolingApi toolingAPI = new ToolingApi();
		List<ToolingAPI.ApexClass> apexClasses = (List<ToolingAPI.ApexClass>) 
			toolingAPI.query(
				'Select Name, SymbolTable ' + 
				'From ApexClass ' + 
				'Where Name = \'' + className + '\'').records;
		if(apexClasses.size()==0)
			throw new UmlServiceException('Apex Class ' + className + ' not found');
		return apexClasses[0].symbolTable;
	}

	public static ToolingApi.ContainerAsyncRequest compile(String className)
	{
		// Retrieve the ApexClass Body
		Map<String, ApexClass> classes = 
			new ApexClassesSelector().selectByName(new List<String> { className });	
		if(classes.size()==0)
			throw new UmlServiceException('Apex Class ' + className + ' not found');

		// Delete any existing MetadataContainer?
		ToolingApi tooling = new ToolingApi();
		List<ToolingAPI.MetadataContainer> containers = (List<ToolingAPI.MetadataContainer>)
			tooling.query(
				'SELECT Id, Name FROM MetadataContainer WHERE Name = \'ApexNavigator\'').records;
		if(containers!=null &&  containers.size()>0)
			tooling.deleteSObject(ToolingAPI.SObjectType.MetadataContainer, containers[0].Id);

		// Create MetadataContainer
		ToolingAPI.MetadataContainer container = new ToolingAPI.MetadataContainer();
		container.name = 'ApexNavigator';
		ToolingAPI.SaveResult containerSaveResult = tooling.createSObject(container);
		if(!containerSaveResult.success)
			throw makeException(containerSaveResult);
		Id containerId = containerSaveResult.id;

		// Create ApexClassMember and associate them with the MetadataContainer
		ToolingAPI.ApexClassMember apexClassMember = new ToolingAPI.ApexClassMember();
		apexClassMember.Body = classes.get(className).Body;
		apexClassMember.ContentEntityId = classes.get(className).id;
		apexClassMember.MetadataContainerId = containerId;
		ToolingAPI.SaveResult apexClassMemberSaveResult = tooling.createSObject(apexClassMember);
		if(!apexClassMemberSaveResult.success)
			throw makeException(apexClassMemberSaveResult);

		// Create ContainerAysncRequest to deploy (check only) the Apex Classes and thus obtain the SymbolTable's
		ToolingAPI.ContainerAsyncRequest asyncRequest = new ToolingAPI.ContainerAsyncRequest();
		asyncRequest.metadataContainerId = containerId;
		asyncRequest.IsCheckOnly = true;
		ToolingAPI.SaveResult asyncRequestSaveResult = tooling.createSObject(asyncRequest);		
		if(!asyncRequestSaveResult.success)
			throw makeException(asyncRequestSaveResult);		
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

	public static ToolingApi.SymbolTable symbolTable(String asyncRequestId, String className)
	{
		ToolingApi toolingAPI = new ToolingApi();
		List<ToolingAPI.ApexClassMember> apexClasses = (List<ToolingAPI.ApexClassMember>) 
			toolingAPI.query(
				'SELECT ContentEntityId, ContentEntity.Name, SymbolTable ' + 
				'FROM ApexClassMember ' + 
				'WHERE MetadataContainerId = \'' + asyncRequestId + '\' '  + 
					'AND ContentEntity.Name = \'' + className + '\'').records;
		if(apexClasses.size()==0)
			throw new UmlServiceException('Apex Class ' + className + ' not found in Metadata Container ' + asyncRequestId);
		return apexClasses[0].symbolTable;
	}

	public class UmlServiceException extends Exception { }

	/**
	 * Helper to turn a bad SaveResult into an exception
	 **/
	private static UmlServiceException makeException(ToolingAPI.SaveResult saveResult)
	{
		String message = '';
		for(ToolingAPI.Error error : saveResult.errors)
			message += error.message + String.join(error.fields, ',') + '\n';
		return new UmlServiceException(message);
	}
}