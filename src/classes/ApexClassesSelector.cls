/**
 * Performs various queries on the ApexClass object
 **/
public with sharing class ApexClassesSelector extends fflib_SObjectSelector
{
	public List<Schema.SObjectField> getSObjectFieldList()
	{
		return new List<Schema.SObjectField> {
			ApexClass.SystemModstamp, 
			ApexClass.Status, 
			ApexClass.NamespacePrefix, 
			ApexClass.Name, 
			ApexClass.LengthWithoutComments, 
			ApexClass.LastModifiedDate, 
			ApexClass.LastModifiedById, 
			ApexClass.IsValid, 
			ApexClass.Id, 
			ApexClass.CreatedDate, 
			ApexClass.CreatedById, 
			ApexClass.BodyCrc, 
			ApexClass.Body, 
			ApexClass.ApiVersion			
		};
	}

	public Schema.SObjectType getSObjectType()
	{
		return ApexClass.sObjectType;
	}

	/**
	 * Query Apex classes by Id
	 **/
	public List<ApexClass> selectById(Set<Id> ids)
	{
		return (List<ApexClass>) selectSObjectsById(ids);
	}

	/**
	 * Query Apex classes by Name
	 **/
	public Map<String, ApexClass> selectByName(List<String> names)
	{
		Map<String, ApexClass> classesByName = new Map<String, ApexClass>();
		for(ApexCLass apexClass : (List<ApexClass>) 
			Database.query(
				String.format('SELECT {0} FROM {1} WHERE Name in :names ORDER BY {2}', 
					new List<String>{getFieldListString(),getSObjectName(),getOrderBy()})))
			classesByName.put(apexClass.Name, apexClass);
		return classesByName;
	}

	/**
	 * Returns ApexClass from the default (unmanaged) namespace
	 **/	
	public List<ApexClass> selectAllDefaultNamespace()
	{
		assertIsAccessible();
		return Database.query(String.format(
			'select {0} from {1} where NamespacePrefix = null order by {2}', 
				new List<String>{getFieldListString(),
					getSObjectName(),
					getOrderBy()}));
	}	
}