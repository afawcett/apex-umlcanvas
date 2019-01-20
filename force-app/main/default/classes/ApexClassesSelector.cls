/**
 * Performs various queries on the ApexClass object
 **/
public with sharing class ApexClassesSelector
{
	// Consistent list of fields to query from this selector
	private static final String fieldsToQuery = 
			ApexClass.SystemModstamp.getDescribe().getName() + ','+ 
			ApexClass.Status.getDescribe().getName() + ','+
			ApexClass.NamespacePrefix.getDescribe().getName() + ','+
			ApexClass.Name.getDescribe().getName() + ','+
			ApexClass.LengthWithoutComments.getDescribe().getName() + ','+
			ApexClass.LastModifiedDate.getDescribe().getName() + ','+
			ApexClass.LastModifiedById.getDescribe().getName() + ','+
			ApexClass.IsValid.getDescribe().getName() + ','+
			ApexClass.Id.getDescribe().getName() + ','+
			ApexClass.CreatedDate.getDescribe().getName() + ','+
			ApexClass.CreatedById.getDescribe().getName() + ','+
			ApexClass.BodyCrc.getDescribe().getName() + ','+
			ApexClass.Body.getDescribe().getName() + ','+
			ApexClass.ApiVersion.getDescribe().getName();

	/**
	 * Query Apex classes by Name
	 **/
	public Map<String, ApexClass> selectByName(List<String> names)
	{
		Map<String, ApexClass> classesByName = new Map<String, ApexClass>();
		for(ApexCLass apexClass : (List<ApexClass>) 
			Database.query(
				String.format('SELECT {0} FROM {1} WHERE Name in :names ORDER BY {2}', 
					new List<String>{
						fieldsToQuery,
						ApexClass.sObjectType.getDescribe().getName(),
						ApexClass.Name.getDescribe().getName()})))
			classesByName.put(apexClass.Name, apexClass);
		return classesByName;
	}

	/**
	 * Returns ApexClass's with visible source code
	 **/	
	public List<ApexClass> selectAllVisible()
	{
        list<ApexClass> allClasses = (list<ApexClass>) 
			Database.query(String.format(
				'select {0} from {1} order by {2}', 
					new List<String>{
						fieldsToQuery,
						ApexClass.sObjectType.getDescribe().getName(),
						ApexClass.Name.getDescribe().getName()}));
		
		list<ApexClass> theClassesThatAreVisible = new list<ApexClass>();

        for (ApexClass aClass : allClasses)
        {
        	// if the "LengthWithoutComments" field is -1, then the class is from an 
        	// installed managed package and not visible in the current namespace
            if (string.valueOf(aClass.LengthWithoutComments) != '-1')
		    {
		        theClassesThatAreVisible.add( aClass );
		    }
        }
		
		return theClassesThatAreVisible;
	}	
}