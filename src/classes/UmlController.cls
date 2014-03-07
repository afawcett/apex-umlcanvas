global class UmlController 
{
	public List<String> getApexClasses()
	{
		List<String> classNames = new List<String>();
		for(ApexClass clasz : new ApexClassesSelector().selectAllDefaultNamespace())
			classNames.add(clasz.Name);
		return classNames;
	}
	
	@RemoteAction
	public static ToolingApi.ContainerAsyncRequest compile(String className)
	{
		return UmlService.compile(className);
	}

	@RemoteAction 
	public static ToolingAPI.ContainerAsyncRequest containerAsyncRequest(String asyncRequestId)
	{
		return UmlService.containerAsyncRequest(asyncRequestId);
	}

    @RemoteAction
    global static ToolingApi.SymbolTable symbolTable(String className) 
    {
    	return UmlService.symbolTable(className);
    }

	@RemoteAction
	public static ToolingApi.SymbolTable symbolTableFromCompile(String asyncRequestId, String className)
	{
		return UmlService.symbolTable(asyncRequestId, className);
	}
}