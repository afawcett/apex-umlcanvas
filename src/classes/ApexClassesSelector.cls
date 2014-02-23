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