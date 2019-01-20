public class UmlController 
{
	public string apexClassesJSONEncoded
	{
		get
		{
			if (string.isBlank(apexClassesJSONEncoded))
			{
				list<string> classNames = new list<string>();
                for(ApexClass clasz : new ApexClassesSelector().selectAllVisible())
                {
                    classNames.add(clasz.Name);
                }
                apexClassesJSONEncoded = JSON.serialize(classNames);
			}
            return apexClassesJSONEncoded;
		}
		private set;
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
    public static ToolingApi.SymbolTable symbolTable(String className) 
    {
    	return UmlService.symbolTable(className);
    }

	@RemoteAction
	public static ToolingApi.SymbolTable symbolTableFromCompile(String asyncRequestId, String className)
	{
		return UmlService.symbolTable(asyncRequestId, className);
	}
}