public class UmlCanvasController 
{
	public List<String> getApexClasses()
	{
		List<String> classNames = new List<String>();
		for(ApexClass clasz : new ApexClassesSelector().selectAllDefaultNamespace())
			classNames.add(clasz.Name);
		return classNames;
	}
	
	@RemoteAction
	public static ToolingApi.SymbolTable symbolTable(String className)
	{
		return UmlCanvasService.symbolTable(className);
	}

	@RemoteAction
	public static ToolingApi.ContainerAsyncRequest compile(String className)
	{
		return UmlCanvasService.compile(className);
	}

	@RemoteAction 
	public static ToolingAPI.ContainerAsyncRequest containerAsyncRequest(String asyncRequestId)
	{
		return UmlCanvasService.containerAsyncRequest(asyncRequestId);
	}

	@RemoteAction
	public static ToolingApi.SymbolTable symbolTable(String asyncRequestId, String className)
	{
		return UmlCanvasService.symbolTable(asyncRequestId, className);
	}
}