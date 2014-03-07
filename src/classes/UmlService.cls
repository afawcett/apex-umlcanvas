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
		return null;
	}

	public static ToolingAPI.ContainerAsyncRequest containerAsyncRequest(String asyncRequestId)
	{
		return null;
	}

	public static ToolingApi.SymbolTable symbolTable(String asyncRequestId, String className)
	{
		return null;
	}

	public class UmlServiceException extends Exception { }
}