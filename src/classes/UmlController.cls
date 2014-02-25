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
		system.debug('method call to compile with className of '+className);
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
    	system.debug('method call to symbolTable with className of '+className);
    	
    	ToolingApi.SymbolTable st = UmlService.symbolTable(className);
    	
    	system.debug('\n\n\nst = '+st+'\n\n\n' );
    	
        return st;
    }

/*
	@RemoteAction
	public static ToolingApi.SymbolTable symbolTable(String asyncRequestId, String className)
	{
		return UmlService.symbolTable(asyncRequestId, className);
	}
*/
}